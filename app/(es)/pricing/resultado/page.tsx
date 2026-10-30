import { PaymentResult } from '@/components/pricing/PaymentResult';

function parseReturnTo(value: string | undefined) {
  const candidate = String(value ?? '').slice(0, 600);
  return candidate.startsWith('/') && !candidate.startsWith('//') ? candidate : undefined;
}

function parseParcial(value: string | undefined) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  return Math.max(1, Math.min(99, Math.floor(parsed)));
}

export default async function PricingResultPage({
  searchParams,
}: {
  searchParams?: Promise<{
    attemptId?: string;
    source?: string;
    materia?: string;
    parcial?: string;
    returnTo?: string;
  }>;
}) {
  const params = (await searchParams) ?? {};
  const attemptId = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(params.attemptId ?? '')
  )
    ? String(params.attemptId)
    : undefined;
  const source = /^[a-zA-Z0-9_:-]+$/.test(String(params.source ?? ''))
    ? String(params.source).slice(0, 80)
    : 'pricing_direct';
  const materiaId = String(params.materia ?? '').slice(0, 80) || undefined;

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-white px-4 py-10 sm:px-6 sm:py-14">
      <PaymentResult
        attemptId={attemptId}
        source={source}
        materiaId={materiaId}
        parcial={parseParcial(params.parcial)}
        returnTo={parseReturnTo(params.returnTo)}
      />
    </main>
  );
}
