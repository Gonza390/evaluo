import { ExplicacionesPremiumFunnel } from '@/components/premium/explicaciones-premium-funnel';

type FunnelStep = 1 | 2 | 3;
type BillingMode = 'monthly' | 'semester';

function parseStep(value: string | undefined): FunnelStep {
  if (value === '2') return 2;
  if (value === '3') return 3;
  return 1;
}

function parseBillingMode(value: string | undefined): BillingMode {
  return value === 'monthly' ? 'monthly' : 'semester';
}

export default async function ExplicacionesPremiumPage({
  searchParams,
}: {
  searchParams?: Promise<{
    step?: string;
    mode?: string;
    materia?: string;
  }>;
}) {
  const params = (await searchParams) ?? {};
  const materiaId = String(params.materia ?? '').slice(0, 80) || undefined;

  return (
    <ExplicacionesPremiumFunnel
      initialStep={parseStep(params.step)}
      initialBillingMode={parseBillingMode(params.mode)}
      materiaId={materiaId}
    />
  );
}
