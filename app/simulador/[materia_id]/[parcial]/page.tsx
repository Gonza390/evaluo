import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createPublicClient } from '@/lib/supabase-public';
import { isUuid } from '@/lib/uuid';
import { createClientServer } from '@/lib/supabase-server';

const SimuladorExamen = dynamic(() => import('@/components/simulador/SimuladorExamen'), {
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-indigo-50 p-6">
      <div className="w-full max-w-5xl rounded-[28px] border border-indigo-100 bg-white p-8 shadow-sm">
        <div className="h-8 w-48 animate-pulse rounded-full bg-indigo-100" />
        <div className="mt-6 h-4 w-full animate-pulse rounded-full bg-slate-100" />
        <div className="mt-3 h-4 w-4/5 animate-pulse rounded-full bg-slate-100" />
        <div className="mt-8 grid gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      </div>
    </div>
  ),
});

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
    .maybeSingle();

  if (error || !materia) {
    return notFound();
  }

  const parcial = parseInt(parcialStr, 10) || 1;

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-indigo-50">
          <div className="animate-pulse text-xl font-bold text-indigo-600">
            Iniciando simulador...
          </div>
        </div>
      }
    >
      <SimuladorContent
        materiaId={materia_id}
        parcial={parcial}
        searchParams={searchParams}
      />
    </Suspense>
  );
}
