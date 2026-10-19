import type { SupabaseClient } from '@supabase/supabase-js';

export const REFERRAL_COOKIE_NAME = 'evaluo_ref';
export const REFERRAL_COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export type ReferralAttribution = {
  referralCodeId: string;
  code: string;
  discountPercent: number;
  appliesTo: 'all' | 'monthly' | 'semester';
  partnerId: string;
  partnerName: string;
  brandName: string | null;
};

export type ReservedReferralPromotion = {
  claimId: string;
  promotionCode: string;
  discountPercent: number;
  discountAmountArs: number;
  amountArs: number;
};

export function normalizeReferralCode(value: unknown) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toUpperCase();
  return /^[A-Z0-9_-]{3,32}$/.test(normalized) ? normalized : null;
}

function firstRow<T>(data: unknown): T | null {
  if (!Array.isArray(data) || data.length === 0) return null;
  return data[0] as T;
}

function toAttribution(row: Record<string, unknown>): ReferralAttribution | null {
  const referralCodeId = String(row.referral_code_id ?? '').trim();
  const code = normalizeReferralCode(row.code);
  const partnerId = String(row.partner_id ?? '').trim();
  const partnerName = String(row.partner_name ?? '').trim();
  const discountPercent = Number(row.discount_percent);
  const appliesTo = String(row.applies_to ?? '');

  if (
    !referralCodeId ||
    !code ||
    !partnerId ||
    !partnerName ||
    !Number.isFinite(discountPercent) ||
    discountPercent <= 0 ||
    !['all', 'monthly', 'semester'].includes(appliesTo)
  ) {
    return null;
  }

  return {
    referralCodeId,
    code,
    discountPercent,
    appliesTo: appliesTo as ReferralAttribution['appliesTo'],
    partnerId,
    partnerName,
    brandName: row.brand_name ? String(row.brand_name) : null,
  };
}

export async function claimReferralAttribution(
  admin: SupabaseClient,
  userId: string,
  rawCode: unknown,
  source: 'link' | 'manual' | 'admin' = 'link'
): Promise<ReferralAttribution | null> {
  const code = normalizeReferralCode(rawCode);
  if (!code) return null;

  const { data, error } = await admin.rpc('claim_referral_attribution', {
    p_user_id: userId,
    p_code: code,
    p_source: source,
  });
  if (error) throw error;

  const row = firstRow<Record<string, unknown>>(data);
  return row ? toAttribution(row) : null;
}

export async function getReferralAttribution(
  admin: SupabaseClient,
  userId: string
): Promise<ReferralAttribution | null> {
  const { data: attribution, error: attributionError } = await admin
    .from('referral_attributions')
    .select('referral_code_id')
    .eq('user_id', userId)
    .maybeSingle();
  if (attributionError) throw attributionError;
  if (!attribution?.referral_code_id) return null;

  const { data: code, error: codeError } = await admin
    .from('referral_codes')
    .select('id, code, discount_percent, applies_to, partner_id')
    .eq('id', attribution.referral_code_id)
    .maybeSingle();
  if (codeError) throw codeError;
  if (!code?.id || !code.partner_id) return null;

  const { data: partner, error: partnerError } = await admin
    .from('referral_partners')
    .select('id, display_name, brand_name')
    .eq('id', code.partner_id)
    .maybeSingle();
  if (partnerError) throw partnerError;
  if (!partner?.id) return null;

  return toAttribution({
    referral_code_id: code.id,
    code: code.code,
    discount_percent: code.discount_percent,
    applies_to: code.applies_to,
    partner_id: partner.id,
    partner_name: partner.display_name,
    brand_name: partner.brand_name,
  });
}

export async function resolveReferralAttribution(
  admin: SupabaseClient,
  userId: string,
  rawCode: unknown,
  source: 'link' | 'manual' | 'admin' = 'link'
) {
  const normalized = normalizeReferralCode(rawCode);
  if (normalized) {
    return claimReferralAttribution(admin, userId, normalized, source);
  }
  return getReferralAttribution(admin, userId);
}

export async function reserveReferralPromotion(
  admin: SupabaseClient,
  input: {
    userId: string;
    referralCodeId: string;
    baseAmountArs: number;
    offerCode: 'monthly' | 'semester';
  }
): Promise<ReservedReferralPromotion | null> {
  const { data, error } = await admin.rpc('reserve_referral_promotion', {
    p_user_id: input.userId,
    p_referral_code_id: input.referralCodeId,
    p_base_amount_ars: input.baseAmountArs,
    p_offer_code: input.offerCode,
  });
  if (error) throw error;

  const row = firstRow<Record<string, unknown>>(data);
  if (!row) return null;

  const claimId = String(row.claim_id ?? '').trim();
  const promotionCode = normalizeReferralCode(row.promotion_code);
  const discountPercent = Number(row.discount_percent);
  const discountAmountArs = Number(row.discount_amount_ars);
  const amountArs = Number(row.amount_ars);

  if (
    !claimId ||
    !promotionCode ||
    !Number.isFinite(discountPercent) ||
    !Number.isFinite(discountAmountArs) ||
    !Number.isFinite(amountArs) ||
    amountArs <= 0
  ) {
    return null;
  }

  return {
    claimId,
    promotionCode,
    discountPercent,
    discountAmountArs,
    amountArs,
  };
}

export async function releaseReferralPromotionClaim(
  admin: SupabaseClient,
  claimId: string | null | undefined
) {
  if (!claimId) return;
  const { error } = await admin
    .from('payment_promotion_claims')
    .update({
      status: 'released',
      released_at: new Date().toISOString(),
    })
    .eq('id', claimId)
    .eq('status', 'pending');
  if (error) throw error;
}
