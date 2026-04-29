import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import SimuladorExamen from '@/components/simulador/SimuladorExamen';
import { requirePremiumUser } from '@/lib/premium';

type Params = Promise<{ materia_id: string; parcial: string }>;

async function PremiumSimuladorContent({ params }: { params: Params }) {
  const { materia_id, parcial } = await params;
  const premium = await requirePremiumUser();
  if (!premium.ok) {
    redirect('/pricing');
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
    <Suspense fallback={<div className="p-8 text-center text-indigo-600 font-bold">Iniciando simulador premium...</div>}>
      <PremiumSimuladorContent params={params} />
    </Suspense>
  );
}
