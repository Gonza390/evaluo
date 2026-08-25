import { cache } from 'react';
import { unstable_cache as nextCache } from 'next/cache';
import { createClientServer } from '@/lib/supabase-server';
import { createPublicClient } from '@/lib/supabase-public';
import { createAdminClient } from '@/lib/supabase-admin';
import type { DashboardState, PartialStudyInsights } from '@/lib/actions/dashboard';
import type {
  DashboardAcademicProfile,
  DashboardMateriaDetailsMap,
  DashboardMateriaSummary,
} from '@/lib/data/dashboard';
import {
  defaultDashboardAnalytics,
  parseDashboardAnalytics,
  parseDashboardMateriaStates,
} from '@/lib/dashboard-state';
import { fetchMateriasByCarrera } from '@/lib/data/catalog';
import { getRequestUser } from '@/lib/auth-session';
import { getRequestAcademicLabels, getRequestProfile } from '@/lib/data/request-profile';

const defaultDashboardState: DashboardState = {
  lastSubject: null,
  activeSubjects: [],
  finishedSubjects: [],
  analytics: defaultDashboardAnalytics,
};

export interface DashboardBootstrapData {
  state: DashboardState;
  academicProfile: DashboardAcademicProfile | null;
  materiaDetails: DashboardMateriaDetailsMap;
  recommendedMaterias: DashboardMateriaSummary[];
  favoriteMaterias: DashboardMateriaSummary[];
  favoriteSuggestions: DashboardMateriaSummary[];
  partialInsights: PartialStudyInsights | null;
  partialInsightMateriaName: string | null;
}

export interface DashboardBootstrapResult extends DashboardBootstrapData {
  status: 'ok' | 'login' | 'complete-profile';
}

export type DashboardDeferredData = Pick<
  DashboardBootstrapData,
  | 'academicProfile'
  | 'materiaDetails'
  | 'recommendedMaterias'
  | 'favoriteMaterias'
  | 'favoriteSuggestions'
  | 'partialInsights'
  | 'partialInsightMateriaName'
>;

type MateriaRow = {
  id: string;
  nombre: string;
  carrera_id: string | null;
};

function mapDashboardState(
  data:
    | {
        last_subject_id: string | null;
        last_subject_name: string | null;
        active_subjects: import('@/types/supabase').Json;
        finished_subjects: import('@/types/supabase').Json;
        dashboard_analytics: import('@/types/supabase').Json;
      }
    | null
    | undefined
): DashboardState {
  return {
    lastSubject:
      data?.last_subject_id && data.last_subject_name
        ? { id: data.last_subject_id, name: data.last_subject_name }
        : null,
    activeSubjects: parseDashboardMateriaStates(data?.active_subjects),
    finishedSubjects: parseDashboardMateriaStates(data?.finished_subjects),
    analytics: parseDashboardAnalytics(data?.dashboard_analytics),
  };
}

async function fetchCarreraNameMap(
  supabase: Awaited<ReturnType<typeof createClientServer>>,
  carreraIds: string[]
) {
  const normalizedCarreraIds = Array.from(
    new Set(carreraIds.filter((id): id is string => typeof id === 'string' && id.length > 0))
  );

  if (normalizedCarreraIds.length === 0) {
    return new Map<string, string>();
  }

  const { data: carreras, error } = await supabase
    .from('carreras')
    .select('id, nombre')
    .in('id', normalizedCarreraIds);

  if (error) {
    throw error;
  }

  return new Map((carreras ?? []).map((carrera) => [carrera.id, carrera.nombre]));
}

function mapMateriaSummaries(
  materias: MateriaRow[],
  carrerasMap: Map<string, string>
): DashboardMateriaSummary[] {
  return materias.map((materia) => ({
    id: materia.id,
    nombre: materia.nombre,
    carreraId: materia.carrera_id,
    carreraNombre: materia.carrera_id
      ? (carrerasMap.get(materia.carrera_id) ?? 'Carrera')
      : 'Materia general',
  }));
}

function mapMateriaDetails(materias: DashboardMateriaSummary[]): DashboardMateriaDetailsMap {
  return materias.reduce<DashboardMateriaDetailsMap>((acc, materia) => {
    acc[materia.id] = { careerName: materia.carreraNombre };
    return acc;
  }, {});
}

async function fetchMateriaSummariesByIds(
  supabase: Awaited<ReturnType<typeof createClientServer>>,
  materiaIds: string[]
) {
  const normalizedIds = Array.from(
    new Set(materiaIds.filter((id): id is string => typeof id === 'string' && id.length > 0))
  );

  if (normalizedIds.length === 0) {
    return [] as DashboardMateriaSummary[];
  }

  const { data: materias, error } = await supabase
    .from('materias')
    .select('id, nombre, carrera_id')
    .in('id', normalizedIds)
    .order('nombre');

  if (error) {
    throw error;
  }

  const carrerasMap = await fetchCarreraNameMap(
    supabase,
    (materias ?? []).map((materia) => materia.carrera_id).filter(Boolean) as string[]
  );

  return mapMateriaSummaries((materias ?? []) as MateriaRow[], carrerasMap);
}

async function getPartialStudyInsightsForUserRaw(
  userId: string,
  materiaId: string,
  parcial: number
): Promise<PartialStudyInsights | null> {
  const supabase = createAdminClient();

  type AggregateStatsRow = {
    total_preguntas: number;
    total_respuestas: number;
    correctas: number;
    distintas_preguntas: number;
  };

  const aggregatePromise = (async (): Promise<AggregateStatsRow | null> => {
    try {
      const rpc = supabase.rpc as unknown as (
        name: string,
        args: Record<string, unknown>
      ) => Promise<{ data: unknown; error: unknown }>;

      const result = await rpc('get_user_partial_stats', {
        p_user_id: userId,
        p_materia_id: materiaId,
        p_parcial: parcial,
      });

      if (result.error) throw result.error;
      const row = Array.isArray(result.data) ? result.data[0] : result.data;
      if (row && typeof (row as AggregateStatsRow).total_respuestas === 'number') {
        return row as AggregateStatsRow;
      }
      return null;
    } catch {
      return null;
    }
  })();

  const aggregateStats = await aggregatePromise;
  let total = Math.max(0, Number(aggregateStats?.total_preguntas) || 0);

  let respuestasParcialTotal = 0;
  let respuestasParcialCorrectas = 0;
  let preguntasParcialRespondidas = 0;

  if (aggregateStats) {
    respuestasParcialTotal = Math.max(0, Number(aggregateStats.total_respuestas) || 0);
    respuestasParcialCorrectas = Math.max(0, Number(aggregateStats.correctas) || 0);
    preguntasParcialRespondidas = Math.max(0, Number(aggregateStats.distintas_preguntas) || 0);
  } else {
    const [totalCountResult, historialResult] = await Promise.all([
      supabase
        .from('preguntas_banco')
        .select('id', { count: 'exact', head: true })
        .eq('materia_id', materiaId)
        .eq('parcial', parcial),
      supabase
        .from('historial_respuestas')
        .select('pregunta_id, es_correcta')
        .eq('usuario_id', userId)
        .eq('materia_id', materiaId)
        .not('pregunta_id', 'is', null)
        .limit(2000),
    ]);

    if (totalCountResult.error || historialResult.error) {
      throw totalCountResult.error ?? historialResult.error;
    }

    total = totalCountResult.count ?? 0;

    const historialRows = (historialResult.data ?? []) as Array<{
      pregunta_id: string | null;
      es_correcta: boolean | null;
    }>;

    const seen = new Set<string>();
    for (const row of historialRows) {
      const qid = row.pregunta_id;
      if (!qid) continue;
      respuestasParcialTotal += 1;
      if (row.es_correcta) respuestasParcialCorrectas += 1;
      if (!seen.has(qid)) {
        seen.add(qid);
        preguntasParcialRespondidas += 1;
      }
    }
  }

  const coberturaPorcentaje =
    total > 0 ? Math.round((preguntasParcialRespondidas / total) * 100) : 0;
  const modelosEstimadosRealizados = Math.max(0, Math.floor(respuestasParcialTotal / 30));
  const promedioAciertoPorcentaje =
    respuestasParcialTotal > 0
      ? Number(((respuestasParcialCorrectas / respuestasParcialTotal) * 100).toFixed(1))
      : 0;

  const practiceFactor = Math.min(100, modelosEstimadosRealizados * 20);
  const probabilityRaw =
    coberturaPorcentaje * 0.45 + promedioAciertoPorcentaje * 0.4 + practiceFactor * 0.15;

  return {
    materiaId,
    parcial,
    totalPreguntasParcial: total,
    preguntasRespondidasParcial: preguntasParcialRespondidas,
    preguntasAcertadasParcial: respuestasParcialCorrectas,
    coberturaPorcentaje,
    modelosEstimadosRealizados,
    promedioAciertoPorcentaje,
    probabilidadAprobar: Math.max(0, Math.min(99, Math.round(probabilityRaw))),
  };
}

const getPartialStudyInsightsForUser = nextCache(
  getPartialStudyInsightsForUserRaw,
  ['user-partial-study-insights'],
  {
    revalidate: 90,
    tags: ['user-partial-study-insights', 'user-dashboard'],
  }
);

const fetchMateriasByCarreraCached = nextCache(
  async (carreraId: string) => {
    return fetchMateriasByCarrera(createPublicClient(), carreraId);
  },
  ['catalog-materias-carrera'],
  {
    revalidate: 600,
    tags: ['catalog-materias'],
  }
);

const emptyDeferredData: DashboardDeferredData = {
  academicProfile: null,
  materiaDetails: {},
  recommendedMaterias: [],
  favoriteMaterias: [],
  favoriteSuggestions: [],
  partialInsights: null,
  partialInsightMateriaName: null,
};

async function loadDashboardDeferredData({
  supabase,
  userId,
  state,
  carreraId,
  universidadId,
}: {
  supabase: Awaited<ReturnType<typeof createClientServer>>;
  userId: string;
  state: DashboardState;
  carreraId: string;
  universidadId: string;
}): Promise<DashboardDeferredData> {
  try {
    const labelsPromise = getRequestAcademicLabels(carreraId, universidadId);
    const activeSubjectIds = state.activeSubjects.map((subject) => subject.id);
    const [materiaDetailsRows, favoriteIdsResult] = await Promise.all([
      fetchMateriaSummariesByIds(supabase, activeSubjectIds),
      supabase
        .from('user_favorites')
        .select('materia_id')
        .eq('user_id', userId)
        .not('materia_id', 'is', null),
    ]);

    if (favoriteIdsResult.error) {
      throw favoriteIdsResult.error;
    }

    const materiaDetails = mapMateriaDetails(materiaDetailsRows);
    const favoriteIds = Array.from(
      new Set((favoriteIdsResult.data ?? []).map((item) => item.materia_id).filter(Boolean))
    ) as string[];

    let recommendedMaterias: DashboardMateriaSummary[] = [];
    let favoriteMaterias: DashboardMateriaSummary[] = [];
    let favoriteSuggestions: DashboardMateriaSummary[] = [];

    let carreraMaterias: DashboardMateriaSummary[] | null = null;
    const getCarreraMaterias = async (): Promise<DashboardMateriaSummary[]> => {
      if (carreraMaterias) {
        return carreraMaterias;
      }
      const suggestedMaterias = await fetchMateriasByCarreraCached(carreraId);
      const labels = await labelsPromise;
      carreraMaterias = suggestedMaterias.map((materia) => ({
        id: materia.id,
        nombre: materia.nombre,
        carreraId: materia.carrera_id ?? carreraId,
        carreraNombre: labels.carreraNombre ?? 'Carrera',
      }));
      return carreraMaterias;
    };

    if (favoriteIds.length > 0) {
      favoriteMaterias = await fetchMateriaSummariesByIds(supabase, favoriteIds);
    } else {
      favoriteSuggestions = (await getCarreraMaterias()).slice(0, 4);
    }

    if (state.activeSubjects.length === 0) {
      recommendedMaterias = (await getCarreraMaterias()).slice(0, 3);
    }

    let partialInsights: PartialStudyInsights | null = null;
    let partialInsightMateriaName: string | null = null;

    if (state.lastSubject?.id) {
      partialInsights = await getPartialStudyInsightsForUser(userId, state.lastSubject.id, 1);
      partialInsightMateriaName = state.lastSubject.name ?? null;
    }

    const labels = await labelsPromise;
    return {
      academicProfile: {
        universidadId,
        universidadNombre: labels.universidadNombre,
        carreraId,
        carreraNombre: labels.carreraNombre,
      },
      materiaDetails,
      recommendedMaterias,
      favoriteMaterias,
      favoriteSuggestions,
      partialInsights,
      partialInsightMateriaName,
    };
  } catch (error) {
    console.error('loadDashboardDeferredData failed, using empty secondary data', error);
    return emptyDeferredData;
  }
}

export const getDashboardBootstrapStream = cache(async () => {
  const user = await getRequestUser();

  if (!user) {
    return {
      initial: {
        status: 'login' as const,
        state: defaultDashboardState,
        ...emptyDeferredData,
      },
      deferred: Promise.resolve(emptyDeferredData),
    };
  }

  try {
    const { data: profileRow, error: profileError } = await getRequestProfile(user.id);
    if (profileError) throw profileError;

    const state = mapDashboardState(profileRow);
    const universidadId = String(profileRow?.universidad_id ?? '').trim() || null;
    const carreraId = String(profileRow?.carrera_id ?? '').trim() || null;
    const academicProfile: DashboardAcademicProfile | null =
      universidadId || carreraId
        ? {
            universidadId,
            universidadNombre: null,
            carreraId,
            carreraNombre: null,
          }
        : null;

    const status = !universidadId || !carreraId ? ('complete-profile' as const) : ('ok' as const);
    const initial: DashboardBootstrapResult = {
      status,
      state,
      ...emptyDeferredData,
      academicProfile,
    };

    if (status === 'complete-profile') {
      return { initial, deferred: Promise.resolve(emptyDeferredData) };
    }
    if (!carreraId || !universidadId) {
      throw new Error('Dashboard bootstrap reached ok state without academic profile ids');
    }

    const supabase = await createClientServer();
    const deferred = loadDashboardDeferredData({
      supabase,
      userId: user.id,
      state,
      carreraId,
      universidadId,
    });

    return { initial, deferred };
  } catch (error) {
    console.error('getDashboardBootstrapStream failed', error);
    throw error;
  }
});

export const getDashboardBootstrap = cache(async (): Promise<DashboardBootstrapResult> => {
  const stream = await getDashboardBootstrapStream();
  return { ...stream.initial, ...(await stream.deferred) };
});
