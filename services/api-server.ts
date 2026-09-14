import { cache } from 'react';
import { createPublicClient } from '@/lib/supabase-public';
import { withTransientDataRetry } from '@/lib/data/transient-retry';
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

const getPublicCatalogClient = cache(() => createPublicClient());

export const getCarrerasByUni = cache(async (uniId: string): Promise<Carrera[]> => {
  return withTransientDataRetry(() => fetchCarrerasByUniversidad(getPublicCatalogClient(), uniId));
});

export const getMateriasByCarrera = cache(async (carreraId: string): Promise<Materia[]> => {
  return withTransientDataRetry(() => fetchMateriasByCarrera(getPublicCatalogClient(), carreraId));
});

export const getMateriaById = cache(async (materiaId: string): Promise<Materia | null> => {
  return withTransientDataRetry(() => fetchMateriaById(getPublicCatalogClient(), materiaId));
});

export const getCarreraById = cache(async (carreraId: string): Promise<Carrera | null> => {
  return withTransientDataRetry(() => fetchCarreraById(getPublicCatalogClient(), carreraId));
});

export const getUniversidadById = cache(async (uniId: string): Promise<Universidad | null> => {
  return withTransientDataRetry(() => fetchUniversidadById(getPublicCatalogClient(), uniId));
});

export const getUniversidades = cache(async () => {
  return withTransientDataRetry(() => fetchUniversidades(getPublicCatalogClient()));
});
