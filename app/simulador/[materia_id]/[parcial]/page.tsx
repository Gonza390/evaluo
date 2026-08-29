import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createPublicClient } from '@/lib/supabase-public';
import { isUuid } from '@/lib/uuid';
import { createClientServer } from '@/lib/supabase-server';
import { logError } from '@/lib/observability';

import SimuladorExamen from '@/components/simulador/LazySimuladorExamen';

type PageProps = {
  params: Promise<{ materia_id: string; parcial: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { materia_id } = await params;

  if (!isUuid(materia_id)) {
    return {
      title: 'Simulador',
      robots: { index: false, follow: false },
    };
  }

  const client = createPublicClient();

  try {
    const { data: materia } = await client
      .from('materias')
      .select('nombre, carrera_id')
      .eq('id', materia_id)
      .maybeSingle();

    if (!materia) {
      return {
        title: 'Simulador',
        robots: { index: false, follow: false },
      };
    }

    let carreraNombre: string | null = null;
    if (materia.carrera_id) {
      const { data: carrera } = await client
        .from('carreras')
        .select('nombre')
        .eq('id', materia.carrera_id)
        .maybeSingle();
      carreraNombre = carrera?.nombre?.trim() ?? null;
    }

    const materiaNombre = materia.nombre?.trim() || 'Simulador';

    return {
      title: `Simulador de ${materiaNombre}`,
      description: carreraNombre
        ? `Practicá con simuladores de parcial de ${materiaNombre} (${carreraNombre}) en Evaluo.`
        : `Practicá con simuladores de parcial de ${materiaNombre} en Evaluo.`,
      robots: { index: false, follow: true },
    };
  } catch {
    return {
      title: 'Simulador',
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

  return (
    <SimuladorExamen
      materiaId={materiaId}
      parcial={parcial}
      universidadId={universidadId || undefined}
      carreraId={carreraId || undefined}
      demoMode={demoMode}
    />
  );
}

export default async function SimuladorPage({ params, searchParams }: PageProps) {
  const { materia_id, parcial: parcialStr } = await params;

  if (!isUuid(materia_id)) {
    return notFound();
  }

  const client = createPublicClient();
  const { data: materia, error } = await client
    .from('materias')
    .select('id')
    .eq('id', materia_id)
    .abortSignal(AbortSignal.timeout(8000))
    .maybeSingle();

  if (error) {
    logError('simulador.loadMateria', error, {
      materiaId: materia_id,
      parcial: parcialStr,
    });
    throw new Error('No pudimos consultar la materia del simulador.');
  }

  if (!materia) {
    return notFound();
  }

  const parcial = parseInt(parcialStr, 10) || 1;

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white px-6">
          <div className="border-y border-slate-200 py-8 text-sm font-semibold text-slate-600">
            Iniciando simulador...
          </div>
        </div>
      }
    >
      <SimuladorContent materiaId={materia_id} parcial={parcial} searchParams={searchParams} />
    </Suspense>
  );
}
