'use server';

import { unstable_cache as nextCache } from 'next/cache';
import { requireAdminAccess } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-admin';

export type LanguageMetric = {
  language: 'es' | 'en' | 'unknown';
  registered: number;
  new_users: number;
  active_users: number;
  studied_users: number;
};
export type LanguageMetrics = {
  from: string;
  to: string;
  source: 'current_account_ui_locale';
  categories: LanguageMetric[];
};

const getCachedLanguageMetrics = nextCache(async (from: string, to: string) => {
  const { data, error } = await createAdminClient().rpc('admin_user_languages_v1', {
    p_from: from, p_to: to,
  });
  if (error || !data) throw error ?? new Error('No se pudieron consultar los idiomas');
  return data as LanguageMetrics;
}, ['admin-user-languages-v1'], { revalidate: 300 });

export async function obtenerMetricasIdiomas(from: string, to: string): Promise<LanguageMetrics> {
  // Check authorization on EVERY invocation, including cache hits.
  await requireAdminAccess();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    throw new Error('Período de idiomas inválido');
  }
  return getCachedLanguageMetrics(from, to);
}
