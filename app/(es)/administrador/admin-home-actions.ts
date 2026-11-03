'use server';

import { unstable_cache as nextCache } from 'next/cache';
import { requireAdminAccess } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-admin';

export type AdminHomeSnapshot = {
  day: string; today: string;
  daily: Array<{ d: string; registrations: number; active_users: number; sessions: number; studied_users: number }>;
  users: { total: number; new_7d: number };
  activity: { active_7d: number };
  study: { studying_7d: number; returning_7d: number };
  cohort: { retained: number; cohort_users: number };
  materials: { uploaded_7d: number; ready_7d: number; failed_7d: number; stuck_7d: number };
  practice: { completed_7d: number };
  plans: { created_7d: number };
  activation: { activated: number };
  premium: { active: number };
  revenue: { ars: number; usd: number };
  payments: { failed: number };
};

const getSnapshot = nextCache(async (date: string) => {
  const { data, error } = await createAdminClient().rpc('admin_home_snapshot_v2', { p_day: date });
  if (error || !data) throw error ?? new Error('No se encontró el resumen');
  return data as Omit<AdminHomeSnapshot, 'today'>;
}, ['admin-home-snapshot-v1-cohort-parity-20261103'], { revalidate: 900 });

export async function obtenerTableroGeneral(date?: string) {
  await requireAdminAccess();
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const chosen = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : today;
  const maxAge = new Date(today + 'T12:00:00Z');
  maxAge.setUTCDate(maxAge.getUTCDate() - 90);
  const earliest = maxAge.toISOString().slice(0, 10);
  const safeDay = chosen >= earliest && chosen <= today ? chosen : today;
  const snapshot = await getSnapshot(safeDay);
  return { snapshot: { ...snapshot, today }, minDay: earliest };
}
