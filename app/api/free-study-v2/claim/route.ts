import { NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { hasPremiumAccess } from '@/lib/premium';
import { isFreeStudyV2Active } from '@/lib/free-study-v2';
import { premiumUpgradeForLimit, type PremiumGateReason } from '@/lib/premium-flow';
import { claimFreeStudyUnlock, getFreeStudyBank, type FreeStudyUnlockKind } from '@/lib/free-study-v2-server';
import type { PedagogicalArtifacts } from '@/lib/student-materials/pedagogy';

const noStore = { 'Cache-Control': 'private, no-store' };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const kinds = new Set<FreeStudyUnlockKind>([
  'multiple_choice', 'true_false', 'matching_round',
  'case', 'flashcard', 'simulator',
]);
const fail = (code: string, status = 400) =>
  NextResponse.json({ allowed: false, error: code }, { status, headers: noStore });

/**
 * Authenticated and source-verified claim before revealing a NEW exercise.
 * Never trust a client-supplied count, answer, key, or premium status.
 */
export async function POST(request: Request) {
  const supabase = await createClientServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return fail('unauthorized', 401);
  let input: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return fail('invalid_request');
    input = parsed as Record<string, unknown>;
  } catch { return fail('invalid_json'); }
  const materialId = input.materialId, kind = input.kind, itemKey = input.itemKey;
  if (typeof materialId !== 'string' || !UUID.test(materialId) ||
      typeof kind !== 'string' || !kinds.has(kind as FreeStudyUnlockKind) ||
      typeof itemKey !== 'string' || !itemKey || itemKey.length > 300) return fail('invalid_request');

  try {
    const { data: material, error } = await supabase.from('student_materials')
      .select('id,processing_status')
      .eq('user_id', user.id).eq('id', materialId).maybeSingle();
    if (error) throw error;
    if (!material || material.processing_status !== 'ready') return fail('material_not_found', 404);

    const premium = await hasPremiumAccess(user.id);
    if (!isFreeStudyV2Active() || premium)
      return NextResponse.json({ allowed:true, remaining:null }, { headers:noStore });

    const admin = createAdminClient();
    const type = kind as FreeStudyUnlockKind;
    let valid = false;

    if (type === 'multiple_choice' || type === 'flashcard') {
      const { data, error: artifactError } = await admin.from('student_materials')
        .select('pedagogical_artifacts')
        .eq('user_id', user.id).eq('id', materialId).maybeSingle();
      if (artifactError) throw artifactError;
      const artifacts = data?.pedagogical_artifacts as PedagogicalArtifacts | null;
      if (type === 'multiple_choice') {
        valid = Array.isArray(artifacts?.questions) &&
          artifacts.questions.some(q => q.id === itemKey && q.type === 'multiple_choice' &&
            q.options?.length >= 2 && q.options.includes(q.answer));
        if (!valid) {
          // Preguntas nuevas: la ruta de generación guarda solo ejercicios
          // con dos validaciones independientes y evidencia del documento.
          // No confiar nunca en la pregunta/clave enviada por el navegador.
          const { data: banks, error: bankError } = await admin
            .from('free_study_v2_banks' as never)
            .select('payload')
            .eq('user_id', user.id).eq('material_id', materialId)
            .like('mode','topic:%').limit(500);
          if (bankError) throw bankError;
          valid = (banks ?? []).some(entry => {
            const payload = (entry as {payload?: unknown}).payload;
            return Array.isArray(payload) && payload.some((raw: unknown) => {
              if (!raw || typeof raw !== 'object') return false;
              const q = raw as {id?:unknown;type?:unknown;answer?:unknown;options?:unknown};
              return q.id === itemKey && q.type === 'multiple_choice' &&
                typeof q.answer === 'string' && Array.isArray(q.options) &&
                q.options.length >= 2 && q.options.includes(q.answer);
            });
          });
        }
      } else {
        const index = /^flashcard:(\d+)$/.exec(itemKey);
        const i = index ? Number(index[1]) : -1;
        valid = Number.isInteger(i) && i >= 0 && i < 25 &&
          Array.isArray(artifacts?.flashcards) && Boolean(artifacts.flashcards[i]);
      }
    } else if (type === 'matching_round') {
      valid = itemKey === 'matching:first';
    } else if (type === 'simulator') {
      valid = itemKey === 'simulator:first';
    } else if (type === 'true_false' || type === 'case') {
      const mode = type === 'true_false' ? 'true_false' as const : 'cases' as const;
      const bank = await getFreeStudyBank<{id:string}>({userId:user.id,materialId,mode});
      valid = Boolean(bank?.some(q => q.id === itemKey));
    }
    if (!valid) return fail('item_not_in_verified_bank', 403);

    const result = await claimFreeStudyUnlock({
      // Namespace by material: otherwise flashcard:0 on another PDF would
      // reuse the first material's grant without consuming an account quota.
      userId:user.id, materialId, kind:type, itemKey:materialId+':'+itemKey, premium,
    });
    const reasons: Record<FreeStudyUnlockKind, PremiumGateReason> = {
      multiple_choice:'multiple_choice', true_false:'true_false',
      matching_round:'matching_round', case:'case', flashcard:'flashcard', simulator:'simulator',
    };
    const upgrade = result.allowed ? undefined
      : premiumUpgradeForLimit(reasons[type], {materialId});
    return NextResponse.json({
      allowed:result.allowed, used:result.used, limit:result.limit,
      alreadyUnlocked:result.alreadyUnlocked,
      ...(upgrade ? {upgrade} : {}),
    }, { headers:noStore });
  } catch {
    return fail('free_study_quota_unavailable', 503);
  }
}
