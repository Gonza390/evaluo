import { NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { hasPremiumAccess } from '@/lib/premium';
import { isFreeStudyV2Active } from '@/lib/free-study-v2';
import { claimFreeStudyUnlock, getFreeStudyBank } from '@/lib/free-study-v2-server';
import type { PedagogicalArtifacts } from '@/lib/student-materials/pedagogy';
import type { PracticeQuestion } from '@/lib/student-materials/practice-modes';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const headers = { 'Cache-Control': 'private, no-store' };
const fail = (code:string,status=400) => NextResponse.json({error:code}, {status,headers});
const norm = (v:string) => v.normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();

/**
 * Revela la explicación previamente validada del primer error por pregunta.
 * El usuario siempre conoce la respuesta correcta; solo el razonamiento
 * detallado gasta uno de sus 15 desbloqueos vitalicios.
 */
export async function POST(request:Request) {
  const supabase = await createClientServer();
  const {data:{user}} = await supabase.auth.getUser();
  if (!user) return fail('unauthorized',401);
  let body:Record<string,unknown>;
  try {
    const value:unknown = await request.json();
    if (!value || typeof value !== 'object' || Array.isArray(value)) return fail('invalid_request');
    body = value as Record<string,unknown>;
  } catch { return fail('invalid_json'); }
  const {materialId,questionId,selectedAnswer} = body;
  if (typeof materialId !== 'string' || !UUID.test(materialId) ||
      typeof questionId !== 'string' || !questionId || questionId.length > 200 ||
      typeof selectedAnswer !== 'string' || !selectedAnswer || selectedAnswer.length > 2000) return fail('invalid_request');

  try {
    const admin = createAdminClient();
    const {data:material,error} = await admin.from('student_materials')
      .select('id,pedagogical_artifacts,processing_status')
      .eq('id',materialId).eq('user_id',user.id).maybeSingle();
    if (error) throw error;
    if (!material || material.processing_status !== 'ready') return fail('material_not_found',404);

    const artifacts = material.pedagogical_artifacts as PedagogicalArtifacts | null;
    const canonical = Array.isArray(artifacts?.questions)
      ? artifacts.questions.find(q => q.id === questionId && q.type === 'multiple_choice')
      : undefined;
    let target:{id:string;answer:string;options:string[];explanation:string}|undefined = canonical;
    if (!target) {
      for (const mode of ['true_false','cases'] as const) {
        const stored = await getFreeStudyBank<PracticeQuestion>({
          userId:user.id, materialId, mode,
        });
        const candidate = stored?.find(q => q.id === questionId);
        if (candidate) { target = candidate; break; }
      }
    }
    if (!target || !target.explanation?.trim() ||
        !Array.isArray(target.options) || !target.options.some(o => norm(o) === norm(selectedAnswer)) ||
        norm(target.answer) === norm(selectedAnswer)) return fail('not_a_verified_wrong_answer',422);

    const premium = await hasPremiumAccess(user.id);
    if (!isFreeStudyV2Active() || premium)
      return NextResponse.json({explanation:target.explanation,unlocked:true,remaining:null},{headers});

    const claim = await claimFreeStudyUnlock({
      userId:user.id,materialId,kind:'error_explanation',
      itemKey:materialId+':'+target.id,premium,
    });
    if (!claim.allowed) return NextResponse.json({
      unlocked:false,used:claim.used,limit:claim.limit,explanation:null,
    },{headers});
    return NextResponse.json({
      unlocked:true,used:claim.used,limit:claim.limit,
      explanation:target.explanation,alreadyUnlocked:claim.alreadyUnlocked,
    },{headers});
  } catch {
    return fail('explanation_unavailable',503);
  }
}
