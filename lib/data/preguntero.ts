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

export function buildParcialHref(materiaNombre: string, materiaId: string, parcial: PregunteroParcialKey) {
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
      const [{ count: totalPreguntas }, sampleRows] = await Promise.all([
        client
          .from('preguntas_banco_public')
          .select('id', { count: 'exact', head: true })
          .eq('materia_id', materiaId)
          .in('parcial', parciales),
        client
          .from('preguntas_banco_public')
          .select('id, enunciado, opciones, parcial')
          .eq('materia_id', materiaId)
          .in('parcial', parciales)
          .order('creado_at', { ascending: false })
          .limit(5),
      ]);

      return {
        materiaId: bootstrap.materiaId,
        materiaNombre: bootstrap.materiaNombre,
        carreraNombre: bootstrap.carreraNombre,
        universidadNombre: bootstrap.universidadNombre,
        parcial,
        parcialNumero,
        totalPreguntas: totalPreguntas ?? 0,
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
  ['preguntero-parcial-data'],
  { revalidate: 600, tags: ['materia-bootstrap'] }
);

export async function getPregunteroParcialData(
  materiaId: string,
  parcial: PregunteroParcialKey
): Promise<PregunteroParcialData | null> {
  return loadParcialData(materiaId, parcial);
}
