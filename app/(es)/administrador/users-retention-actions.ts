'use server';

import { unstable_cache as nextCache } from 'next/cache';
import { requireAdminAccess } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-admin';
import type { RetentionFilters, UserDetail, UserListResult, UsersRetentionSnapshot, UsersSegment } from './users-retention-types';

const getAggregatesCached = nextCache(async (days: number, from: string | null, to: string | null) => {
  const { data, error } = await createAdminClient().rpc('admin_users_retention_v4', {
    p_days: days, p_from: from, p_to: to,
  });
  if (error || !data) throw error ?? new Error('Sin datos de retención');
  return data as UsersRetentionSnapshot;
}, ['admin-users-retention-v2-inactivity-fixed-20261103'], { revalidate: 600 });

const getSegmentsCached = nextCache(async () => {
  const { data, error } = await createAdminClient().rpc('admin_users_segments_v2', { p_days: 30 });
  if (error) throw error;
  return (data ?? []) as UsersSegment[];
}, ['admin-users-segments-v1'], { revalidate: 900 });

const getListCached = nextCache(async (f: Omit<RetentionFilters,'selectedUserId'|'period'|'from'|'to'>) => {
  const { data, error } = await createAdminClient().rpc('admin_users_list_v3', {
    p_page: f.page,
    p_search: f.search,
    p_plan: f.plan,
    p_material: f.materials,
    p_country: f.country,
    p_university: f.university,
  });
  if (error || !data) throw error ?? new Error('Sin listado de usuarios');
  return data as UserListResult;
}, ['admin-users-list-v1-study-evidence-20261103'], { revalidate: 120 });

function parseDate(value: string | null): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(value + 'T12:00:00Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0,10) === value ? date : null;
}

export async function obtenerUsuariosRetencion(f: RetentionFilters) {
  // Check authorization on EVERY invocation, including hits served from shared cache.
  await requireAdminAccess();
  const days = [1,7,14,30].includes(f.period) ? f.period : 7;
  const start = parseDate(f.from);
  const end = parseDate(f.to);
  const todayStr = new Intl.DateTimeFormat('en-CA', {timeZone:'America/Argentina/Buenos_Aires',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const oldest = new Date(todayStr + 'T12:00:00Z');
  oldest.setUTCDate(oldest.getUTCDate() - 90);
  const minDay = oldest.toISOString().slice(0, 10);
  const validRange = !!start && !!end && start <= end &&
    start.toISOString().slice(0,10) >= minDay && end.toISOString().slice(0,10) <= todayStr &&
    (end.getTime() - start.getTime()) / 86_400_000 <= 29;
  const from = validRange ? f.from : null;
  const to = validRange ? f.to : null;
  const effectiveDays = validRange && start && end
    ? Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1
    : days;
  const normalized = {
    page: Number.isSafeInteger(f.page) ? Math.max(1,Math.min(100000,f.page)) : 1,
    search: f.search.slice(0,120),
    plan: ['all','free','premium'].includes(f.plan) ? f.plan : 'all',
    materials: ['all','yes','no'].includes(f.materials) ? f.materials : 'all',
    country: f.country.slice(0,100) || 'all',
    university: f.university.slice(0,100) || 'all',
  };
  const [stats, segments, list] = await Promise.all([
    getAggregatesCached(effectiveDays,from,to),
    getSegmentsCached(),
    getListCached(normalized),
  ]);
  let detail: UserDetail | null = null;
  if (f.selectedUserId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(f.selectedUserId)) {
    const { data, error } = await createAdminClient().rpc('admin_user_detail_v1',{ p_user_id: f.selectedUserId });
    if (error) throw error;
    detail = data as UserDetail | null;
  }
  return { stats, segments, list, detail, filters: { ...normalized, period:effectiveDays, from, to },today:todayStr,minDay };
}
