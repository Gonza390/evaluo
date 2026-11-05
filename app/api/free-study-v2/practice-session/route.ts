import { NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { hasPremiumAccess } from '@/lib/premium';
import { isFreeStudyV2Active } from '@/lib/free-study-v2';
import { claimFreeStudyUnlock, listFreeStudyUnlockedKeys } from '@/lib/free-study-v2-server';
import { reserveFreeQuestionSession } from '@/lib/free-study-v2-practice-session';

export const dynamic = 'force-dynamic';
const noStore = { 'Cache-Control': 'private, no-store' };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type VerifiedQuestion = { id: string; type: string; options: string[]; answer: string };
function isVerifiedChoice(value: unknown): value is VerifiedQuestion {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<VerifiedQuestion>;
  return typeof item.id === 'string' && item.type === 'multiple_choice' &&
    typeof item.answer === 'string' && Array.isArray(item.options) &&
    item.options.length >= 2 && item.options.every(option => typeof option === 'string') &&
    item.options.includes(item.answer);
}

/** Reserve the entire visible Free batch BEFORE the student starts answering.
 * An insufficient quota shortens the batch; it never interrupts an active one.
 */
export async function POST(request: Request) {
  const supabase = await createClientServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401, headers: noStore });

  const raw: unknown = await request.json().catch(() => null);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw))
    return NextResponse.json({ error: 'invalid_request' }, { status: 400, headers: noStore });
  const input = raw as Record<string, unknown>;
  const materialId = input.materialId;
  const ids = input.questionIds;
  const maxQuestions = input.maxQuestions;
  if (typeof materialId !== 'string' || !uuid.test(materialId) ||
    !Array.isArray(ids) || ids.length < 1 || ids.length > 300 ||
    !ids.every(id => typeof id === 'string' && id.length > 0 && id.length <= 200) ||
    !Number.isInteger(maxQuestions) || (maxQuestions as number) < 1 ||
    (maxQuestions as number) > 20)
    return NextResponse.json({ error: 'invalid_request' }, { status: 400, headers: noStore });

  const candidateIds = [...new Set(ids as string[])];
  try {
    const { data: material, error: materialError } = await supabase.from('student_materials')
      .select('id,processing_status').eq('id', materialId).eq('user_id', user.id).maybeSingle();
    if (materialError) throw materialError;
    if (!material || material.processing_status !== 'ready')
      return NextResponse.json({ error: 'material_not_found' }, { status: 404, headers: noStore });

    const premium = await hasPremiumAccess(user.id);
    if (!isFreeStudyV2Active() || premium)
      return NextResponse.json({
        questionIds: candidateIds.slice(0, maxQuestions as number), exhausted: false,
      }, { headers: noStore });

    const admin = createAdminClient();
    const [artifactsQuery, banksQuery, unlocked] = await Promise.all([
      admin.from('student_materials').select('pedagogical_artifacts')
        .eq('id', materialId).eq('user_id', user.id).maybeSingle(),
      admin.from('free_study_v2_banks' as never).select('payload')
        .eq('user_id', user.id).eq('material_id', materialId)
        .like('mode', 'topic:%').limit(500),
      listFreeStudyUnlockedKeys({ userId: user.id, kind: 'multiple_choice', premium: false }),
    ]);
    if (artifactsQuery.error || banksQuery.error || !unlocked) throw new Error('practice_unavailable');

    const validIds = new Set<string>();
    const artifacts = artifactsQuery.data?.pedagogical_artifacts as { questions?: unknown } | null;
    if (Array.isArray(artifacts?.questions)) {
      for (const item of artifacts.questions) if (isVerifiedChoice(item)) validIds.add(item.id);
    }
    for (const row of banksQuery.data ?? []) {
      const payload = (row as { payload?: unknown }).payload;
      if (!Array.isArray(payload)) continue;
      for (const item of payload) if (isVerifiedChoice(item)) validIds.add(item.id);
    }
    const verifiedIds = candidateIds.filter(id => validIds.has(id));
    if (!verifiedIds.length)
      return NextResponse.json({ error: 'unverified_practice_questions' },
        { status: 422, headers: noStore });

    const unlockedIds = new Set(verifiedIds.filter(id => unlocked.has(materialId + ':' + id)));
    const reserved = await reserveFreeQuestionSession({
      candidateIds: verifiedIds,
      maxQuestions: maxQuestions as number,
      unlockedIds,
      claim: async questionId => (await claimFreeStudyUnlock({
        userId: user.id, materialId, kind: 'multiple_choice',
        itemKey: materialId + ':' + questionId, premium: false,
      })).allowed,
    });
    return NextResponse.json(reserved, { headers: noStore });
  } catch {
    // An outage is NOT a reason to display a Premium paywall. Claims are
    // idempotent, so retrying cannot charge any granted question twice.
    return NextResponse.json({ error: 'practice_reservation_unavailable' },
      { status: 503, headers: noStore });
  }
}
