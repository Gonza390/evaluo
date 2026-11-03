'use server';

import { unstable_cache as nextCache } from 'next/cache';
import { requireAdminAccess } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-admin';
import type { ActivationCohortSnapshot } from './activation-dashboard-types';

const loadSnapshot = nextCache(async () => {
  const {data,error}=await createAdminClient().rpc('admin_activation_cohort_v1',{});
  if(error || !data) throw error??new Error('Sin datos de activación');
  return data as ActivationCohortSnapshot;
},['admin-activation-cohort-v1'],{revalidate:3600});

export async function obtenerActivacionRecorrido(){
  await requireAdminAccess();
  return loadSnapshot();
}
