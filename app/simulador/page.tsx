import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClientServer } from '@/lib/supabase-server';
import SimuladorExamen from '@/components/simulador/SimuladorExamen';

async function SimuladorContent({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const sParams = await searchParams;
  const supabase = await createClientServer();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  const materiaId = sParams.materiaId as string;
  const parcialParam = sParams.parcial as string;
  const parcial = parcialParam ? parseInt(parcialParam) : 1;
  const universidadId = sParams.universidad_id as string;
  const carreraId = sParams.carrera_id as string;

  if (!materiaId) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white p-8 rounded-2xl shadow-lg border border-red-100">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Faltan Parámetros</h1>
          <p className="text-gray-600">No se ha proporcionado un ID de materia válido para iniciar el simulador.</p>
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
    />
  );
}

export default async function SimuladorPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-indigo-50">
        <div className="animate-pulse text-indigo-600 font-bold text-xl">Iniciando simulador...</div>
      </div>
    }>
      <SimuladorContent searchParams={searchParams} />
    </Suspense>
  );
}
