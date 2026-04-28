import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClientServer } from '@/lib/supabase-server';
import SimuladorExamen from '@/components/simulador/SimuladorExamen';

async function SimuladorErroresContent({
  params,
}: {
  params: Promise<{ materia_id: string }>;
}) {
  const { materia_id } = await params;
  const supabase = await createClientServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  if (!materia_id) {
    redirect('/dashboard');
  }

  return <SimuladorExamen materiaId={materia_id} parcial={1} mode="errores" />;
}

export default async function SimuladorErroresPage({
  params,
}: {
  params: Promise<{ materia_id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-indigo-50">
          <div className="animate-pulse text-indigo-600 font-bold text-xl">Cargando repaso de errores...</div>
        </div>
      }
    >
      <SimuladorErroresContent params={params} />
    </Suspense>
  );
}

