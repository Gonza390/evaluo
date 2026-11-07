import { NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { hasPremiumAccess } from '@/lib/premium';
import { isFreeStudyV2Active, FREE_STUDY_V2, freeUploadPeriod } from '@/lib/free-study-v2';
import { FREE_STUDY_KIND_LIMIT, type FreeStudyUnlockKind } from '@/lib/free-study-v2-server';
import { premiumUpgradeForLimit, type PremiumGateReason } from '@/lib/premium-flow';
import { PREMIUM_STUDY_LIMITS } from '@/lib/study-commercial-entitlements';

export const dynamic = 'force-dynamic';
const noStore = { 'Cache-Control': 'private, no-store' };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Quota = { used: number; limit: number; remaining: number; upgrade?: ReturnType<typeof premiumUpgradeForLimit> };

export async function GET(request: Request) {
  const supabase = await createClientServer();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({error:'unauthorized'},
    {status:401,headers:noStore});

  try {
    const premium = await hasPremiumAccess(user.id);
    if (!isFreeStudyV2Active()) return NextResponse.json({
      active:false, plan: premium ? 'premium' : 'free', quotas:null,
    }, {headers:noStore});
    if (premium) return NextResponse.json({
      active:true, plan:'premium', quotas:null,
      premiumLimits:PREMIUM_STUDY_LIMITS,
    }, {headers:noStore});

    const requestedId = new URL(request.url).searchParams.get('materialId');
    const admin = createAdminClient();
    // El contexto de regreso sólo debe usar un material realmente propio.
    let materialId: string | undefined;
    if (requestedId && UUID.test(requestedId)) {
      const {data:owned,error} = await supabase.from('student_materials')
        .select('id').eq('id',requestedId).eq('user_id',user.id).maybeSingle();
      if (error) throw error;
      materialId = owned?.id;
    }

    const [unlocks, upload, plan] = await Promise.all([
      admin.from('free_study_v2_unlocks' as never)
        .select('kind').eq('user_id',user.id).limit(120),
      admin.from('free_study_v2_monthly_upload_claims' as never)
        .select('user_id').eq('user_id',user.id).eq('period',freeUploadPeriod()).maybeSingle(),
      admin.from('free_study_v2_plan_claims' as never)
        .select('user_id').eq('user_id',user.id).maybeSingle(),
    ]);
    if (unlocks.error || upload.error || plan.error)
      return NextResponse.json({error:'quota_unavailable'},{status:503,headers:noStore});

    const counts = {} as Record<FreeStudyUnlockKind,number>;
    const kinds:FreeStudyUnlockKind[] = [
      'multiple_choice','true_false','matching_round','case','flashcard','simulator',
    ];
    for (const kind of kinds) counts[kind] = 0;
    for (const row of unlocks.data ?? []) {
      const kind = (row as {kind:string}).kind as FreeStudyUnlockKind;
      if (Object.prototype.hasOwnProperty.call(counts,kind)) counts[kind] += 1;
    }

    const makeQuota = (used:number, limit:number, reason:PremiumGateReason):Quota => {
      const remaining = Math.max(0, limit-used);
      return {used,limit,remaining,...(remaining===0
        ? {upgrade:premiumUpgradeForLimit(reason,{materialId})}: {})};
    };

    const quotas = {
      material_upload: makeQuota(upload.data ? 1:0,FREE_STUDY_V2.materialsPerMonth,'material_upload'),
      multiple_choice: makeQuota(counts.multiple_choice,FREE_STUDY_KIND_LIMIT.multiple_choice,'multiple_choice'),
      true_false: makeQuota(counts.true_false,FREE_STUDY_KIND_LIMIT.true_false,'true_false'),
      matching_round: makeQuota(counts.matching_round,FREE_STUDY_KIND_LIMIT.matching_round,'matching_round'),
      case: makeQuota(counts.case,FREE_STUDY_KIND_LIMIT.case,'case'),
      flashcard: makeQuota(counts.flashcard,FREE_STUDY_KIND_LIMIT.flashcard,'flashcard'),
      simulator: makeQuota(counts.simulator,FREE_STUDY_KIND_LIMIT.simulator,'simulator'),
      study_plan: makeQuota(plan.data ? 1:0,FREE_STUDY_V2.studyPlans,'study_plan'),
    };
    return NextResponse.json({active:true,plan:'free',quotas},
      {headers:noStore});
  } catch {
    return NextResponse.json({error:'quota_unavailable'},
      {status:503,headers:noStore});
  }
}
