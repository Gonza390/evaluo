import type { Metadata } from 'next';
import Link from 'next/link';
import { hreflangAlternates } from '@/lib/seo/hreflang-clusters';
import { safePremiumReturnTo } from '@/lib/premium-flow';
import { MarketingPageViewTracker } from '@/components/marketing/page-view-tracker';
import { PublicSiteHeader } from '@/components/marketing/public-site-header';
import { FooterHome } from '@/components/footer-home';
import { PricingPlans } from '@/components/pricing/PricingPlans';

// Datos factuales para buscadores y asistentes (contrato GEO): Gratis incluye
// 1 material PDF o Word gratis de por vida; Premium, hasta 3 materiales PDF o Word por día.
const pricingDescription =
  'Planes Gratis y Premium de Evaluo: 1 material PDF o Word gratis de por vida, y con Premium hasta 3 materiales PDF o Word por día, práctica según tus errores y simulacros sin cupo.';

export const metadata: Metadata = {
  title: 'Planes y precios',
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

        <section className="mx-auto flex max-w-[760px] flex-col items-center gap-3.5 px-5 pt-8 pb-7 text-center sm:gap-[18px] sm:px-6 sm:pt-14 sm:pb-10">
          <h1 className="pv-rise text-[34px] leading-[1.08] font-extrabold tracking-[-1.2px] sm:text-[52px] sm:leading-[1.06] sm:tracking-[-2px]">
            Llegá a cada examen sabiendo que estás listo.
          </h1>
          <p className="pv-rise max-w-[540px] text-base leading-relaxed text-slate-600 sm:text-lg">
            Con Gratis sabés dónde estás parado. Con Premium practicás lo que te falta hasta llegar.
          </p>

          <div
            className="pv-rise-2 mt-1.5 flex w-full max-w-[420px] flex-col gap-2.5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-left sm:mt-2"
            aria-label="Ejemplo de nivel de preparación: 62% en Marketing I, Parcial 1"
          >
            <div className="flex justify-between text-[13px]">
              <span className="font-semibold">Marketing I · Parcial 1</span>
              <span className="text-slate-600">Ejemplo</span>
            </div>
            <div className="relative h-[30px]" aria-hidden="true">
              <div className="absolute inset-x-0 top-1 h-2 rounded-full bg-slate-200" />
              <div className="absolute top-1 left-0 h-2 w-[62%] rounded-full bg-[var(--pv-accent)]" />
              <span className="absolute top-[15px] left-[62%] -translate-x-1/2 text-xs font-bold text-[var(--pv-accent)]">
                62%
              </span>
              <div className="absolute top-0 left-[85%] h-4 w-0.5 bg-slate-950" />
              <span className="absolute top-[15px] left-[85%] -translate-x-1/2 text-xs font-bold">
                Listo
              </span>
            </div>
          </div>
        </section>

        <section id="elegir-plan" className="mx-auto max-w-[920px] px-5 sm:px-6">
          <PricingPlans
            source={source}
            materiaId={materiaId}
            parcial={parcial}
            returnTo={returnTo}
          />
        </section>

        <p className="mx-auto mt-14 mb-12 max-w-[680px] px-5 text-center text-[13px] text-slate-600 sm:mt-16">
          Al comprar aceptás los{' '}
          <Link
            href="/facturacion"
            className="font-semibold text-[var(--pv-accent)] hover:underline"
          >
            términos de facturación
          </Link>
          .
        </p>
      </main>
      <FooterHome />
    </>
  );
}
