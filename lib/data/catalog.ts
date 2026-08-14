import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { isUuid } from '@/lib/uuid';

type QueryClient = Pick<SupabaseClient<Database>, 'from'>;

export interface CatalogCarrera {
  id: string;
  nombre: string;
  universidad_id?: string | null;
}

export interface CatalogMateria {
  id: string;
  nombre: string;
  carrera_id?: string | null;
}

export interface CatalogUniversidad {
  id: string;
  nombre: string;
}

export type CatalogMateriaWithPriority = CatalogMateria & {
  carrera_materias?: Array<{ prioridad: number | null }>;
};

export type ExplorarCatalogData = {
  universidades: Array<{
    id: string;
    nombre: string;
    carrerasCount: number;
    materiasCount: number;
  }>;
  carreras: Array<{
    id: string;
    nombre: string;
    universidadId: string | null;
    universidadNombre: string;
    materiasCount: number;
  }>;
};

export async function fetchCarrerasByUniversidad(client: QueryClient, uniId: string): Promise<CatalogCarrera[]> {
  if (!isUuid(uniId)) return [];
  const { data, error } = await client
    .from('carreras')
    .select('id, nombre, universidad_id')
    .eq('universidad_id', uniId)
    .order('nombre');

  if (error) throw new Error(error.message);
  return (data as CatalogCarrera[] | null) ?? [];
}

export async function fetchMateriasByCarrera(client: QueryClient, carreraId: string): Promise<CatalogMateria[]> {
  if (!isUuid(carreraId)) return [];
  const { data, error } = await client
    .from('materias')
    .select('*, carrera_materias!inner(prioridad)')
    .eq('carrera_materias.carrera_id', carreraId);

  if (error) {
    throw new Error(error.message);
  }

  if (!data) return [];

  const typedData = data as CatalogMateriaWithPriority[];

  return typedData.sort((a, b) => {
    const prioA = a.carrera_materias?.[0]?.prioridad ?? 2;
    const prioB = b.carrera_materias?.[0]?.prioridad ?? 2;
    if (prioA !== prioB) return prioA - prioB;
    return a.nombre.localeCompare(b.nombre);
  });
}

export async function fetchMateriaById(client: QueryClient, materiaId: string): Promise<CatalogMateria | null> {
  if (!isUuid(materiaId)) return null;
  const { data, error } = await client
    .from('materias')
    .select('id, nombre, carrera_id')
    .eq('id', materiaId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return data as CatalogMateria;
}

export async function fetchCarreraById(client: QueryClient, carreraId: string): Promise<CatalogCarrera | null> {
  if (!isUuid(carreraId)) return null;
  const { data, error } = await client
    .from('carreras')
    .select('id, nombre, universidad_id')
    .eq('id', carreraId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return data as CatalogCarrera;
}

export async function fetchUniversidadById(client: QueryClient, uniId: string): Promise<CatalogUniversidad | null> {
  if (!isUuid(uniId)) return null;
  const { data, error } = await client
    .from('universidades')
    .select('id, nombre')
    .eq('id', uniId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return data as CatalogUniversidad;
}

export async function fetchUniversidades(client: QueryClient): Promise<CatalogUniversidad[]> {
  const { data, error } = await client.from('universidades').select('id, nombre').order('nombre');

  if (error) throw new Error(error.message);
  return (data as CatalogUniversidad[] | null) ?? [];
}

export async function fetchExplorarCatalogData(client: QueryClient): Promise<ExplorarCatalogData> {
  const [universidadesResult, carrerasResult, carreraMateriasResult] = await Promise.all([
    client.from('universidades').select('id, nombre').order('nombre'),
    client.from('carreras').select('id, nombre, universidad_id').order('nombre'),
    client.from('carrera_materias').select('carrera_id, materia_id'),
  ]);

  if (universidadesResult.error) {
    throw universidadesResult.error;
  }

  if (carrerasResult.error) {
    throw carrerasResult.error;
  }

  if (carreraMateriasResult.error) {
    throw carreraMateriasResult.error;
  }

  const universidades = (universidadesResult.data as CatalogUniversidad[] | null) ?? [];
  const carreras = (carrerasResult.data as CatalogCarrera[] | null) ?? [];
  const carreraMaterias =
    (carreraMateriasResult.data as Array<{ carrera_id: string | null; materia_id: string | null }> | null) ?? [];

  const universityNameById = new Map(universidades.map((universidad) => [universidad.id, universidad.nombre]));
  const carrerasPorUniversidad = new Map<string, string[]>();
  const materiasPorUniversidad = new Map<string, Set<string>>();
  const materiasPorCarrera = new Map<string, Set<string>>();
  const carreraToUniversity = new Map<string, string>();

  for (const carrera of carreras) {
    const universityId = carrera.universidad_id;
    if (!universityId) continue;
    carreraToUniversity.set(carrera.id, universityId);
    const current = carrerasPorUniversidad.get(universityId) ?? [];
    current.push(carrera.id);
    carrerasPorUniversidad.set(universityId, current);
  }

  for (const relation of carreraMaterias) {
    const carreraId = relation.carrera_id;
    const materiaId = relation.materia_id;
    if (!carreraId || !materiaId) continue;

    const currentCareerMaterias = materiasPorCarrera.get(carreraId) ?? new Set<string>();
    currentCareerMaterias.add(materiaId);
    materiasPorCarrera.set(carreraId, currentCareerMaterias);

    const universityId = carreraToUniversity.get(carreraId);
    if (!universityId) continue;
    const currentUniversityMaterias = materiasPorUniversidad.get(universityId) ?? new Set<string>();
    currentUniversityMaterias.add(materiaId);
    materiasPorUniversidad.set(universityId, currentUniversityMaterias);
  }

  return {
    universidades: universidades.map((universidad) => ({
      id: universidad.id,
      nombre: universidad.nombre,
      carrerasCount: carrerasPorUniversidad.get(universidad.id)?.length ?? 0,
      materiasCount: materiasPorUniversidad.get(universidad.id)?.size ?? 0,
    })),
    carreras: carreras.map((carrera) => ({
      id: carrera.id,
      nombre: carrera.nombre,
      universidadId: carrera.universidad_id ?? null,
      universidadNombre: carrera.universidad_id
        ? (universityNameById.get(carrera.universidad_id) ?? 'Universidad')
        : 'Universidad',
      materiasCount: materiasPorCarrera.get(carrera.id)?.size ?? 0,
    })),
  };
}
