'use server';

import { unstable_cache as nextCache } from 'next/cache';
import { requireAdminAccess } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-admin';
import type { PackedDashboardSnapshot } from './packed-dashboard-transport';

const loadSnapshot = nextCache(async () => {
  const {data,error}=await createAdminClient().rpc('admin_activation_cohort_packed_v1',{});
  if(error || !data) throw error??new Error('Sin datos de activación');
  return data as PackedDashboardSnapshot;
},['admin-activation-cohort-packed-v1'],{revalidate:3600});

export async function obtenerActivacionRecorrido(){
  await requireAdminAccess();
  return loadSnapshot();
}
