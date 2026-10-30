import { Suspense } from 'react';
import { unstable_cache } from 'next/cache';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createPublicClient } from '@/lib/supabase-public';
import { isUuid } from '@/lib/uuid';
import { createClientServer } from '@/lib/supabase-server';
import { logError } from '@/lib/observability';
import { isTransientSimulatorCatalogError } from '@/lib/simulator-catalog-retry';

import SimuladorExamen from '@/components/simulador/LazySimuladorExamen';

type PageProps = {
  params: Promise<{ materia_id: string; parcial: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

// Public catalog data only: never cache auth, student PDFs, exercises or progress.
const getPublicMateriaMetadata = unstable_cache(
  async (materiaId: string) => {
    const client = createPublicClient();
    const { data: materia, error } = await client
      .from('materias')
      .select('nombre, carrera_id')
      .eq('id', materiaId)
      .maybeSingle();
    if (error) throw error;
    if (!materia) return null;

    let carreraNombre: string | null = null;
    if (materia.carrera_id) {
      const { data: carrera, error: carreraError } = await client
        .from('carreras')
        .select('nombre')
        .eq('id', materia.carrera_id)
        .maybeSingle();
      if (carreraError) throw carreraError;
      carreraNombre = carrera?.nombre?.trim() ?? null;
    }
    return { nombre: materia.nombre, carreraNombre };
  },
  ['public-simulator-materia-metadata-v1'],
  { revalidate: 600 },
);

async function queryPublicMateriaExists(materiaId: string, timeoutMs: number): Promise<boolean> {
  const client = createPublicClient();
  const { data, error } = await client
    .from('materias')
    .select('id')
    .eq('id', materiaId)
    .abortSignal(AbortSignal.timeout(timeoutMs))
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

const publicMateriaExists = unstable_cache(
  async (materiaId: string) => {
    try {
      return await queryPublicMateriaExists(materiaId, 8000);
    } catch (error) {
      // Reintento único, corto y solo para fallos transitorios; nunca para 4xx.
      if (!isTransientSimulatorCatalogError(error)) throw error;
      return queryPublicMateriaExists(materiaId, 2500);
    }
  },
  ['public-simulator-materia-exists-v2'],
  { revalidate: 600 },
);

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { materia_id } = await params;

  if (!isUuid(materia_id)) {
    return {
      title: 'Preguntero',
      robots: { index: false, follow: false },
    };
  }

  try {
    const materia = await getPublicMateriaMetadata(materia_id);
    if (!materia) {
      return { title: 'Preguntero', robots: { index: false, follow: false } };
    }

    const carreraNombre = materia.carreraNombre;
    const materiaNombre = materia.nombre?.trim() || 'Preguntero';

    return {
      title: `Preguntero de ${materiaNombre}`,
      description: carreraNombre
        ? `Practicá el parcial de ${materiaNombre} (${carreraNombre}) con el Preguntero de Evaluo.`
        : `Practicá el parcial de ${materiaNombre} con el Preguntero de Evaluo.`,
      robots: { index: false, follow: true },
    };
  } catch {
    return {
      title: 'Preguntero',
    };
  }
}

async function SimuladorContent({
  materiaId,
  parcial,
  searchParams,
}: {
  materiaId: string;
  parcial: number;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sParams = await searchParams;

  const supabase = await createClientServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const demoMode = !user;
  const universidadId = sParams.universidad_id as string;
  const carreraId = sParams.carrera_id as string;
  const acquisitionParam = Array.isArray(sParams.acq) ? sParams.acq[0] : sParams.acq;
  const acquisitionVariant =
    acquisitionParam === 'preguntero_google_v1' ||
    acquisitionParam === 'preguntero_landing_v1'
      ? acquisitionParam
      : undefined;

  return (
    <SimuladorExamen
      materiaId={materiaId}
      parcial={parcial}
      universidadId={universidadId || undefined}
      carreraId={carreraId || undefined}
      demoMode={demoMode}
      acquisitionVariant={acquisitionVariant}
    />
  );
}

export default async function SimuladorPage({ params, searchParams }: PageProps) {
  const { materia_id, parcial: parcialStr } = await params;

  if (!isUuid(materia_id)) {
    return notFound();
  }

  let exists: boolean;
  try {
    exists = await publicMateriaExists(materia_id);
  } catch (error) {
    logError('simulador.loadMateria', error, {
      materiaId: materia_id,
      parcial: parcialStr,
    });
    throw new Error('No pudimos consultar la materia del simulador.');
  }

  if (!exists) return notFound();

  const parcial = parseInt(parcialStr, 10) || 1;

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white px-6">
          <div className="border-y border-slate-200 py-8 text-sm font-semibold text-slate-600">
            Iniciando Preguntero...
          </div>
        </div>
      }
    >
      <SimuladorContent materiaId={materia_id} parcial={parcial} searchParams={searchParams} />
    </Suspense>
  );
}
