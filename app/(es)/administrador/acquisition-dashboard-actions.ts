'use server';

import { unstable_cache as nextCache } from 'next/cache';
import { requireAdminAccess } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-admin';
import type { PackedDashboardSnapshot } from './packed-dashboard-transport';

// Cached across all admin filter changes. The database reads only one consolidated
// query per cache refresh, never one query per selector or per visitor.
const cachedSnapshot = nextCache(async () => {
  const { data, error } = await createAdminClient().rpc('admin_acquisition_dashboard_packed_v1', {});
  if (error || !data) throw error ?? new Error('Sin estadísticas de adquisición');
  return data as PackedDashboardSnapshot;
}, ['admin-acquisition-dashboard-packed-v1'], { revalidate: 3600 });

export async function obtenerDashboardAdquisicion() {
  // Shared cached data is always guarded before returning it to a client.
  await requireAdminAccess();
  return cachedSnapshot();
}
