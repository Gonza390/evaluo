'use server';

import { unstable_cache as nextCache } from 'next/cache';
import { requireAdminAccess } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-admin';
import type { MonetizationFilters, MonetizationSnapshot } from './monetization-dashboard-types';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
const validDay = (value?: string) => {
  if (!value || !ISO_DAY.test(value)) return null;
  const test = new Date(value + 'T12:00:00Z');
  return Number.isFinite(test.getTime()) && test.toISOString().slice(0, 10) === value
    ? value : null;
};
function argentinaDay() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}
function safeFilter(value: string | undefined, type: 'uuid'|'country'|'provider') {
  if (!value || value === 'all') return 'all';
  if (type === 'uuid') return UUID.test(value) ? value : 'all';
  if (type === 'country') return value.length <= 80 && /^[\p{L}\p{M}0-9 _.,-]+$/u.test(value) ? value : 'all';
  return /^[a-z0-9_-]{1,50}$/i.test(value) ? value : 'all';
}
function normalize(query: Record<string,string|undefined>) {
  const today = argentinaDay();
  const min = new Date(today+'T12:00:00Z');
  min.setUTCDate(min.getUTCDate()-90);
  const earliest = min.toISOString().slice(0,10);
  const period: MonetizationFilters['period'] =
    (['1','7','14','30','custom'].includes(query.moneyPeriod??'')
      ? query.moneyPeriod : '7') as MonetizationFilters['period'];
  const from = validDay(query.moneyFrom);
  const to = validDay(query.moneyTo);
  const custom = period === 'custom' && !!from && !!to &&
    from <= to && from >= earliest && to <= today &&
    (new Date(to+'T12:00:00Z').getTime()-new Date(from+'T12:00:00Z').getTime())/86400000<=29;
  const state = (['all','free','active','pending','canceled','expired'].includes(query.moneyState??'')
    ? query.moneyState:'all') as MonetizationFilters['state'];
  const filters: MonetizationFilters = {
    period:period==='custom'&&!custom?'7':period,
    from:custom?from:null, to:custom?to:null,
    university:safeFilter(query.moneyUniversity,'uuid'),
    career:safeFilter(query.moneyCareer,'uuid'),
    country:safeFilter(query.moneyCountry,'country'),
    provider:safeFilter(query.moneyProvider,'provider'),
    state,
  };
  return { filters, today, earliest };
}

// One aggregated query per filter combination, shared for 1 hour.
// Client-side changes to currency, chart grouping or segment never query Postgres.
const cachedSnapshot = nextCache(async (filters:MonetizationFilters) => {
  const { data, error } = await createAdminClient().rpc('admin_monetization_dashboard_v1',{
    p_days:filters.period==='custom'?7:Number(filters.period),
    p_from:filters.from,p_to:filters.to,
    p_university:filters.university,p_career:filters.career,
    p_country:filters.country,p_provider:filters.provider,p_state:filters.state,
  });
  if(error||!data) throw error??new Error('No hay datos de monetización');
  return data as MonetizationSnapshot;
},['admin-monetization-dashboard-v1'],{revalidate:3600});

export async function obtenerDashboardMonetizacion(query: Record<string,string|undefined>) {
  // Require authenticated admin access before returning even a cached snapshot.
  await requireAdminAccess();
  const {filters,today,earliest}=normalize(query);
  const snapshot=await cachedSnapshot(filters);
  return {snapshot,filters,today,earliest};
}