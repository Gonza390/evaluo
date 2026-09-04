import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClientServer } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import {
  PREMIUM_MONTHLY_PRICE_ARS,
  PREMIUM_SEMESTER_PRICE_ARS,
} from '@/lib/payments/offers';
import { enforceRateLimit, getRequestClientKey, rateLimitHeaders } from '@/lib/rate-limit';
import {
  claimReferralAttribution,
  getReferralAttribution,
  normalizeReferralCode,
  REFERRAL_COOKIE_MAX_AGE_SECONDS,
  REFERRAL_COOKIE_NAME,
} from '@/lib/referrals';
import { trackServerAnalyticsEvent } from '@/lib/server-analytics';

type ReferralOfferCode = 'monthly' | 'semester';

type ReferralCodeRow = {
  id: string;
  code: string;
  partner_id: string;
  discount_percent: number | string;
  applies_to: 'all' | ReferralOfferCode;
  max_redemptions: number | null;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
};

function roundArs(value: number) {
  return Math.round(value * 100) / 100;
}

function jsonError(error: string, status: number, headers?: Headers) {
  return NextResponse.json({ error }, { status, headers });
}

export async function POST(request: Request) {
  let body: { code?: unknown; offerCode?: unknown } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError('invalid_request', 400);
  }

  const code = normalizeReferralCode(body.code);
  if (!code) return jsonError('invalid_referral_code', 422);

  const offerCode: ReferralOfferCode | null =
    body.offerCode === 'monthly' || body.offerCode === 'semester' ? body.offerCode : null;
  if (!offerCode) return jsonError('invalid_offer_code', 422);

  const supabase = await createClientServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const rateLimit = await enforceRateLimit({
    key: `referral-preview:${user?.id ?? 'anon'}:${getRequestClientKey(request)}`,
    limit: 20,
    windowMs: 15 * 60_000,
    failClosed: true,
  });
  if (!rateLimit.allowed) {
    return jsonError('rate_limited', 429, rateLimitHeaders(rateLimit));
  }

  const admin = createAdminClient() as unknown as SupabaseClient;
  const now = Date.now();

  const { data: rawReferralCode, error: codeError } = await admin
    .from('referral_codes')
    .select(
      'id, code, partner_id, discount_percent, applies_to, max_redemptions, starts_at, ends_at, is_active'
    )
    .eq('code', code)
    .limit(1)
    .maybeSingle();

  if (codeError) return jsonError('referral_service_unavailable', 503);
  if (!rawReferralCode) return jsonError('referral_code_unavailable', 404);

  const referralCode = rawReferralCode as ReferralCodeRow;
  const startsAt = referralCode.starts_at ? new Date(referralCode.starts_at).getTime() : null;
  const endsAt = referralCode.ends_at ? new Date(referralCode.ends_at).getTime() : null;
  if (
    !referralCode.is_active ||
    (startsAt !== null && Number.isFinite(startsAt) && startsAt > now) ||
    (endsAt !== null && Number.isFinite(endsAt) && endsAt <= now)
  ) {
    return jsonError('referral_code_unavailable', 404);
  }

  if (referralCode.applies_to !== 'all' && referralCode.applies_to !== offerCode) {
    return jsonError('referral_code_not_applicable', 409);
  }

  const { data: partner, error: partnerError } = await admin
    .from('referral_partners')
    .select('id, display_name, brand_id, status')
    .eq('id', referralCode.partner_id)
    .maybeSingle();
  if (partnerError) return jsonError('referral_service_unavailable', 503);
  if (!partner?.id || partner.status !== 'active' || !partner.brand_id) {
    return jsonError('referral_code_unavailable', 404);
  }

  const { data: brand, error: brandError } = await admin
    .from('referral_brands')
    .select('id, name, status')
    .eq('id', partner.brand_id)
    .maybeSingle();
  if (brandError) return jsonError('referral_service_unavailable', 503);
  if (!brand?.id || brand.status !== 'active') {
    return jsonError('referral_code_unavailable', 404);
  }

  if (referralCode.max_redemptions !== null) {
    const pendingCutoff = new Date(now - 60 * 60_000).toISOString();
    const [activatedResult, pendingResult] = await Promise.all([
      admin
        .from('payment_promotion_claims')
        .select('id', { count: 'exact', head: true })
        .eq('referral_code_id', referralCode.id)
        .eq('status', 'activated'),
      admin
        .from('payment_promotion_claims')
        .select('id', { count: 'exact', head: true })
        .eq('referral_code_id', referralCode.id)
        .eq('status', 'pending')
        .gte('reserved_at', pendingCutoff),
    ]);
    if (activatedResult.error || pendingResult.error) {
      return jsonError('referral_service_unavailable', 503);
    }
    if (
      (activatedResult.count ?? 0) + (pendingResult.count ?? 0) >=
      referralCode.max_redemptions
    ) {
      return jsonError('referral_code_limit_reached', 409);
    }
  }

  let monthlyPrice = PREMIUM_MONTHLY_PRICE_ARS;
  if (offerCode === 'monthly') {
    const { data: plan } = await admin
      .from('subscription_plans')
      .select('price_ars')
      .eq('code', 'premium')
      .eq('is_active', true)
      .maybeSingle();
    const configuredPrice = Number(plan?.price_ars);
    if (Number.isFinite(configuredPrice) && configuredPrice > 0) monthlyPrice = configuredPrice;
  }

  if (user) {
    let existing = null;
    try {
      existing = await getReferralAttribution(admin, user.id);
    } catch {
      return jsonError('referral_service_unavailable', 503);
    }

    if (existing && existing.code !== code) {
      return jsonError('referral_already_attributed', 409);
    }

    if (!existing) {
      try {
        const claimed = await claimReferralAttribution(admin, user.id, code, 'manual');
        if (!claimed || claimed.code !== code) {
          return jsonError('referral_code_unavailable', 409);
        }
      } catch {
        return jsonError('referral_service_unavailable', 503);
      }
    }
  }

  const baseAmountArs =
    offerCode === 'semester' ? PREMIUM_SEMESTER_PRICE_ARS : monthlyPrice;
  const discountPercent = Number(referralCode.discount_percent);
  if (!Number.isFinite(discountPercent) || discountPercent <= 0) {
    return jsonError('referral_code_unavailable', 404);
  }
  const discountAmountArs = Math.min(
    baseAmountArs - 1,
    roundArs((baseAmountArs * discountPercent) / 100)
  );
  const amountArs = Math.max(1, roundArs(baseAmountArs - discountAmountArs));

  if (user) {
    void trackServerAnalyticsEvent({
      eventName: 'referral_code_applied',
      userId: user.id,
      path: '/pricing',
      metadata: {
        referral_code: code,
        referral_partner_id: partner.id,
        referral_brand_id: brand.id,
        offer_code: offerCode,
        discount_percent: discountPercent,
      },
    });
  }

  const response = NextResponse.json(
    {
      code,
      discountPercent,
      appliesTo: referralCode.applies_to,
      partnerName: String(partner.display_name ?? ''),
      brandName: String(brand.name ?? ''),
      baseAmountArs,
      discountAmountArs,
      amountArs,
      attributed: Boolean(user),
    },
    { headers: { 'Cache-Control': 'private, no-store' } }
  );

  response.cookies.set(REFERRAL_COOKIE_NAME, code, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: REFERRAL_COOKIE_MAX_AGE_SECONDS,
    path: '/',
  });

  return response;
}
