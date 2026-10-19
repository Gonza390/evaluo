import { supabase } from '@/lib/supabase-client';
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

export async function getCarrerasByUni(uniId: string): Promise<Carrera[]> {
  return fetchCarrerasByUniversidad(supabase, uniId);
}

export async function getMateriasByCarrera(carreraId: string): Promise<Materia[]> {
  return fetchMateriasByCarrera(supabase, carreraId);
}

export async function getMateriaById(materiaId: string): Promise<Materia | null> {
  return fetchMateriaById(supabase, materiaId);
}

export async function getCarreraById(carreraId: string): Promise<Carrera | null> {
  return fetchCarreraById(supabase, carreraId);
}

export async function getUniversidadById(uniId: string): Promise<Universidad | null> {
  return fetchUniversidadById(supabase, uniId);
}

export async function getUniversidades() {
  return fetchUniversidades(supabase);
}
