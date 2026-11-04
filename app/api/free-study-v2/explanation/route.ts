import { NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { hasPremiumAccess } from '@/lib/premium';
import { isFreeStudyV2Active } from '@/lib/free-study-v2';
import { claimFreeStudyUnlock, getFreeStudyBank } from '@/lib/free-study-v2-server';
import type { PedagogicalArtifacts } from '@/lib/student-materials/pedagogy';
import type { PracticeQuestion } from '@/lib/student-materials/practice-modes';

const noCache = { 'Cache-Control': 'private, no-store' };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const norm = (value: string) => value.normalize('NFD')
  .replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const fail=(error:string,status=400) => NextResponse.json({error}, {status,headers:noCache});

/** Never trust the client's claimed correctness or rationale. */
export async function POST(request: Request) {
  const supabase = await createClientServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return fail('unauthorized',401);
  let body:Record<string,unknown>;
  try {
    const payload:unknown = await request.json();
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return fail('invalid_request');
    body=payload as Record<string,unknown>;
  } catch { return fail('invalid_json'); }
  const {materialId,questionId,selectedAnswer}=body;
  if(typeof materialId!=='string'||!uuid.test(materialId)||
     typeof questionId!=='string'||!questionId||questionId.length>200||
     typeof selectedAnswer!=='string'||!selectedAnswer||selectedAnswer.length>2000)
    return fail('invalid_request');

  try {
    const admin=createAdminClient();
    const {data:material,error}=await admin.from('student_materials')
      .select('id,processing_status,pedagogical_artifacts')
      .eq('user_id',user.id).eq('id',materialId).maybeSingle();
    if(error)throw error;
    if(!material||material.processing_status!=='ready')return fail('material_not_found',404);

    const artifacts=material.pedagogical_artifacts as PedagogicalArtifacts|null;
    const canonical=Array.isArray(artifacts?.questions)
      ? artifacts.questions.find(q=>q.id===questionId&&q.type==='multiple_choice')
      :undefined;
    let question:{id:string;answer:string;options:string[];explanation:string}|undefined=canonical;
    if(!question){
      for(const mode of ['true_false','cases'] as const){
        const stored=await getFreeStudyBank<PracticeQuestion>({userId:user.id,materialId,mode});
        question=stored?.find(item=>item.id===questionId);
        if(question)break;
      }
    }
    if(!question||!question.explanation?.trim()||!Array.isArray(question.options)||
       !question.options.some(answer=>norm(answer)===norm(selectedAnswer))||
       norm(question.answer)===norm(selectedAnswer))
      return fail('not_a_verified_wrong_answer',422);

    const premium=await hasPremiumAccess(user.id);
    if(!isFreeStudyV2Active()||premium)
      return NextResponse.json({unlocked:true,explanation:question.explanation,remaining:null},{headers:noCache});

    const claim=await claimFreeStudyUnlock({
      userId:user.id,materialId,kind:'error_explanation',
      itemKey:materialId+':'+question.id,premium,
    });
    if(!claim.allowed)return NextResponse.json({
      unlocked:false,explanation:null,used:claim.used,limit:claim.limit,
    },{headers:noCache});
    return NextResponse.json({
      unlocked:true,explanation:question.explanation,used:claim.used,
      limit:claim.limit,alreadyUnlocked:claim.alreadyUnlocked,
    },{headers:noCache});
  }catch{
    return fail('explanation_unavailable',503);
  }
}
