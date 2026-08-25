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
        <div className="p-8 text-center font-bold text-indigo-600">
          Cargando simulador de tus errores...
        </div>
      }
    >
      <UltimoIntentoSimuladorContent params={params} />
    </Suspense>
  );
}
