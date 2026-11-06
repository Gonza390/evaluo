import type { Metadata } from 'next';
import { EnglishCreemPaymentResult } from '@/components/pricing/EnglishCreemPaymentResult';

export const metadata: Metadata = {
  title: 'Payment status | Evaluo',
  robots: { index: false, follow: false },
};

export default async function EnglishPricingResult({
  searchParams,
}: {
  searchParams?: Promise<{ attemptId?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const id = String(params.attemptId ?? '').trim();
  const attemptId = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id) ? id : null;
  return <main lang="en" className="min-h-screen bg-[#F5F7FB] px-4 py-12 text-[#0F1B3D] sm:py-20">
    <EnglishCreemPaymentResult attemptId={attemptId} />
  </main>;
}
