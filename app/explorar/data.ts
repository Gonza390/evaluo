import { unstable_cache } from 'next/cache';
import { createPublicClient } from '@/lib/supabase-public';
import { fetchExplorarCatalogData } from '@/lib/data/catalog';

export type ExplorarUniversidad = {
  id: string;
  nombre: string;
  carrerasCount: number;
  materiasCount: number;
};

export type ExplorarCarrera = {
  id: string;
  nombre: string;
  universidadId: string | null;
  universidadNombre: string;
  materiasCount: number;
};

export type ExplorarData = {
  universidades: ExplorarUniversidad[];
  carreras: ExplorarCarrera[];
};

const loadExplorarData = unstable_cache(
  async () => fetchExplorarCatalogData(createPublicClient()) as Promise<ExplorarData>,
  ['explorar-catalog'],
  {
    revalidate: 600,
    tags: ['explorar-catalog'],
  }
);

export async function fetchExplorarData(): Promise<ExplorarData> {
  return loadExplorarData();
}
