import { Suspense } from 'react';
import { createClientServer } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import SimuladorExamen from '@/components/simulador/SimuladorExamen';

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
  searchParams,
}: {
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
      <SimuladorContent searchParams={searchParams} />
    </Suspense>
  );
}
