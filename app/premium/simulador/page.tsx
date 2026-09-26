import { SimuladorPremiumFunnel } from '@/components/premium/simulador-premium-funnel';

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

function parseParcial(value: string | undefined) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 1;
  return Math.max(1, Math.min(99, Math.floor(parsed)));
}

function parseReturnTo(value: string | undefined) {
  const candidate = String(value ?? '').slice(0, 600);
  return candidate.startsWith('/') && !candidate.startsWith('//') ? candidate : undefined;
}

export default async function SimuladorPremiumPage({
  searchParams,
}: {
  searchParams?: Promise<{
    step?: string;
    mode?: string;
    materia?: string;
    parcial?: string;
    returnTo?: string;
  }>;
}) {
  const params = (await searchParams) ?? {};
  const materiaId = String(params.materia ?? '').slice(0, 80) || undefined;

  return (
    <SimuladorPremiumFunnel
      initialStep={parseStep(params.step)}
      initialBillingMode={parseBillingMode(params.mode)}
      materiaId={materiaId}
      parcial={parseParcial(params.parcial)}
      returnTo={parseReturnTo(params.returnTo)}
    />
  );
}
