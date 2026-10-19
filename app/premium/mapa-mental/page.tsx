import { MapaMentalPremiumFunnel } from '@/components/premium/mapa-mental-premium-funnel';

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

function parseReturnTo(value: string | undefined) {
  const candidate = String(value ?? '').slice(0, 600);
  return candidate.startsWith('/') && !candidate.startsWith('//') ? candidate : undefined;
}

export default async function MapaMentalPremiumPage({
  searchParams,
}: {
  searchParams?: Promise<{ step?: string; mode?: string; materia?: string; returnTo?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const materiaId = String(params.materia ?? '').slice(0, 80) || undefined;

  return (
    <MapaMentalPremiumFunnel
      initialStep={parseStep(params.step)}
      initialBillingMode={parseBillingMode(params.mode)}
      materiaId={materiaId}
      returnTo={parseReturnTo(params.returnTo)}
    />
  );
}
