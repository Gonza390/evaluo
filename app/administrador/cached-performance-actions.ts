'use server';

import { unstable_cache as nextCache } from 'next/cache';
import { listAdminUserIds } from '@/lib/admin-users';
import { requireAdminAccess } from '@/lib/auth';
import { logError } from '@/lib/observability';
import { createAdminClient } from '@/lib/supabase-admin';
import type { AdministradorUsuariosStats, BibliotecaOverviewStats } from './actions';
import type { AdministradorUsuarioPaginadoRow } from './performance-actions';

function argentinaDayStart(now = new Date()) {
  const shifted = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  shifted.setUTCHours(0, 0, 0, 0);
  return new Date(shifted.getTime() + 3 * 60 * 60 * 1000);
}

const loadBibliotecaOverviewCached = nextCache(
  async (): Promise<BibliotecaOverviewStats> => {
    const admin = createAdminClient();
    const [carrerasRes, materiasRes, preguntasRes] = await Promise.all([
      admin.from('carreras').select('id', { count: 'exact', head: true }),
      admin.from('materias').select('id', { count: 'exact', head: true }),
      admin.from('preguntas_banco').select('id', { count: 'exact', head: true }),
    ]);

    if (carrerasRes.error) throw carrerasRes.error;
    if (materiasRes.error) throw materiasRes.error;
    if (preguntasRes.error) throw preguntasRes.error;

    return {
      carrerasTotal: carrerasRes.count ?? 0,
      materiasTotal: materiasRes.count ?? 0,
      preguntasTotal: preguntasRes.count ?? 0,
    };
  },
  ['admin-biblioteca-overview-v2'],
  { revalidate: 180, tags: ['admin-biblioteca-stats'] }
);

const loadUsuariosOverviewCached = nextCache(
  async (): Promise<AdministradorUsuariosStats> => {
    const admin = createAdminClient();
    const todayStart = argentinaDayStart();
    const adminUserIds = await listAdminUserIds();
    const [profilesTotalRes, profilesTodayRes, activeUsersRes] = await Promise.all([
      admin.from('profiles').select('id', { count: 'exact', head: true }),
      admin
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('creado_at', todayStart.toISOString()),
      admin.rpc('admin_active_user_count_since', {
        since_at: todayStart.toISOString(),
        excluded_user_ids: adminUserIds,
      }),
    ]);

    if (profilesTotalRes.error) throw profilesTotalRes.error;
    if (profilesTodayRes.error) throw profilesTodayRes.error;
    if (activeUsersRes.error) throw activeUsersRes.error;

    return {
      totalUsers: profilesTotalRes.count ?? 0,
      activeToday: Number(activeUsersRes.data ?? 0),
      newRegistrationsToday: profilesTodayRes.count ?? 0,
    };
  },
  ['admin-users-overview-v2'],
  { revalidate: 60, tags: ['admin-users-stats'] }
);

export async function obtenerBibliotecaResumenAdministradorCacheado(): Promise<{
  success: boolean;
  stats?: BibliotecaOverviewStats;
  message?: string;
}> {
  try {
    await requireAdminAccess();
    return { success: true, stats: await loadBibliotecaOverviewCached() };
  } catch (error) {
    logError('admin.obtenerBibliotecaResumenCacheado', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'No pudimos cargar el resumen de biblioteca.',
    };
  }
}

async function loadUsuariosPageRows(
  page: number,
  pageSize: number
): Promise<AdministradorUsuarioPaginadoRow[]> {
  const admin = createAdminClient();
  const authResult = await admin.auth.admin.listUsers({ page, perPage: pageSize });
  if (authResult.error) throw authResult.error;

  const authUsers = authResult.data?.users ?? [];
  const userIds = authUsers.map((user) => user.id);
  if (!userIds.length) return [];

  const [profilesRes, subscriptionsRes, attemptsRes] = await Promise.all([
    admin.from('profiles').select('id, role').in('id', userIds),
    admin
      .from('user_subscriptions')
      .select('user_id, status, started_at, plan_id')
      .in('user_id', userIds)
      .order('started_at', { ascending: false }),
    admin.rpc('admin_user_simulator_aggregates', { target_user_ids: userIds }),
  ]);

  if (profilesRes.error) throw profilesRes.error;
  if (subscriptionsRes.error) throw subscriptionsRes.error;
  if (attemptsRes.error) throw attemptsRes.error;

  const planIds = Array.from(
    new Set((subscriptionsRes.data ?? []).map((row) => row.plan_id).filter(Boolean))
  );
  const plansRes = planIds.length
    ? await admin.from('subscription_plans').select('id, code').in('id', planIds)
    : { data: [], error: null };
  if (plansRes.error) throw plansRes.error;

  const planCodeById = new Map((plansRes.data ?? []).map((row) => [row.id, row.code]));
  const roleByUser = new Map((profilesRes.data ?? []).map((row) => [row.id, row.role]));
  const planByUser = new Map<string, 'free' | 'premium'>();
  for (const row of subscriptionsRes.data ?? []) {
    if (!row.user_id || planByUser.has(row.user_id)) continue;
    planByUser.set(row.user_id, planCodeById.get(row.plan_id) === 'premium' ? 'premium' : 'free');
  }

  const attemptsByUser = new Map<
    string,
    { intentos: number; preguntas: number; correctas: number }
  >();
  for (const row of (attemptsRes.data ?? []) as Array<{
    user_id: string;
    intentos: number | string | null;
    preguntas: number | string | null;
    correctas: number | string | null;
  }>) {
    attemptsByUser.set(row.user_id, {
      intentos: Number(row.intentos ?? 0),
      preguntas: Number(row.preguntas ?? 0),
      correctas: Number(row.correctas ?? 0),
    });
  }

  return authUsers.map((user) => {
    const lastSignIn = user.last_sign_in_at ?? null;
    const active =
      !!lastSignIn && Date.now() - new Date(lastSignIn).getTime() < 30 * 24 * 60 * 60 * 1000;
    const attemptStats = attemptsByUser.get(user.id) ?? {
      intentos: 0,
      preguntas: 0,
      correctas: 0,
    };

    return {
      id: user.id,
      email: user.email ?? '(sin email)',
      estado: active ? 'activo' : 'inactivo',
      plan: planByUser.get(user.id) ?? 'free',
      role:
        user.app_metadata?.role === 'admin' || roleByUser.get(user.id) === 'admin'
          ? 'admin'
          : 'student',
      last_sign_in_at: lastSignIn,
      created_at: user.created_at ?? null,
      ...attemptStats,
    };
  });
}

export async function obtenerUsuariosAdministradorPaginadoCacheado(
  page = 1,
  pageSize = 25
): Promise<{
  success: boolean;
  stats?: AdministradorUsuariosStats;
  rows?: AdministradorUsuarioPaginadoRow[];
  page?: number;
  pageSize?: number;
  totalPages?: number;
  message?: string;
}> {
  try {
    await requireAdminAccess();
    const safePage = Math.max(1, Math.floor(page));
    const safePageSize = Math.min(100, Math.max(10, Math.floor(pageSize)));
    const [stats, rows] = await Promise.all([
      loadUsuariosOverviewCached(),
      loadUsuariosPageRows(safePage, safePageSize),
    ]);

    return {
      success: true,
      stats,
      rows,
      page: safePage,
      pageSize: safePageSize,
      totalPages: Math.max(1, Math.ceil(stats.totalUsers / safePageSize)),
    };
  } catch (error) {
    logError('admin.obtenerUsuariosPaginadoCacheado', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'No pudimos cargar usuarios.',
    };
  }
}
