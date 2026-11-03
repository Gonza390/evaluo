'use server';

import { unstable_cache as nextCache } from 'next/cache';
import { requireAdminAccess } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-admin';

export type AdminDailyOverview = {
  day: string;
  registrations: number;
  activeUsers: number;
  sessions: number;
  pdfsUploaded: number;
  practicesCompleted: number;
};

type DbRow = {
  day: string;
  registrations: number | string | null;
  active_users: number | string | null;
  sessions: number | string | null;
  pdfs_uploaded: number | string | null;
  practices_completed: number | string | null;
};

// Shared data source: a single SQL aggregate returning at most 31 small rows.
// Keep the authorization check OUTSIDE the shared cache.
const loadOverview = nextCache(
  async (): Promise<AdminDailyOverview[]> => {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc('admin_overview_daily_v1', { p_days: 31 });
    if (error) throw error;
    return ((data ?? []) as DbRow[]).map((row) => ({
      day: row.day,
      registrations: Number(row.registrations ?? 0),
      activeUsers: Number(row.active_users ?? 0),
      sessions: Number(row.sessions ?? 0),
      pdfsUploaded: Number(row.pdfs_uploaded ?? 0),
      practicesCompleted: Number(row.practices_completed ?? 0),
    }));
  },
  ['admin-overview-daily-v1'],
  { revalidate: 900, tags: ['admin-overview-daily'] }
);

export async function obtenerResumenAdministrador() {
  try {
    await requireAdminAccess();
    return { success: true as const, rows: await loadOverview() };
  } catch (error) {
    return {
      success: false as const,
      message: error instanceof Error ? error.message : 'No se pudo cargar el resumen.',
    };
  }
}
