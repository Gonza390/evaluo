'use server';

import { revalidatePath } from 'next/cache';
import type { SupabaseClient } from '@supabase/supabase-js';
import { requireAdminAccess } from '@/lib/auth';
import { logError } from '@/lib/observability';
import { normalizeReferralCode } from '@/lib/referrals';
import { createAdminClient } from '@/lib/supabase-admin';

export type ReferralAdminBrand = {
  id: string;
  name: string;
  status: 'active' | 'inactive';
};

export type ReferralAdminPartner = {
  id: string;
  brandId: string;
  displayName: string;
  contactEmail: string | null;
  status: 'active' | 'inactive';
};

export type ReferralAdminCodeMetric = {
  id: string;
  code: string;
  partnerId: string;
  partnerName: string;
  brandId: string;
  brandName: string;
  discountPercent: number;
  appliesTo: 'all' | 'monthly' | 'semester';
  maxRedemptions: number | null;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  attributedUsers: number;
  checkoutAttempts: number;
  approvedCheckouts: number;
  pendingCheckouts: number;
  failedCheckouts: number;
  activatedClaims: number;
  revenueArs: number;
  discountsArs: number;
};

export type ReferralAdminData = {
  brands: ReferralAdminBrand[];
  partners: ReferralAdminPartner[];
  codes: ReferralAdminCodeMetric[];
  summary: {
    brands: number;
    activeCodes: number;
    attributedUsers: number;
    checkouts: number;
    approvedCheckouts: number;
    revenueArs: number;
    discountsArs: number;
  };
};

type ActionResult<T = undefined> = {
  success: boolean;
  message: string;
  data?: T;
};

function adminClient() {
  return createAdminClient() as unknown as SupabaseClient;
}

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/\s+/g, ' ').slice(0, maxLength);
}

function parseOptionalPositiveInt(value: unknown) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) throw new Error('El límite de usos debe ser un entero mayor a 0.');
  return parsed;
}

function parseDiscount(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 100) {
    throw new Error('El descuento debe estar entre 0 y 100%.');
  }
  return Math.round(parsed * 100) / 100;
}

function parseAppliesTo(value: unknown): 'all' | 'monthly' | 'semester' {
  if (value === 'monthly' || value === 'semester') return value;
  return 'all';
}

function parseOptionalDate(value: unknown) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string') throw new Error('Fecha inválida.');
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error('Fecha inválida.');
  return date.toISOString();
}

function revalidateReferrals() {
  revalidatePath('/administrador');
}

export async function obtenerReferidosAdministrador(): Promise<ActionResult<ReferralAdminData>> {
  try {
    await requireAdminAccess();
    const admin = adminClient();
    const [brandsResult, partnersResult, metricsResult] = await Promise.all([
      admin.from('referral_brands').select('id, name, status').order('name'),
      admin
        .from('referral_partners')
        .select('id, brand_id, display_name, contact_email, status')
        .order('display_name'),
      admin.rpc('get_referral_code_metrics'),
    ]);

    if (brandsResult.error) throw brandsResult.error;
    if (partnersResult.error) throw partnersResult.error;
    if (metricsResult.error) throw metricsResult.error;

    const brands: ReferralAdminBrand[] = (brandsResult.data ?? []).map((row) => ({
      id: String(row.id),
      name: String(row.name),
      status: row.status === 'inactive' ? 'inactive' : 'active',
    }));

    const partners: ReferralAdminPartner[] = (partnersResult.data ?? []).map((row) => ({
      id: String(row.id),
      brandId: String(row.brand_id),
      displayName: String(row.display_name),
      contactEmail: row.contact_email ? String(row.contact_email) : null,
      status: row.status === 'inactive' ? 'inactive' : 'active',
    }));

    const codes: ReferralAdminCodeMetric[] = ((metricsResult.data ?? []) as Array<Record<string, unknown>>).map(
      (row) => ({
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
        startsAt: row.starts_at ? String(row.starts_at) : null,
        endsAt: row.ends_at ? String(row.ends_at) : null,
        isActive: Boolean(row.is_active),
        attributedUsers: Number(row.attributed_users ?? 0),
        checkoutAttempts: Number(row.checkout_attempts ?? 0),
        approvedCheckouts: Number(row.approved_checkouts ?? 0),
        pendingCheckouts: Number(row.pending_checkouts ?? 0),
        failedCheckouts: Number(row.failed_checkouts ?? 0),
        activatedClaims: Number(row.activated_claims ?? 0),
        revenueArs: Number(row.revenue_ars ?? 0),
        discountsArs: Number(row.discounts_ars ?? 0),
      })
    );

    return {
      success: true,
      message: 'Referidos cargados.',
      data: {
        brands,
        partners,
        codes,
        summary: {
          brands: brands.length,
          activeCodes: codes.filter((row) => row.isActive).length,
          attributedUsers: codes.reduce((sum, row) => sum + row.attributedUsers, 0),
          checkouts: codes.reduce((sum, row) => sum + row.checkoutAttempts, 0),
          approvedCheckouts: codes.reduce((sum, row) => sum + row.approvedCheckouts, 0),
          revenueArs: codes.reduce((sum, row) => sum + row.revenueArs, 0),
          discountsArs: codes.reduce((sum, row) => sum + row.discountsArs, 0),
        },
      },
    };
  } catch (error) {
    logError('admin.referrals.load', error);
    return { success: false, message: 'No pudimos cargar los referidos.' };
  }
}

export async function crearMarcaReferidoAdministrador(input: {
  name: string;
}): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdminAccess();
    const name = cleanText(input.name, 120);
    if (name.length < 2) return { success: false, message: 'Ingresá un nombre de marca válido.' };

    const admin = adminClient();
    const { data, error } = await admin
      .from('referral_brands')
      .insert({ name, status: 'active', updated_at: new Date().toISOString() })
      .select('id')
      .single();

    if (error) {
      if (error.code === '23505') return { success: false, message: 'Esa marca ya existe.' };
      throw error;
    }

    revalidateReferrals();
    return { success: true, message: `Marca ${name} creada.`, data: { id: String(data.id) } };
  } catch (error) {
    logError('admin.referrals.brand.create', error);
    return { success: false, message: 'No pudimos crear la marca.' };
  }
}

export async function cambiarEstadoMarcaReferidoAdministrador(input: {
  brandId: string;
  active: boolean;
}): Promise<ActionResult> {
  try {
    await requireAdminAccess();
    const brandId = cleanText(input.brandId, 80);
    if (!brandId) return { success: false, message: 'Marca inválida.' };

    const { error } = await adminClient()
      .from('referral_brands')
      .update({
        status: input.active ? 'active' : 'inactive',
        updated_at: new Date().toISOString(),
      })
      .eq('id', brandId);
    if (error) throw error;

    revalidateReferrals();
    return { success: true, message: input.active ? 'Marca activada.' : 'Marca pausada.' };
  } catch (error) {
    logError('admin.referrals.brand.status', error);
    return { success: false, message: 'No pudimos actualizar la marca.' };
  }
}

export async function crearReferenteReferidoAdministrador(input: {
  brandId: string;
  displayName: string;
  contactEmail?: string;
}): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdminAccess();
    const brandId = cleanText(input.brandId, 80);
    const displayName = cleanText(input.displayName, 120);
    const contactEmail = cleanText(input.contactEmail, 180).toLowerCase() || null;

    if (!brandId || displayName.length < 2) {
      return { success: false, message: 'Elegí una marca e ingresá el nombre del referente.' };
    }
    if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      return { success: false, message: 'El correo del referente no es válido.' };
    }

    const admin = adminClient();
    const { data: brand, error: brandError } = await admin
      .from('referral_brands')
      .select('id, name')
      .eq('id', brandId)
      .single();
    if (brandError || !brand) return { success: false, message: 'La marca seleccionada no existe.' };

    const { data, error } = await admin
      .from('referral_partners')
      .insert({
        brand_id: brandId,
        brand_name: String(brand.name),
        display_name: displayName,
        contact_email: contactEmail,
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      if (error.code === '23505') {
        return { success: false, message: 'Ese referente ya existe dentro de la marca.' };
      }
      throw error;
    }

    revalidateReferrals();
    return {
      success: true,
      message: `Referente ${displayName} creado.`,
      data: { id: String(data.id) },
    };
  } catch (error) {
    logError('admin.referrals.partner.create', error);
    return { success: false, message: 'No pudimos crear el referente.' };
  }
}

export async function crearCodigoReferidoAdministrador(input: {
  partnerId: string;
  code: string;
  discountPercent: number | string;
  appliesTo: string;
  maxRedemptions?: number | string | null;
  startsAt?: string | null;
  endsAt?: string | null;
}): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdminAccess();
    const partnerId = cleanText(input.partnerId, 80);
    const code = normalizeReferralCode(input.code);
    if (!partnerId || !code) {
      return { success: false, message: 'Elegí un referente e ingresá un código válido.' };
    }

    const discountPercent = parseDiscount(input.discountPercent);
    const appliesTo = parseAppliesTo(input.appliesTo);
    const maxRedemptions = parseOptionalPositiveInt(input.maxRedemptions);
    const startsAt = parseOptionalDate(input.startsAt);
    const endsAt = parseOptionalDate(input.endsAt);
    if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt)) {
      return { success: false, message: 'La fecha de fin debe ser posterior a la fecha de inicio.' };
    }

    const admin = adminClient();
    const { data: partner, error: partnerError } = await admin
      .from('referral_partners')
      .select('id, status, brand_id')
      .eq('id', partnerId)
      .single();
    if (partnerError || !partner) return { success: false, message: 'El referente seleccionado no existe.' };

    const { data, error } = await admin
      .from('referral_codes')
      .insert({
        partner_id: partnerId,
        code,
        discount_percent: discountPercent,
        applies_to: appliesTo,
        max_redemptions: maxRedemptions,
        starts_at: startsAt,
        ends_at: endsAt,
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      if (error.code === '23505') return { success: false, message: `El código ${code} ya existe.` };
      throw error;
    }

    revalidateReferrals();
    return { success: true, message: `Código ${code} creado.`, data: { id: String(data.id) } };
  } catch (error) {
    logError('admin.referrals.code.create', error);
    return { success: false, message: error instanceof Error ? error.message : 'No pudimos crear el código.' };
  }
}

export async function editarCodigoReferidoAdministrador(input: {
  codeId: string;
  partnerId: string;
  code: string;
  discountPercent: number | string;
  appliesTo: string;
  maxRedemptions?: number | string | null;
  startsAt?: string | null;
  endsAt?: string | null;
}): Promise<ActionResult> {
  try {
    await requireAdminAccess();
    const codeId = cleanText(input.codeId, 80);
    const partnerId = cleanText(input.partnerId, 80);
    const code = normalizeReferralCode(input.code);
    if (!codeId || !partnerId || !code) return { success: false, message: 'Código inválido.' };

    const discountPercent = parseDiscount(input.discountPercent);
    const appliesTo = parseAppliesTo(input.appliesTo);
    const maxRedemptions = parseOptionalPositiveInt(input.maxRedemptions);
    const startsAt = parseOptionalDate(input.startsAt);
    const endsAt = parseOptionalDate(input.endsAt);
    if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt)) {
      return { success: false, message: 'La fecha de fin debe ser posterior a la fecha de inicio.' };
    }

    const admin = adminClient();
    const [{ count: attributionCount, error: attributionError }, { count: checkoutCount, error: checkoutError }] =
      await Promise.all([
        admin
          .from('referral_attributions')
          .select('id', { count: 'exact', head: true })
          .eq('referral_code_id', codeId),
        admin
          .from('payment_checkout_attempts')
          .select('id', { count: 'exact', head: true })
          .eq('referral_code_id', codeId),
      ]);
    if (attributionError || checkoutError) throw attributionError ?? checkoutError;

    if ((attributionCount ?? 0) > 0 || (checkoutCount ?? 0) > 0) {
      return {
        success: false,
        message: 'Este código ya tiene historial. Pausalo y creá uno nuevo para cambiar sus condiciones comerciales.',
      };
    }

    const { error } = await admin
      .from('referral_codes')
      .update({
        partner_id: partnerId,
        code,
        discount_percent: discountPercent,
        applies_to: appliesTo,
        max_redemptions: maxRedemptions,
        starts_at: startsAt,
        ends_at: endsAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', codeId);
    if (error) {
      if (error.code === '23505') return { success: false, message: `El código ${code} ya existe.` };
      throw error;
    }

    revalidateReferrals();
    return { success: true, message: `Código ${code} actualizado.` };
  } catch (error) {
    logError('admin.referrals.code.update', error);
    return { success: false, message: error instanceof Error ? error.message : 'No pudimos actualizar el código.' };
  }
}

export async function cambiarEstadoCodigoReferidoAdministrador(input: {
  codeId: string;
  active: boolean;
}): Promise<ActionResult> {
  try {
    await requireAdminAccess();
    const codeId = cleanText(input.codeId, 80);
    if (!codeId) return { success: false, message: 'Código inválido.' };

    const { error } = await adminClient()
      .from('referral_codes')
      .update({ is_active: input.active, updated_at: new Date().toISOString() })
      .eq('id', codeId);
    if (error) throw error;

    revalidateReferrals();
    return { success: true, message: input.active ? 'Código activado.' : 'Código pausado.' };
  } catch (error) {
    logError('admin.referrals.code.status', error);
    return { success: false, message: 'No pudimos actualizar el código.' };
  }
}
