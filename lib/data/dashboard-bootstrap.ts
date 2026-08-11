import { cache } from 'react';
import { createClientServer } from '@/lib/supabase-server';
import { createPublicClient } from '@/lib/supabase-public';
import type {
  DashboardState,
  PartialStudyInsights,
} from '@/app/actions';
import type {
  DashboardAcademicProfile,
  DashboardMateriaDetailsMap,
  DashboardMateriaSummary,
} from '@/lib/data/dashboard';
import type { DashboardAnalytics } from '@/types/supabase';
import { fetchMateriasByCarrera } from '@/lib/data/catalog';

const defaultDashboardAnalytics: DashboardAnalytics = {
  subjectsCompleted: 0,
  lastUpdatedAt: null,
};

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
        active_subjects: DashboardState['activeSubjects'] | null;
        finished_subjects: DashboardState['finishedSubjects'] | null;
        dashboard_analytics: DashboardAnalytics | null;
      }
    | null
    | undefined
): DashboardState {
  return {
    lastSubject:
      data?.last_subject_id && data.last_subject_name
        ? { id: data.last_subject_id, name: data.last_subject_name }
        : null,
    activeSubjects: data?.active_subjects ?? [],
    finishedSubjects: data?.finished_subjects ?? [],
    analytics: data?.dashboard_analytics ?? defaultDashboardAnalytics,
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
      ? carrerasMap.get(materia.carrera_id) ?? 'Carrera'
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

async function getPartialStudyInsightsForUser(
  supabase: Awaited<ReturnType<typeof createClientServer>>,
  userId: string,
  materiaId: string,
  parcial: number
): Promise<PartialStudyInsights | null> {
  const [{ count: totalPreguntasParcial }, historialResult] = await Promise.all([
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
      .limit(5000),
  ]);

  if (historialResult.error) {
    throw historialResult.error;
  }

  const historialRows = historialResult.data ?? [];
  const uniqueQuestionIds = Array.from(
    new Set(historialRows.map((row) => row.pregunta_id).filter(Boolean))
  ) as string[];

  let preguntasParcialRespondidas = 0;
  let respuestasParcialTotal = 0;
  let respuestasParcialCorrectas = 0;

  if (uniqueQuestionIds.length > 0) {
    const { data: parcialQuestions, error } = await supabase
      .from('preguntas_banco')
      .select('id')
      .in('id', uniqueQuestionIds)
      .eq('parcial', parcial)
      .eq('materia_id', materiaId);

    if (error) {
      throw error;
    }

    const partialIds = new Set((parcialQuestions ?? []).map((question) => question.id));
    preguntasParcialRespondidas = partialIds.size;

    for (const row of historialRows) {
      const questionId = row.pregunta_id;
      if (!questionId || !partialIds.has(questionId)) continue;
      respuestasParcialTotal += 1;
      if (row.es_correcta) {
        respuestasParcialCorrectas += 1;
      }
    }
  }

  const total = totalPreguntasParcial ?? 0;
  const coberturaPorcentaje = total > 0 ? Math.round((preguntasParcialRespondidas / total) * 100) : 0;
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

export const getDashboardBootstrap = cache(
  async (): Promise<DashboardBootstrapResult> => {
    const supabase = await createClientServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        status: 'login',
        state: defaultDashboardState,
        academicProfile: null,
        materiaDetails: {},
        recommendedMaterias: [],
        favoriteMaterias: [],
        favoriteSuggestions: [],
        partialInsights: null,
        partialInsightMateriaName: null,
      };
    }

    try {
      const { data: profileRow, error: profileError } = await supabase
        .from('profiles')
        .select(
          'universidad_id, carrera_id, last_subject_id, last_subject_name, active_subjects, finished_subjects, dashboard_analytics'
        )
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      const state = mapDashboardState(profileRow);
      const universidadId = String(profileRow?.universidad_id ?? '').trim() || null;
      const carreraId = String(profileRow?.carrera_id ?? '').trim() || null;

      const [universidadResponse, carreraResponse] = await Promise.all([
        universidadId
          ? supabase.from('universidades').select('nombre').eq('id', universidadId).maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        carreraId
          ? supabase.from('carreras').select('nombre').eq('id', carreraId).maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ]);

      if (universidadResponse.error) {
        throw universidadResponse.error;
      }

      if (carreraResponse.error) {
        throw carreraResponse.error;
      }

      const academicProfile: DashboardAcademicProfile | null =
        universidadId || carreraId
          ? {
              universidadId,
              universidadNombre: universidadResponse.data?.nombre ?? null,
              carreraId,
              carreraNombre: carreraResponse.data?.nombre ?? null,
            }
          : null;

      if (!universidadId || !carreraId) {
        return {
          status: 'complete-profile',
          state,
          academicProfile,
          materiaDetails: {},
          recommendedMaterias: [],
          favoriteMaterias: [],
          favoriteSuggestions: [],
          partialInsights: null,
          partialInsightMateriaName: null,
        };
      }

      const activeSubjectIds = state.activeSubjects.map((subject) => subject.id);
      const [materiaDetailsRows, favoriteIdsResult] = await Promise.all([
        fetchMateriaSummariesByIds(supabase, activeSubjectIds),
        supabase
          .from('user_favorites')
          .select('materia_id')
          .eq('user_id', user.id)
          .not('materia_id', 'is', null),
      ]);

      if (favoriteIdsResult.error) {
        throw favoriteIdsResult.error;
      }

      const materiaDetails = mapMateriaDetails(materiaDetailsRows);
      const favoriteIds = Array.from(
        new Set((favoriteIdsResult.data ?? []).map((item) => item.materia_id).filter(Boolean))
      ) as string[];

      const publicClient = createPublicClient();

      let recommendedMaterias: DashboardMateriaSummary[] = [];
      let favoriteMaterias: DashboardMateriaSummary[] = [];
      let favoriteSuggestions: DashboardMateriaSummary[] = [];

      let carreraMaterias: DashboardMateriaSummary[] | null = null;
      const getCarreraMaterias = async (): Promise<DashboardMateriaSummary[]> => {
        if (carreraMaterias) {
          return carreraMaterias;
        }
        const suggestedMaterias = await fetchMateriasByCarrera(publicClient, carreraId);
        const carreraNombre = carreraResponse.data?.nombre ?? 'Carrera';
        carreraMaterias = suggestedMaterias.map((materia) => ({
          id: materia.id,
          nombre: materia.nombre,
          carreraId: materia.carrera_id ?? carreraId,
          carreraNombre,
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
        partialInsights = await getPartialStudyInsightsForUser(
          supabase,
          user.id,
          state.lastSubject.id,
          1
        );
        partialInsightMateriaName = state.lastSubject.name ?? null;
      }

      return {
        status: 'ok',
        state,
        academicProfile,
        materiaDetails,
        recommendedMaterias,
        favoriteMaterias,
        favoriteSuggestions,
        partialInsights,
        partialInsightMateriaName,
      };
    } catch (error) {
      console.error('getDashboardBootstrap failed, falling back to degraded state', error);
      return {
        status: 'ok',
        state: defaultDashboardState,
        academicProfile: null,
        materiaDetails: {},
        recommendedMaterias: [],
        favoriteMaterias: [],
        favoriteSuggestions: [],
        partialInsights: null,
        partialInsightMateriaName: null,
      };
    }
  }
);
