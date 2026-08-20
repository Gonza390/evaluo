import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { redirect } from 'next/navigation';
import { requirePremiumUser } from '@/lib/premium';

const SimuladorExamen = dynamic(() => import('@/components/simulador/SimuladorExamen'), {
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-indigo-50 p-6">
      <div className="w-full max-w-5xl rounded-[28px] border border-indigo-100 bg-white p-8 shadow-sm">
        <div className="h-8 w-64 animate-pulse rounded-full bg-indigo-100" />
        <div className="mt-6 h-4 w-full animate-pulse rounded-full bg-white" />
        <div className="mt-3 h-4 w-3/5 animate-pulse rounded-full bg-white" />
      </div>
    </div>
  ),
});

type Params = Promise<{ materia_id: string; parcial: string }>;

async function UltimoIntentoSimuladorContent({ params }: { params: Params }) {
  const { materia_id, parcial } = await params;
  const premium = await requirePremiumUser();
  if (!premium.ok) {
    redirect('/pricing');
  }

  return (
    <SimuladorExamen
      materiaId={materia_id}
      parcial={Number(parcial) || 1}
      mode="ultimo_intento"
      premiumOnly
    />
  );
}

export default async function UltimoIntentoSimuladorPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<div className="p-8 text-center font-bold text-indigo-600">Cargando simulador de tus errores...</div>}>
      <UltimoIntentoSimuladorContent params={params} />
    </Suspense>
  );
}
