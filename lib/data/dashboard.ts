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

export type DashboardAcademicProfile = {
  universidadId: string | null;
  universidadNombre: string | null;
  carreraId: string | null;
  carreraNombre: string | null;
};

async function fetchCarreraNameMap(carreraIds: string[]) {
  const normalizedCarreraIds = Array.from(
    new Set(carreraIds.filter((id): id is string => typeof id === 'string' && id.length > 0))
  );

  if (normalizedCarreraIds.length === 0) {
    return new Map<string, string>();
  }

  const { data: carreras, error: carrerasError } = await supabase
    .from('carreras')
    .select('id, nombre')
    .in('id', normalizedCarreraIds);

  if (carrerasError) {
    throw carrerasError;
  }

  return new Map((carreras ?? []).map((carrera) => [carrera.id, carrera.nombre]));
}

function mapMateriaSummaries(
  materias: Array<{ id: string; nombre: string; carrera_id: string | null }>,
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

export async function fetchDashboardAcademicProfile(
  userId: string
): Promise<DashboardAcademicProfile> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('universidad_id, carrera_id')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const universidadId = profile?.universidad_id ?? null;
  const carreraId = profile?.carrera_id ?? null;

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

  return {
    universidadId,
    universidadNombre: universidadResponse.data?.nombre ?? null,
    carreraId,
    carreraNombre: carreraResponse.data?.nombre ?? null,
  };
}

export async function fetchDashboardProfileCarreraId(userId: string) {
  const profile = await fetchDashboardAcademicProfile(userId);
  return profile.carreraId;
}

export async function fetchDashboardMateriaSummaries(): Promise<DashboardMateriaSummary[]> {
  const { data: materias, error: materiasError } = await supabase
    .from('materias')
    .select('id, nombre, carrera_id')
    .order('nombre');

  if (materiasError) {
    throw materiasError;
  }

  const carrerasMap = await fetchCarreraNameMap(
    (materias ?? []).map((materia) => materia.carrera_id).filter(Boolean) as string[]
  );

  return mapMateriaSummaries(materias ?? [], carrerasMap);
}

export async function searchDashboardMateriaSummaries(
  query: string,
  limit = 24
): Promise<DashboardMateriaSummary[]> {
  const trimmedQuery = query.trim();
  let request = supabase.from('materias').select('id, nombre, carrera_id');

  if (trimmedQuery.length > 0) {
    request = request.ilike('nombre', `%${trimmedQuery}%`);
  }

  const { data: materias, error: materiasError } = await request.order('nombre').limit(limit);

  if (materiasError) {
    throw materiasError;
  }

  const carrerasMap = await fetchCarreraNameMap(
    (materias ?? []).map((materia) => materia.carrera_id).filter(Boolean) as string[]
  );

  return mapMateriaSummaries(materias ?? [], carrerasMap);
}

export async function fetchDashboardMateriaDetailsByIds(
  materiaIds: string[]
): Promise<DashboardMateriaSummary[]> {
  const normalizedIds = Array.from(
    new Set(materiaIds.filter((id): id is string => typeof id === 'string' && id.length > 0))
  );

  if (normalizedIds.length === 0) {
    return [];
  }

  const { data: materias, error: materiasError } = await supabase
    .from('materias')
    .select('id, nombre, carrera_id')
    .in('id', normalizedIds)
    .order('nombre');

  if (materiasError) {
    throw materiasError;
  }

  const carrerasMap = await fetchCarreraNameMap(
    (materias ?? []).map((materia) => materia.carrera_id).filter(Boolean) as string[]
  );

  return mapMateriaSummaries(materias ?? [], carrerasMap);
}

export async function fetchDashboardMateriasByIds(
  materiaIds: string[]
): Promise<DashboardMateriaSummary[]> {
  return fetchDashboardMateriaDetailsByIds(materiaIds);
}

export async function fetchDashboardFavoriteMateriaIds(userId: string) {
  const { data, error } = await supabase
    .from('user_favorites')
    .select('materia_id')
    .eq('user_id', userId)
    .not('materia_id', 'is', null);

  if (error) {
    throw error;
  }

  return Array.from(new Set((data ?? []).map((item) => item.materia_id).filter(Boolean))) as string[];
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
