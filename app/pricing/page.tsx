import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, ShieldCheck, Sparkles, X } from 'lucide-react';
import { MarketingPageViewTracker } from '@/components/marketing/page-view-tracker';
import { PublicSiteHeader } from '@/components/marketing/public-site-header';
import { FooterHome } from '@/components/footer-home';
import { PaymentCheckoutCard } from '@/components/pricing/PaymentCheckoutCard';
import { PricingPlanSelector } from '@/components/pricing/PricingPlanSelector';

const pricingDescription =
  'Empezá gratis o elegí Evaluo Premium mensual o por 6 meses para preparar tus parciales.';

export const metadata: Metadata = {
  title: 'Planes y precios',
  description: pricingDescription,
  alternates: { canonical: '/pricing' },
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

const premiumFeatures = [
  'Todo lo de Gratis',
  'Simuladores completos para practicar parciales',
  'Explicaciones de respuestas sin límite diario',
  'Práctica personalizada según tus errores',
  'Seguimiento de progreso por tema',
  'Convertí tus propios apuntes en material para estudiar',
];

const freeFeatures = [
  'Resúmenes y materiales compartidos por materia',
  'Pregunteros para practicar',
  'Simuladores en formato básico',
  'Una revisión de errores por semana',
];

const comparison = [
  ['Resúmenes y materiales', true, true],
  ['Pregunteros', true, true],
  ['Simuladores completos', false, true],
  ['Explicaciones de respuestas sin límite diario', false, true],
  ['Práctica personalizada de errores', false, true],
  ['Progreso avanzado por tema', false, true],
] as const;

export default async function PricingPage({
  searchParams,
}: {
  searchParams?: Promise<{ source?: string; materia?: string; recovery?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const source = String(params.source ?? 'pricing_direct').slice(0, 80);
  const materiaId = String(params.materia ?? '').slice(0, 80) || undefined;
  const showRecovery = params.recovery === '1';

  return (
    <>
      <main className="min-h-screen bg-white text-slate-950">
        <MarketingPageViewTracker
          eventName="pricing_view"
          payload={{ location: source, plan_context: 'premium', recovery: showRecovery }}
        />

        <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-8 lg:px-10">
          <PublicSiteHeader trackingLocation="pricing_header" />
        </div>

        <section className="relative overflow-hidden border-b border-slate-200">
          <div className="absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-indigo-100/70 blur-3xl" />
          <div className="relative mx-auto max-w-5xl px-4 pb-12 pt-10 text-center sm:px-6 sm:pb-14 sm:pt-14">
            <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-800">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Evaluo Premium
            </span>
            <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-bold tracking-[-0.045em] text-slate-950 sm:text-6xl sm:leading-[1.04]">
              Estudiá mejor. Elegí el plan que te acompañe.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-xl sm:leading-8">
              Empezá gratis. Cuando quieras más práctica, explicaciones y seguimiento, pasate a Premium.
            </p>
            <p className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-600">
              <ShieldCheck className="h-4 w-4 text-indigo-700" aria-hidden="true" />
              Pago seguro con Mercado Pago
            </p>
          </div>
        </section>

        {showRecovery ? (
          <section className="border-b border-indigo-100 bg-indigo-50/40 px-4 py-12 sm:px-6">
            <div className="mx-auto max-w-xl">
              <div className="mb-6 text-center">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-700">
                  Oferta para retomar tu checkout
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                  Premium mensual a $9.990
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Esta opción no aparece en el pricing público y sólo se valida para cuentas con un
                  checkout anterior sin completar.
                </p>
              </div>
              <PaymentCheckoutCard
                features={premiumFeatures}
                source={source === 'pricing_direct' ? 'checkout_recovery' : source}
                materiaId={materiaId}
                offerCode="recovery"
                featured
              />
            </div>
          </section>
        ) : null}

        <section id="elegir-plan" className="px-4 py-12 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-7xl">
            <div className="mb-7 text-center">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-700">Planes</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Gratis o Premium. Sin vueltas.
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                Premium es siempre el mismo. Elegí si preferís pagarlo mes a mes o resolver todo el cuatrimestre con 6 meses.
              </p>
            </div>

            <PricingPlanSelector
              freeFeatures={freeFeatures}
              premiumFeatures={premiumFeatures}
              source={source}
              materiaId={materiaId}
            />

            <div className="mx-auto mt-16 max-w-3xl text-center">
              <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                Premium te ayuda a saber qué estudiar después.
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
                No se trata sólo de tener más herramientas: practicá, entendé tus errores y enfocá tu tiempo en los temas que más necesitás reforzar antes del parcial.
              </p>
            </div>

            <div className="mx-auto mt-8 max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white">
              <div className="grid grid-cols-[1fr_68px_82px] border-b border-slate-200 bg-slate-50 px-4 py-4 text-xs font-bold text-slate-900 sm:grid-cols-[1fr_140px_140px] sm:px-6 sm:text-sm">
                <span>Función</span>
                <span className="text-center">Gratis</span>
                <span className="text-center text-indigo-700">Premium</span>
              </div>
              {comparison.map(([feature, free, premium]) => (
                <div
                  key={feature}
                  className="grid grid-cols-[1fr_68px_82px] items-center border-b border-slate-200 px-4 py-4 text-sm last:border-0 sm:grid-cols-[1fr_140px_140px] sm:px-6"
                >
                  <span className="pr-3 leading-5 text-slate-800">{feature}</span>
                  <span className="flex justify-center">
                    {free ? (
                      <Check className="h-5 w-5 text-emerald-700" aria-label="Incluido" />
                    ) : (
                      <X className="h-5 w-5 text-slate-500" aria-label="No incluido" />
                    )}
                  </span>
                  <span className="flex justify-center">
                    {premium ? <Check className="h-5 w-5 text-indigo-700" aria-label="Incluido" /> : null}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center text-sm text-slate-600">
              <p>Los pagos se procesan de forma segura con Mercado Pago.</p>
              <p className="mt-2">
                Al comprar aceptás los{' '}
                <Link href="/facturacion" className="font-semibold text-indigo-700 hover:underline">
                  términos de facturación
                </Link>
                .
              </p>
            </div>
          </div>
        </section>
      </main>
      <FooterHome />
    </>
  );
}
