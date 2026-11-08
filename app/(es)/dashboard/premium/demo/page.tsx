import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { UpgradeScreen } from '@/components/pricing/UpgradeScreen';

export const metadata: Metadata = {
  title: 'Demo · Mejorar mi plan',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';

// Solo visual: dev y previews, nunca en producción. ?lang=en para inglés,
// ?examen=0 para ver la pantalla sin la línea del examen.
export default async function UpgradeScreenDemo({
  searchParams,
}: {
  searchParams?: Promise<{ lang?: string; examen?: string }>;
}) {
  if (process.env.VERCEL_ENV === 'production' ||
      (!process.env.VERCEL_ENV && process.env.NODE_ENV !== 'development')) notFound();
  const params = (await searchParams) ?? {};
  const locale = params.lang === 'en' ? 'en' : 'es';
  return (
    <main className="w-full min-w-0 bg-white">
      <UpgradeScreen locale={locale} source="demo" returnTo="/dashboard"
        nextExam={params.examen === '0' ? null : { subject: 'Marketing II', daysLeft: 11 }} />
    </main>
  );
}
