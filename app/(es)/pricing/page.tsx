import type { Metadata } from 'next';
import Link from 'next/link';
import { hreflangAlternates } from '@/lib/seo/hreflang-clusters';
import { safePremiumReturnTo } from '@/lib/premium-flow';
import { MarketingPageViewTracker } from '@/components/marketing/page-view-tracker';
import { PublicSiteHeader } from '@/components/marketing/public-site-header';
import { FooterHome } from '@/components/footer-home';
import { PricingContent } from '@/components/pricing/PricingContent';

// Datos factuales para buscadores y asistentes (contrato GEO): Gratis incluye
// 1 material PDF o Word gratis por mes; Premium, hasta 3 materiales PDF o Word por día.
const pricingDescription =
  'Evaluo Gratis: 1 material PDF o Word por mes. Premium: hasta 3 materiales por día, práctica según tus errores y simulacros sin cupo.';

export const metadata: Metadata = {
  title: 'Planes y precios: Evaluo gratis y Premium',
  description: pricingDescription,
  alternates: hreflangAlternates('pricing', 'es'),
  openGraph: {
    type: 'website',
    url: '/pricing',
    siteName: 'Evaluo',
    locale: 'es_AR',
    title: 'Planes y precios | Evaluo',
    description: pricingDescription,
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'Planes y precios de Evaluo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Planes y precios | Evaluo',
    description: pricingDescription,
    images: ['/opengraph-image.png'],
  },
};

export default async function PricingPage({
  searchParams,
}: {
  searchParams?: Promise<{
    source?: string;
    materia?: string;
    parcial?: string;
    returnTo?: string;
    recovery?: string;
  }>;
}) {
  const params = (await searchParams) ?? {};
  const source = String(params.source ?? 'pricing_direct').slice(0, 80);
  const materiaId = String(params.materia ?? '').slice(0, 80) || undefined;
  const showRecovery = params.recovery === '1';
  const returnTo = safePremiumReturnTo(params.returnTo);
  const parsedParcial = Number(params.parcial);
  const parcial =
    Number.isInteger(parsedParcial) && parsedParcial > 0 && parsedParcial <= 99
      ? parsedParcial
      : undefined;

  return (
    <>
      <main className="pricing-v2 min-h-screen w-full min-w-0 overflow-x-clip bg-white pb-20 text-slate-950 sm:pb-0">
        <MarketingPageViewTracker
          eventName="pricing_view"
          payload={{ location: source, plan_context: 'premium', recovery: showRecovery }}
        />

        <div className="mx-auto w-full max-w-[1080px] px-5 sm:px-6">
          <PublicSiteHeader
            variant="landing"
            trackingLocation="pricing_header"
            actions={
              <Link
                href="/login?mode=login"
                className="pv-btn inline-flex min-h-11 items-center rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[var(--pv-accent)] focus-visible:outline-none"
              >
                Entrar
              </Link>
            }
          />
        </div>

        <PricingContent
          source={source}
          materiaId={materiaId}
          parcial={parcial}
          returnTo={returnTo}
        />
      </main>
      <FooterHome />
    </>
  );
}
