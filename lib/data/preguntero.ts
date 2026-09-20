import { unstable_cache } from 'next/cache';
import { createPublicClient } from '@/lib/supabase-public';
import { getMateriaBootstrap } from '@/lib/data/materia-bootstrap';
import { buildSeoEntitySlug } from '@/lib/seo-intents';

export type PregunteroParcialKey = '1' | '2' | 'integrador';

export interface PregunteroParcialData {
  materiaId: string;
  materiaNombre: string;
  carreraNombre?: string;
  universidadNombre?: string;
  parcial: PregunteroParcialKey;
  parcialNumero: number;
  totalPreguntas: number;
  samplePreguntas: Array<{
    id: string;
    enunciado: string;
    parcial: number;
    opcionesCount: number;
  }>;
}

export interface PregunteroMateriaStats {
  totalPreguntas: number;
  preguntasPorParcial: Array<{ parcial: number; count: number }>;
}

type PregunteroStatsRow = {
  question_count: number | string | null;
  parcial_counts: unknown;
};

type PregunteroStatsRpcClient = {
  rpc: (
    name: 'get_public_preguntero_materia_stats',
    args: { p_materia_id: string }
  ) => PromiseLike<{
    data: PregunteroStatsRow[] | null;
    error: { message?: string } | null;
  }>;
};

function parseParcialCounts(value: unknown): Array<{ parcial: number; count: number }> {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const record = item as Record<string, unknown>;
      const parcial = Number(record.parcial);
      const count = Number(record.count);
      if (!Number.isFinite(parcial) || !Number.isFinite(count) || count <= 0) return null;
      return { parcial, count };
    })
    .filter((item): item is { parcial: number; count: number } => item !== null)
    .sort((a, b) => a.parcial - b.parcial);
}

export async function getPregunteroMateriaStats(
  materiaId: string
): Promise<PregunteroMateriaStats> {
  const client = createPublicClient();
  const { data, error } = await (client as unknown as PregunteroStatsRpcClient).rpc(
    'get_public_preguntero_materia_stats',
    { p_materia_id: materiaId }
  );

  if (error) {
    throw new Error(error.message || 'No se pudieron cargar las estadísticas del preguntero.');
  }

  const row = data?.[0];
  const totalPreguntas = Math.max(0, Number(row?.question_count ?? 0) || 0);

  return {
    totalPreguntas,
    preguntasPorParcial: parseParcialCounts(row?.parcial_counts),
  };
}

export function parsePregunteroParcial(value: string): PregunteroParcialKey | null {
  if (value === '1' || value === '2' || value === 'integrador') {
    return value;
  }
  return null;
}

export function parcialToPreguntaFilter(parcial: PregunteroParcialKey) {
  if (parcial === 'integrador') {
    return { parciales: [1, 2], label: 'Integrador' };
  }
  return { parciales: [Number(parcial)], label: `Parcial ${parcial}` };
}

export function buildParcialHref(
  materiaNombre: string,
  materiaId: string,
  parcial: PregunteroParcialKey
) {
  return `/pregunteros/${buildSeoEntitySlug(materiaNombre, materiaId)}/parcial/${parcial}`;
}

const loadParcialData = unstable_cache(
  async (materiaId: string, parcial: PregunteroParcialKey): Promise<PregunteroParcialData | null> => {
    const client = createPublicClient();
    const bootstrap = await getMateriaBootstrap({ materiaId });

    if (bootstrap.materiaFound === false) {
      return null;
    }

    const { parciales } = parcialToPreguntaFilter(parcial);
    const parcialNumero = parcial === 'integrador' ? 3 : Number(parcial);

    try {
      const [stats, sampleRows] = await Promise.all([
        getPregunteroMateriaStats(materiaId),
        client
          .from('preguntas_banco_public')
          .select('id, enunciado, opciones, parcial')
          .eq('materia_id', materiaId)
          .in('parcial', parciales)
          .order('creado_at', { ascending: false })
          .limit(5),
      ]);

      const parcialSet = new Set(parciales);
      const totalPreguntas = stats.preguntasPorParcial.reduce(
        (total, item) => (parcialSet.has(item.parcial) ? total + item.count : total),
        0
      );

      return {
        materiaId: bootstrap.materiaId,
        materiaNombre: bootstrap.materiaNombre,
        carreraNombre: bootstrap.carreraNombre,
        universidadNombre: bootstrap.universidadNombre,
        parcial,
        parcialNumero,
        totalPreguntas,
        samplePreguntas: ((sampleRows.data ?? []) as Array<{
          id: string;
          enunciado: string;
          opciones: unknown;
          parcial: number | null;
        }>).map((row) => ({
          id: row.id,
          enunciado: row.enunciado,
          parcial: row.parcial ?? 1,
          opcionesCount: Array.isArray(row.opciones) ? row.opciones.length : 0,
        })),
      };
    } catch {
      return {
        materiaId: bootstrap.materiaId,
        materiaNombre: bootstrap.materiaNombre,
        carreraNombre: bootstrap.carreraNombre,
        universidadNombre: bootstrap.universidadNombre,
        parcial,
        parcialNumero,
        totalPreguntas: 0,
        samplePreguntas: [],
      };
    }
  },
  ['preguntero-parcial-data-v2'],
  { revalidate: 600, tags: ['materia-bootstrap'] }
);

export async function getPregunteroParcialData(
  materiaId: string,
  parcial: PregunteroParcialKey
): Promise<PregunteroParcialData | null> {
  return loadParcialData(materiaId, parcial);
}
