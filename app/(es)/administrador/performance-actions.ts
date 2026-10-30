'use server';

import { listAdminUserIds } from '@/lib/admin-users';
import { requireAdminAccess } from '@/lib/auth';
import { logError } from '@/lib/observability';
import { createAdminClient } from '@/lib/supabase-admin';
import type {
  AdministradorUsuariosStats,
  BibliotecaCarreraOption,
  BibliotecaCarreraSimuladorRow,
  BibliotecaMateriaOption,
  BibliotecaUniversidadOption,
} from './actions';

async function fetchAllRows<T>(
  queryFactory: (
    from: number,
    to: number
  ) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  pageSize = 1000
): Promise<T[]> {
  const rows: T[] = [];
  let from = 0;

  while (true) {
    const to = from + pageSize - 1;
    const { data, error } = await queryFactory(from, to);
    if (error) throw error;
    const chunk = data ?? [];
    rows.push(...chunk);
    if (chunk.length < pageSize) break;
    from += pageSize;
  }

  return rows;
}

function argentinaDayStart(now = new Date()) {
  const shifted = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  shifted.setUTCHours(0, 0, 0, 0);
  return new Date(shifted.getTime() + 3 * 60 * 60 * 1000);
}

type QuestionCountRow = {
  materia_id: string | null;
  parcial: number | null;
  total: number | string | null;
};

type PremiumCountRow = {
  set_id: string | null;
  total: number | string | null;
};

export async function obtenerBibliotecaFormularioAdministradorOptimizado(): Promise<{
  success: boolean;
  universidades?: BibliotecaUniversidadOption[];
  carreras?: BibliotecaCarreraOption[];
  materias?: BibliotecaMateriaOption[];
  carrerasSimuladores?: BibliotecaCarreraSimuladorRow[];
  message?: string;
}> {
  try {
    await requireAdminAccess();
    const admin = createAdminClient();
    const globalSlugs = new Set(['aprender-21', 'tecnologia-humanidades']);

    const [
      universidadesRows,
      carrerasRows,
      materiasRows,
      carreraMateriasRows,
      questionCountsRes,
      premiumSetsRows,
      premiumCountsRes,
    ] = await Promise.all([
      fetchAllRows<{ id: string; nombre: string }>((from, to) =>
        admin.from('universidades').select('id, nombre').order('nombre').range(from, to)
      ),
      fetchAllRows<{ id: string; nombre: string | null; universidad_id: string | null }>(
        (from, to) =>
          admin
            .from('carreras')
            .select('id, nombre, universidad_id')
            .order('nombre')
            .range(from, to)
      ),
      fetchAllRows<{
        id: string;
        nombre: string;
        slug: string | null;
        carrera_id: string | null;
      }>((from, to) =>
        admin
          .from('materias')
          .select('id, nombre, slug, carrera_id')
          .order('nombre')
          .range(from, to)
      ),
      fetchAllRows<{ carrera_id: string | null; materia_id: string | null }>((from, to) =>
        admin.from('carrera_materias').select('carrera_id, materia_id').range(from, to)
      ),
      admin.rpc('admin_biblioteca_question_counts'),
      fetchAllRows<{
        id: string;
        materia_id: string | null;
        parcial: number | null;
        created_at: string | null;
      }>((from, to) =>
        admin
          .from('premium_question_sets')
          .select('id, materia_id, parcial, created_at')
          .eq('is_active', true)
          .range(from, to)
      ),
      admin.rpc('admin_premium_question_counts'),
    ]);

    if (questionCountsRes.error) throw questionCountsRes.error;
    if (premiumCountsRes.error) throw premiumCountsRes.error;

    const universidades = universidadesRows;
    const universidadIds = universidades.map((row) => row.id);
    const universidadNombreById = new Map(universidades.map((row) => [row.id, row.nombre]));
    const carreraToUniversidad = new Map(carrerasRows.map((row) => [row.id, row.universidad_id]));
    const carrerasByMateria = new Map<string, Set<string>>();

    for (const relation of carreraMateriasRows) {
      if (!relation.carrera_id || !relation.materia_id) continue;
      const current = carrerasByMateria.get(relation.materia_id) ?? new Set<string>();
      current.add(relation.carrera_id);
      carrerasByMateria.set(relation.materia_id, current);
    }

    const materias: BibliotecaMateriaOption[] = materiasRows.map((materia) => {
      const normalizedName = materia.nombre.toLowerCase();
      const isGeneral =
        globalSlugs.has(materia.slug ?? '') || normalizedName.includes('aprender en el siglo 21');
      const carreraIds = new Set(carrerasByMateria.get(materia.id) ?? []);
      if (!carreraIds.size && materia.carrera_id) carreraIds.add(materia.carrera_id);

      const carreraIdByUniversidad: Record<string, string | null> = {};
      const universidadIdsForMateria = new Set<string>();

      for (const carreraId of carreraIds) {
        const universidadId = carreraToUniversidad.get(carreraId);
        if (!universidadId) continue;
        universidadIdsForMateria.add(universidadId);
        if (!(universidadId in carreraIdByUniversidad)) {
          carreraIdByUniversidad[universidadId] = carreraId;
        }
      }

      if (isGeneral) {
        for (const universidadId of universidadIds) {
          universidadIdsForMateria.add(universidadId);
          carreraIdByUniversidad[universidadId] = null;
        }
      }

      return {
        id: materia.id,
        nombre: materia.nombre,
        slug: materia.slug,
        isGeneral,
        universidadIds: Array.from(universidadIdsForMateria),
        carreraIds: Array.from(carreraIds),
        carreraIdByUniversidad,
      };
    });

    const questionCountsByMateria = new Map<string, { parcial1: number; parcial2: number }>();
    for (const row of (questionCountsRes.data ?? []) as QuestionCountRow[]) {
      if (!row.materia_id) continue;
      const current = questionCountsByMateria.get(row.materia_id) ?? { parcial1: 0, parcial2: 0 };
      const total = Number(row.total ?? 0);
      if (row.parcial === 2) current.parcial2 += total;
      else current.parcial1 += total;
      questionCountsByMateria.set(row.materia_id, current);
    }

    const premiumCountsBySetId = new Map<string, number>();
    for (const row of (premiumCountsRes.data ?? []) as PremiumCountRow[]) {
      if (!row.set_id) continue;
      premiumCountsBySetId.set(row.set_id, Number(row.total ?? 0));
    }

    const latestPremiumSetByMateriaAndParcial = new Map<
      string,
      { id: string; materia_id: string; parcial: number; created_at: string | null }
    >();

    for (const row of premiumSetsRows) {
      if (!row.id || !row.materia_id || !row.parcial) continue;
      const key = `${row.materia_id}::${row.parcial}`;
      const current = latestPremiumSetByMateriaAndParcial.get(key);
      if (!current || (row.created_at ?? '') > (current.created_at ?? '')) {
        latestPremiumSetByMateriaAndParcial.set(key, {
          id: row.id,
          materia_id: row.materia_id,
          parcial: row.parcial,
          created_at: row.created_at,
        });
      }
    }

    for (const setRow of latestPremiumSetByMateriaAndParcial.values()) {
      const premiumCount = premiumCountsBySetId.get(setRow.id) ?? 0;
      if (!premiumCount) continue;
      const current = questionCountsByMateria.get(setRow.materia_id) ?? {
        parcial1: 0,
        parcial2: 0,
      };
      if (setRow.parcial === 2) current.parcial2 += premiumCount;
      else current.parcial1 += premiumCount;
      questionCountsByMateria.set(setRow.materia_id, current);
    }

    const carrerasSimuladores: BibliotecaCarreraSimuladorRow[] = carrerasRows
      .map((carrera) => ({
        carreraId: carrera.id,
        carreraNombre: String(carrera.nombre ?? ''),
        universidadId: carrera.universidad_id,
        universidadNombre: carrera.universidad_id
          ? (universidadNombreById.get(carrera.universidad_id) ?? null)
          : null,
        materias: materias
          .filter((materia) => materia.carreraIds.includes(carrera.id))
          .map((materia) => {
            const counts = questionCountsByMateria.get(materia.id) ?? {
              parcial1: 0,
              parcial2: 0,
            };
            return {
              id: materia.id,
              nombre: materia.nombre,
              parcial1Preguntas: counts.parcial1,
              parcial2Preguntas: counts.parcial2,
              totalPreguntas: counts.parcial1 + counts.parcial2,
            };
          })
          .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
      }))
      .sort((a, b) => a.carreraNombre.localeCompare(b.carreraNombre, 'es'));

    return {
      success: true,
      universidades: universidades.map((row) => ({ id: row.id, nombre: row.nombre })),
      carreras: carrerasRows.map((row) => ({
        id: row.id,
        nombre: String(row.nombre ?? ''),
        universidadId: row.universidad_id,
      })),
      materias,
      carrerasSimuladores,
    };
  } catch (error) {
    logError('admin.obtenerBibliotecaFormularioOptimizado', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'No pudimos cargar la biblioteca.',
    };
  }
}

export type AdministradorUsuarioPaginadoRow = {
  id: string;
  email: string;
  estado: 'activo' | 'inactivo';
  plan: 'free' | 'premium';
  role: 'admin' | 'student';
  last_sign_in_at: string | null;
  created_at: string | null;
  intentos: number;
  preguntas: number;
  correctas: number;
};

export async function obtenerUsuariosAdministradorPaginado(
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
    const admin = createAdminClient();
    const safePage = Math.max(1, Math.floor(page));
    const safePageSize = Math.min(100, Math.max(10, Math.floor(pageSize)));
    const todayStart = argentinaDayStart();
    const adminUserIds = await listAdminUserIds();

    const [authResult, profilesTotalRes, profilesTodayRes, activeUsersRes] = await Promise.all([
      admin.auth.admin.listUsers({ page: safePage, perPage: safePageSize }),
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

    if (authResult.error) throw authResult.error;
    if (profilesTotalRes.error) throw profilesTotalRes.error;
    if (profilesTodayRes.error) throw profilesTodayRes.error;
    if (activeUsersRes.error) throw activeUsersRes.error;

    const authUsers = authResult.data?.users ?? [];
    const userIds = authUsers.map((user) => user.id);

    const [profilesRes, subscriptionsRes, attemptsRes] = userIds.length
      ? await Promise.all([
          admin.from('profiles').select('id, role').in('id', userIds),
          admin
            .from('user_subscriptions')
            .select('user_id, status, started_at, plan_id')
            .in('user_id', userIds)
            .order('started_at', { ascending: false }),
          admin.rpc('admin_user_simulator_aggregates', { target_user_ids: userIds }),
        ])
      : [
          { data: [], error: null },
          { data: [], error: null },
          { data: [], error: null },
        ];

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

    const rows: AdministradorUsuarioPaginadoRow[] = authUsers.map((user) => {
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

    const totalUsers = profilesTotalRes.count ?? rows.length;
    return {
      success: true,
      stats: {
        totalUsers,
        activeToday: Number(activeUsersRes.data ?? 0),
        newRegistrationsToday: profilesTodayRes.count ?? 0,
      },
      rows,
      page: safePage,
      pageSize: safePageSize,
      totalPages: Math.max(1, Math.ceil(totalUsers / safePageSize)),
    };
  } catch (error) {
    logError('admin.obtenerUsuariosPaginado', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'No pudimos cargar usuarios.',
    };
  }
}
