import { Suspense } from 'react';
import { createClientServer } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import SimuladorExamen from '@/components/simulador/LazySimuladorExamen';

async function SimuladorContent({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sParams = await searchParams;
  const supabase = await createClientServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const demoMode = !user;
  let materiaId = sParams.materiaId as string;
  const parcialParam = sParams.parcial as string;
  const parcial = parcialParam ? parseInt(parcialParam, 10) : 1;
  const universidadId = sParams.universidad_id as string;
  const carreraId = sParams.carrera_id as string;

  if (!materiaId) {
    // Fallback: si llegan sin materia, elegimos una que ya tenga preguntas cargadas.
    const admin = createAdminClient();
    const { data: fallbackRows } = await admin
      .from('preguntas_banco')
      .select('materia_id')
      .not('materia_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1);
    materiaId = (fallbackRows?.[0]?.materia_id as string | undefined) ?? '';
  }

  if (!materiaId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white p-6 text-center">
        <div className="max-w-md border-y border-red-100 py-8">
          <h1 className="text-2xl font-bold tracking-[-0.04em] text-slate-950">No pudimos iniciar la práctica</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            No se proporcionó un ID de materia válido para iniciar el simulador.
          </p>
        </div>
      </div>
    );
  }

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

export default async function SimuladorPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white px-6">
          <div className="text-center">
            <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
            <p className="mt-4 text-sm font-semibold text-slate-700">Preparando tu práctica...</p>
          </div>
        </div>
      }
    >
      <SimuladorContent searchParams={searchParams} />
    </Suspense>
  );
}
