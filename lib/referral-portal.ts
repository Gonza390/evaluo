import 'server-only';

import type { SupabaseClient, User } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase-admin';

export type ReferralPortalCodeMetric = {
  id: string;
  code: string;
  partnerId: string;
  partnerName: string;
  brandId: string;
  brandName: string;
  discountPercent: number;
  appliesTo: 'all' | 'monthly' | 'semester';
  maxRedemptions: number | null;
  activatedClaims: number;
  attributedUsers: number;
  checkoutAttempts: number;
  approvedCheckouts: number;
  approvedPayments: number;
  revenueArs: number;
  discountsArs: number;
  isActive: boolean;
};

export type ReferralPortalData = {
  partners: Array<{
    id: string;
    name: string;
    brandId: string;
    brandName: string;
  }>;
  codes: ReferralPortalCodeMetric[];
  summary: {
    attributedUsers: number;
    checkoutAttempts: number;
    approvedCheckouts: number;
    approvedPayments: number;
    revenueArs: number;
    discountsArs: number;
  };
};

function adminClient() {
  return createAdminClient() as unknown as SupabaseClient;
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

async function claimPendingAccess(admin: SupabaseClient, user: User) {
  const normalizedEmail = user.email?.trim().toLowerCase() ?? '';
  const emailVerified = Boolean(user.email_confirmed_at || user.confirmed_at);
  if (!normalizedEmail || !emailVerified) return;

  const now = new Date().toISOString();
  const { error } = await admin
    .from('referral_partner_access')
    .update({
      user_id: user.id,
      status: 'active',
      activated_at: now,
      revoked_at: null,
      updated_at: now,
    })
    .eq('email', normalizedEmail)
    .eq('status', 'pending')
    .is('user_id', null);

  if (error) throw error;
}

export async function getReferralPortalData(user: User): Promise<ReferralPortalData | null> {
  const admin = adminClient();

  let { data: accesses, error: accessError } = await admin
    .from('referral_partner_access')
    .select('partner_id')
    .eq('user_id', user.id)
    .eq('status', 'active');
  if (accessError) throw accessError;

  if (!accesses?.length) {
    await claimPendingAccess(admin, user);
    const retry = await admin
      .from('referral_partner_access')
      .select('partner_id')
      .eq('user_id', user.id)
      .eq('status', 'active');
    if (retry.error) throw retry.error;
    accesses = retry.data;
  }

  const partnerIds = unique((accesses ?? []).map((row) => String(row.partner_id ?? '')));
  if (!partnerIds.length) return null;

  const { data: partnerRows, error: partnerError } = await admin
    .from('referral_partners')
    .select('id, display_name, brand_id, status')
    .in('id', partnerIds)
    .eq('status', 'active');
  if (partnerError) throw partnerError;

  const activePartners = partnerRows ?? [];
  if (!activePartners.length) return null;

  const brandIds = unique(activePartners.map((row) => String(row.brand_id ?? '')));
  const { data: brandRows, error: brandError } = await admin
    .from('referral_brands')
    .select('id, name, status')
    .in('id', brandIds)
    .eq('status', 'active');
  if (brandError) throw brandError;

  const brandById = new Map(
    (brandRows ?? []).map((row) => [String(row.id), { id: String(row.id), name: String(row.name) }])
  );
  const partners = activePartners
    .map((row) => {
      const brandId = String(row.brand_id ?? '');
      const brand = brandById.get(brandId);
      if (!brand) return null;
      return {
        id: String(row.id),
        name: String(row.display_name),
        brandId,
        brandName: brand.name,
      };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row));

  const allowedPartnerIds = new Set(partners.map((partner) => partner.id));
  if (!allowedPartnerIds.size) return null;

  const { data: metricRows, error: metricsError } = await admin.rpc('get_referral_code_metrics_v2');
  if (metricsError) throw metricsError;

  const codes: ReferralPortalCodeMetric[] = ((metricRows ?? []) as Array<Record<string, unknown>>)
    .filter((row) => allowedPartnerIds.has(String(row.partner_id ?? '')))
    .map((row) => ({
      id: String(row.code_id),
      code: String(row.code),
      partnerId: String(row.partner_id),
      partnerName: String(row.partner_name),
      brandId: String(row.brand_id),
      brandName: String(row.brand_name),
      discountPercent: Number(row.discount_percent ?? 0),
      appliesTo:
        row.applies_to === 'monthly' || row.applies_to === 'semester' ? row.applies_to : 'all',
      maxRedemptions: row.max_redemptions == null ? null : Number(row.max_redemptions),
      activatedClaims: Number(row.activated_claims ?? 0),
      attributedUsers: Number(row.attributed_users ?? 0),
      checkoutAttempts: Number(row.checkout_attempts ?? 0),
      approvedCheckouts: Number(row.approved_checkouts ?? 0),
      approvedPayments: Number(row.approved_payments ?? 0),
      revenueArs: Number(row.revenue_ars ?? 0),
      discountsArs: Number(row.discounts_ars ?? 0),
      isActive: Boolean(row.is_active),
    }));

  return {
    partners,
    codes,
    summary: {
      attributedUsers: codes.reduce((sum, row) => sum + row.attributedUsers, 0),
      checkoutAttempts: codes.reduce((sum, row) => sum + row.checkoutAttempts, 0),
      approvedCheckouts: codes.reduce((sum, row) => sum + row.approvedCheckouts, 0),
      approvedPayments: codes.reduce((sum, row) => sum + row.approvedPayments, 0),
      revenueArs: codes.reduce((sum, row) => sum + row.revenueArs, 0),
      discountsArs: codes.reduce((sum, row) => sum + row.discountsArs, 0),
    },
  };
}
