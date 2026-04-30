import { supabase } from '@/lib/supabase';
import type { DashboardMateriaState } from '@/types/supabase';

export type DashboardMateriaSummary = {
  id: string;
  nombre: string;
  carreraId: string | null;
  carreraNombre: string;
};

export type DashboardMateriaDetailsMap = Record<
  string,
  {
    careerName: string;
  }
>;

export async function fetchDashboardMateriaSummaries(): Promise<DashboardMateriaSummary[]> {
  const { data: materias, error: materiasError } = await supabase
    .from('materias')
    .select('id, nombre, carrera_id')
    .order('nombre');

  if (materiasError) {
    throw materiasError;
  }

  const carreraIds = Array.from(
    new Set(
      (materias ?? [])
        .map((materia) => materia.carrera_id)
        .filter((id): id is string => typeof id === 'string' && id.length > 0)
    )
  );

  let carrerasMap = new Map<string, string>();

  if (carreraIds.length > 0) {
    const { data: carreras, error: carrerasError } = await supabase
      .from('carreras')
      .select('id, nombre')
      .in('id', carreraIds);

    if (carrerasError) {
      throw carrerasError;
    }

    carrerasMap = new Map((carreras ?? []).map((carrera) => [carrera.id, carrera.nombre]));
  }

  return (materias ?? []).map((materia) => ({
    id: materia.id,
    nombre: materia.nombre,
    carreraId: materia.carrera_id,
    carreraNombre: materia.carrera_id
      ? carrerasMap.get(materia.carrera_id) ?? 'Carrera'
      : 'Materia general',
  }));
}

export function mapDashboardMateriaDetails(
  materias: DashboardMateriaSummary[]
): DashboardMateriaDetailsMap {
  return materias.reduce<DashboardMateriaDetailsMap>((acc, materia) => {
    acc[materia.id] = { careerName: materia.carreraNombre };
    return acc;
  }, {});
}

export function touchDashboardMateriaState(
  state: {
    lastSubject: DashboardMateriaState | null;
    activeSubjects: DashboardMateriaState[];
    finishedSubjects: DashboardMateriaState[];
    analytics: { subjectsCompleted: number; lastUpdatedAt: string | null };
  },
  subject: DashboardMateriaState
) {
  const nextActiveSubjects = [
    subject,
    ...state.activeSubjects.filter((item) => item.id !== subject.id),
  ].slice(0, 6);

  return {
    ...state,
    lastSubject: subject,
    activeSubjects: nextActiveSubjects,
    analytics: {
      ...state.analytics,
      lastUpdatedAt: new Date().toISOString(),
    },
  };
}
