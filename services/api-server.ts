import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { createPublicClient } from '@/lib/supabase-public';
import {
  fetchCarreraById,
  fetchCarrerasByUniversidad,
  fetchMateriaById,
  fetchMateriasByCarrera,
  fetchUniversidadById,
  fetchUniversidades,
  type CatalogCarrera as Carrera,
  type CatalogMateria as Materia,
  type CatalogUniversidad as Universidad,
} from '@/lib/data/catalog';

export type { Carrera, Materia, Universidad };

const CATALOG_REVALIDATE_SECONDS = 600;
const CATALOG_CACHE_TAG = 'public-catalog';

const loadCarrerasByUniversidad = unstable_cache(
  async (uniId: string): Promise<Carrera[]> =>
    fetchCarrerasByUniversidad(createPublicClient(), uniId),
  ['catalog-carreras-by-universidad'],
  { revalidate: CATALOG_REVALIDATE_SECONDS, tags: [CATALOG_CACHE_TAG] }
);

const loadMateriasByCarrera = unstable_cache(
  async (carreraId: string): Promise<Materia[]> =>
    fetchMateriasByCarrera(createPublicClient(), carreraId),
  ['catalog-materias-by-carrera'],
  { revalidate: CATALOG_REVALIDATE_SECONDS, tags: [CATALOG_CACHE_TAG] }
);

const loadMateriaById = unstable_cache(
  async (materiaId: string): Promise<Materia | null> =>
    fetchMateriaById(createPublicClient(), materiaId),
  ['catalog-materia-by-id'],
  { revalidate: CATALOG_REVALIDATE_SECONDS, tags: [CATALOG_CACHE_TAG] }
);

const loadCarreraById = unstable_cache(
  async (carreraId: string): Promise<Carrera | null> =>
    fetchCarreraById(createPublicClient(), carreraId),
  ['catalog-carrera-by-id'],
  { revalidate: CATALOG_REVALIDATE_SECONDS, tags: [CATALOG_CACHE_TAG] }
);

const loadUniversidadById = unstable_cache(
  async (uniId: string): Promise<Universidad | null> =>
    fetchUniversidadById(createPublicClient(), uniId),
  ['catalog-universidad-by-id'],
  { revalidate: CATALOG_REVALIDATE_SECONDS, tags: [CATALOG_CACHE_TAG] }
);

const loadUniversidades = unstable_cache(
  async (): Promise<Universidad[]> => fetchUniversidades(createPublicClient()),
  ['catalog-universidades'],
  { revalidate: CATALOG_REVALIDATE_SECONDS, tags: [CATALOG_CACHE_TAG] }
);

// React cache keeps request-local callers deduplicated, while unstable_cache keeps
// public catalog reads reusable across requests and deployments for the TTL above.
export const getCarrerasByUni = cache(loadCarrerasByUniversidad);
export const getMateriasByCarrera = cache(loadMateriasByCarrera);
export const getMateriaById = cache(loadMateriaById);
export const getCarreraById = cache(loadCarreraById);
export const getUniversidadById = cache(loadUniversidadById);
export const getUniversidades = cache(loadUniversidades);
