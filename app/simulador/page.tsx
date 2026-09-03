import { Suspense } from 'react';
import Link from 'next/link';
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
        <div className="w-full max-w-lg rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.08)] sm:p-8">
          <p className="text-xs font-bold tracking-[0.16em] text-indigo-700 uppercase">
            Práctica no disponible
          </p>
          <h1 className="mt-3 text-2xl font-bold tracking-[-0.04em] text-slate-950">
            No pudimos iniciar la práctica
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            No encontramos una materia con preguntas disponible para iniciar automáticamente.
            Elegí una materia para ver sus prácticas o volvé a tu espacio de estudio.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/explorar"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              Explorar materias
            </Link>
            <Link
              href={user ? '/dashboard' : '/'}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              {user ? 'Ir a mis materias' : 'Volver al inicio'}
            </Link>
          </div>
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
