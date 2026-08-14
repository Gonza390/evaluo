import {
  buildResumenKey,
  formatResumenModulesLabel,
  getMateriaContextErrorMessage,
  getModuleNumber,
  getResumenesErrorMessage,
  scoreResumenCompleteness,
  type RecursoResumenRow,
  type Resumen,
} from '@/app/explorar/materia/[id]/materia-content.helpers';
import {
  getSimulatorRatingsSummaryByMateria,
  getSimulatorUsageSummaryByMateria,
  type SimulatorRatingSummary,
  type SimulatorUsageSummary,
} from '@/app/actions';
import { logError } from '@/lib/observability';
import { createPublicClient } from '@/lib/supabase-public';
import { unstable_cache } from 'next/cache';

export interface MateriaBootstrapData {
  materiaId: string;
  materiaFound: boolean | null;
  materiaNombre: string;
  carreraId?: string;
  carreraNombre?: string;
  universidadId?: string;
  universidadNombre?: string;
  contextError: string | null;
  initialResumenes: Resumen[];
  initialResumenesError: string | null;
  initialSimulatorRatings: Record<number, SimulatorRatingSummary>;
  initialSimulatorUsage: Record<number, SimulatorUsageSummary>;
}

function toRecord<T extends { parcial: number }>(rows: T[]) {
  return rows.reduce<Record<number, T>>((acc, row) => {
    acc[row.parcial] = row;
    return acc;
  }, {});
}

async function loadInitialResumenes(materiaId: string) {
  const client = createPublicClient();

  try {
    const [{ data, error }, recursosResult] = await Promise.all([
      client
        .from('resumenes')
        .select('id, title, author_name, file_url, module_id, score, created_at')
        .eq('materia_id', materiaId)
        .eq('module_id', 1)
        .order('created_at', { ascending: false })
        .limit(12),
      client
        .from('recursos')
        .select('id, nombre, url_archivo, creado_at, etiqueta, paginas')
        .eq('materia_id', materiaId)
        .eq('tipo', 'resumen-modulo'),
    ]);

    if (error) {
      throw error;
    }

    if (recursosResult.error) {
      throw recursosResult.error;
    }

    const recursosResumenSource = recursosResult.data ?? [];
    const moduleMap = new Map<string, number[]>();

    for (const recurso of recursosResumenSource) {
      const moduleNumber = recurso.etiqueta ? getModuleNumber(recurso.etiqueta) : null;
      if (!moduleNumber) continue;
      const key = recurso.url_archivo?.trim().toLowerCase() || recurso.nombre.trim().toLowerCase();
      if (!key) continue;
      const currentModules = moduleMap.get(key) ?? [];
      moduleMap.set(key, [...currentModules, moduleNumber]);
    }

    const recursoResumenes = recursosResumenSource
      .filter((recurso: RecursoResumenRow) => {
        const moduleNumber = recurso.etiqueta ? getModuleNumber(recurso.etiqueta) : null;
        return moduleNumber === 1;
      })
      .map((recurso: RecursoResumenRow): Resumen => {
        const key = recurso.url_archivo?.trim().toLowerCase() || recurso.nombre.trim().toLowerCase();
        return {
          id: `recurso-${recurso.id}`,
          title: recurso.nombre,
          author_name: formatResumenModulesLabel(moduleMap.get(key) ?? []),
          file_url: recurso.url_archivo,
          module_id: '1',
          score: null,
          created_at: recurso.creado_at,
          pages: recurso.paginas,
        };
      });

    const dedupedResumenes = new Map<string, Resumen>();

    for (const resumen of [
      ...((data ?? []).map((item) => ({ ...item, pages: null })) as Resumen[]),
      ...recursoResumenes,
    ]) {
      const key = buildResumenKey(resumen);
      const existing = dedupedResumenes.get(key);

      if (!existing || scoreResumenCompleteness(resumen) > scoreResumenCompleteness(existing)) {
        dedupedResumenes.set(key, resumen);
      }
    }

    return {
      initialResumenes: Array.from(dedupedResumenes.values()),
      initialResumenesError: null,
    };
  } catch (error) {
    logError('materiaBootstrap.resumenes', error, { materiaId });
    return {
      initialResumenes: [],
      initialResumenesError: getResumenesErrorMessage(),
    };
  }
}

const loadMateriaBootstrap = unstable_cache(
  async (materiaId: string, requestedCarreraId: string): Promise<MateriaBootstrapData> => {
  const client = createPublicClient();

  let materiaFound: boolean | null = null;
  let materiaNombre = 'Materia';
  let carreraId = requestedCarreraId;
  let carreraNombre = '';
  let universidadId = '';
  let universidadNombre = '';
  let contextError: string | null = null;

  try {
    const { data: materiaData, error: materiaError } = await client
      .from('materias')
      .select('nombre, carrera_id')
      .eq('id', materiaId)
      .maybeSingle();

    if (materiaError) {
      throw materiaError;
    }

    if (!materiaData) {
      materiaFound = false;
    } else {
      materiaFound = true;
      materiaNombre = materiaData.nombre?.trim() || 'Materia';
      carreraId ||= String(materiaData.carrera_id ?? '').trim();
    }

    if (carreraId) {
      const { data: carreraData, error: carreraError } = await client
        .from('carreras')
        .select('nombre, universidad_id')
        .eq('id', carreraId)
        .maybeSingle();

      if (carreraError) {
        throw carreraError;
      }

      carreraNombre = carreraData?.nombre?.trim() || '';
      universidadId = String(carreraData?.universidad_id ?? '').trim();

      if (universidadId) {
        const { data: universidadData, error: universidadError } = await client
          .from('universidades')
          .select('nombre')
          .eq('id', universidadId)
          .maybeSingle();

        if (universidadError) {
          throw universidadError;
        }

        universidadNombre = universidadData?.nombre?.trim() || '';
      }
    }
  } catch (error) {
    logError('materiaBootstrap.context', error, { materiaId });
    contextError = getMateriaContextErrorMessage();
  }

  const [{ initialResumenes, initialResumenesError }, ratings, usage] = await Promise.all([
    loadInitialResumenes(materiaId),
    getSimulatorRatingsSummaryByMateria(materiaId),
    getSimulatorUsageSummaryByMateria(materiaId),
  ]);

  return {
    materiaId,
    materiaFound,
    materiaNombre,
    carreraId: carreraId || undefined,
    carreraNombre: carreraNombre || undefined,
    universidadId: universidadId || undefined,
    universidadNombre: universidadNombre || undefined,
    contextError,
    initialResumenes,
    initialResumenesError,
    initialSimulatorRatings: toRecord(ratings),
    initialSimulatorUsage: toRecord(usage),
  };
  },
  ['materia-bootstrap'],
  { revalidate: 600, tags: ['materia-bootstrap'] }
);

export async function getMateriaBootstrap(input: {
  materiaId: string;
  requestedCarreraId?: string;
}): Promise<MateriaBootstrapData> {
  return loadMateriaBootstrap(input.materiaId, input.requestedCarreraId?.trim() || '');
}
