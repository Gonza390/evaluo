import { unstable_cache } from 'next/cache';
import { createPublicClient } from '@/lib/supabase-public';
import { fetchExplorarCatalogDataRpc } from '@/lib/data/catalog-performance';

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
  readyMateriasCount: number;
  questionMateriasCount: number;
};

export type ExplorarData = {
  universidades: ExplorarUniversidad[];
  carreras: ExplorarCarrera[];
};

const loadExplorarData = unstable_cache(
  async () => fetchExplorarCatalogDataRpc(createPublicClient()) as Promise<ExplorarData>,
  ['explorar-catalog'],
  {
    revalidate: 600,
    tags: ['explorar-catalog'],
  }
);

export async function fetchExplorarData(): Promise<ExplorarData> {
  return loadExplorarData();
}
