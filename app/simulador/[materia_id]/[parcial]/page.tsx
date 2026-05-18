import { Suspense } from 'react';
import { createClientServer } from '@/lib/supabase-server';
import SimuladorExamen from '@/components/simulador/SimuladorExamen';

async function SimuladorContent({
  params,
  searchParams,
}: {
  params: Promise<{ materia_id: string; parcial: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { materia_id, parcial: parcialStr } = await params;
  const sParams = await searchParams;

  const supabase = await createClientServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const demoMode = !user;
  const materiaId = materia_id;
  const parcial = parseInt(parcialStr, 10) || 1;
  const universidadId = sParams.universidad_id as string;
  const carreraId = sParams.carrera_id as string;

  if (!materiaId) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <div className="max-w-md rounded-2xl border border-red-100 bg-white p-8 shadow-lg">
          <h1 className="mb-2 text-2xl font-bold text-red-600">Faltan parámetros</h1>
          <p className="text-gray-600">
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
  params,
  searchParams,
}: {
  params: Promise<{ materia_id: string; parcial: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
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
      <SimuladorContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}
