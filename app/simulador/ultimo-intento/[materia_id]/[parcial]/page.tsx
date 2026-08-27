import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { requirePremiumUser } from '@/lib/premium';
import SimuladorExamen from '@/components/simulador/LazySimuladorExamen';

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
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white px-6">
          <div className="text-center">
            <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
            <p className="mt-4 text-sm font-semibold text-slate-700">Preparando tu último intento...</p>
          </div>
        </div>
      }
    >
      <UltimoIntentoSimuladorContent params={params} />
    </Suspense>
  );
}
