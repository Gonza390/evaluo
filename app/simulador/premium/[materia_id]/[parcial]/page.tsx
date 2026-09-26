import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { requirePremiumUser } from '@/lib/premium';
import SimuladorExamen from '@/components/simulador/LazySimuladorExamen';

type Params = Promise<{ materia_id: string; parcial: string }>;

async function PremiumSimuladorContent({ params }: { params: Params }) {
  const { materia_id, parcial } = await params;
  const premium = await requirePremiumUser();
  if (!premium.ok) {
    const returnTo = `/simulador/premium/${materia_id}/${Number(parcial) || 1}`;
    const query = new URLSearchParams({
      materia: materia_id,
      parcial: String(Number(parcial) || 1),
      returnTo,
    });
    redirect(`/premium/simulador?${query.toString()}`);
  }

  return (
    <SimuladorExamen
      materiaId={materia_id}
      parcial={Number(parcial) || 1}
      mode="regular"
      premiumOnly
    />
  );
}

export default async function PremiumSimuladorPage({ params }: { params: Params }) {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center font-bold text-indigo-600">
          Iniciando simulador premium...
        </div>
      }
    >
      <PremiumSimuladorContent params={params} />
    </Suspense>
  );
}
