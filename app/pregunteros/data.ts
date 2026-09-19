import { unstable_cache } from 'next/cache';
import { createPublicClient } from '@/lib/supabase-public';
import { isSiglo21University } from '@/lib/seo-search-copy';

export type PregunteroHubMateria = {
  materiaId: string;
  materiaNombre: string;
};

export type PregunteroHubCarrera = {
  carreraId: string;
  carreraNombre: string;
  universidadNombre: string;
  materias: PregunteroHubMateria[];
};

export type PregunteroHubCarreraSummary = {
  carreraId: string;
  carreraNombre: string;
  universidadNombre: string;
  materiaCount: number;
};

type PregunteroRow = {
  universidad_id: string;
  universidad_nombre: string;
  carrera_id: string;
  carrera_nombre: string;
  materia_id: string;
  materia_nombre: string;
  question_count: number | string | null;
  parciales: number[] | null;
};

type RpcResult = { data: unknown; error: { message?: string } | null };
type RpcClient = {
  rpc: (name: string) => PromiseLike<RpcResult>;
};

export function summarizePregunteroHubData(
  carreras: PregunteroHubCarrera[]
): PregunteroHubCarreraSummary[] {
  return carreras.map((carrera) => ({
    carreraId: carrera.carreraId,
    carreraNombre: carrera.carreraNombre,
    universidadNombre: carrera.universidadNombre,
    materiaCount: carrera.materias.length,
  }));
}

export const loadPregunteroHubData = unstable_cache(
  async (): Promise<PregunteroHubCarrera[]> => {
    const client = createPublicClient();
    const { data, error } = await (client as unknown as RpcClient).rpc(
      'get_public_preguntero_catalog'
    );
    if (error) throw new Error(error.message || 'No se pudo cargar el catálogo de pregunteros.');

    const careerMap = new Map<string, PregunteroHubCarrera>();
    for (const row of (data ?? []) as PregunteroRow[]) {
      if (!row.carrera_id || !row.materia_id || !row.universidad_nombre) continue;
      const current = careerMap.get(row.carrera_id) ?? {
        carreraId: row.carrera_id,
        carreraNombre: row.carrera_nombre.trim(),
        universidadNombre: row.universidad_nombre.trim(),
        materias: [],
      };
      if (!current.materias.some((materia) => materia.materiaId === row.materia_id)) {
        current.materias.push({
          materiaId: row.materia_id,
          materiaNombre: row.materia_nombre.trim(),
        });
      }
      careerMap.set(row.carrera_id, current);
    }

    return [...careerMap.values()]
      .map((carrera) => ({
        ...carrera,
        materias: carrera.materias.sort((a, b) =>
          a.materiaNombre.localeCompare(b.materiaNombre, 'es')
        ),
      }))
      .sort((a, b) => {
        const aSiglo21 = isSiglo21University(a.universidadNombre) ? 0 : 1;
        const bSiglo21 = isSiglo21University(b.universidadNombre) ? 0 : 1;
        if (aSiglo21 !== bSiglo21) return aSiglo21 - bSiglo21;
        const byUniversity = a.universidadNombre.localeCompare(b.universidadNombre, 'es');
        return byUniversity || a.carreraNombre.localeCompare(b.carreraNombre, 'es');
      });
  },
  ['preguntero-hub-v7-rpc'],
  { revalidate: 3600, tags: ['universidad-data'] }
);
