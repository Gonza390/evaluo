import type { Metadata } from 'next';
import { ArrowRight, Check, ShieldCheck, Sparkles, X } from 'lucide-react';
import { MarketingPageViewTracker } from '@/components/marketing/page-view-tracker';
import { PublicSiteHeader } from '@/components/marketing/public-site-header';
import { PaymentCheckoutCard } from '@/components/pricing/PaymentCheckoutCard';
import { PremiumValuePreview } from '@/components/pricing/PremiumValuePreview';

const pricingDescription =
  'Elegí cómo prepararte para tus parciales con Evaluo Gratis o Evaluo Premium.';

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
  'Convertí tus apuntes en una guía de estudio priorizada',
  'Practicá un parcial basado en el material de tu curso',
  'Entendé cada error con explicaciones paso a paso',
  'Detectá qué temas reforzar antes del examen',
];

const freeFeatures = [
  'Resúmenes y materiales por materia',
  'Pregunteros para practicar',
  'Simuladores en formato básico',
  'Una revisión de errores con IA por semana',
];

const comparison = [
  ['Resúmenes y materiales', true, true],
  ['Pregunteros', true, true],
  ['Simuladores completos', false, true],
  ['Explicaciones con IA sin límite diario', false, true],
  ['Práctica personalizada de errores', false, true],
  ['Progreso avanzado por tema', false, true],
] as const;

export default async function PricingPage({
  searchParams,
}: {
  searchParams?: Promise<{ source?: string; materia?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const source = String(params.source ?? 'pricing_direct').slice(0, 80);
  const materiaId = String(params.materia ?? '').slice(0, 80) || undefined;

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <MarketingPageViewTracker
        eventName="pricing_view"
        payload={{ location: source, plan_context: 'premium_founders' }}
      />

      <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-8 lg:px-10">
        <PublicSiteHeader trackingLocation="pricing_header" />
      </div>

      <section className="relative overflow-hidden border-b border-slate-200">
        <div className="absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-indigo-100/70 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 pt-12 pb-14 text-center sm:px-6 sm:pt-16 sm:pb-20">
          <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-800">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Elegí el plan que necesitás hoy
          </span>
          <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-bold tracking-[-0.045em] text-slate-950 sm:text-6xl sm:leading-[1.04]">
            Convertí tus apuntes en un plan para aprobar el próximo parcial.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-xl sm:leading-8">
            Practicá con el material real de tu materia, detectá qué temas necesitás reforzar y
            entendé cada error antes del examen. El precio vigente y cualquier promoción disponible se confirman en el plan Premium.
          </p>
          <a
            href="#elegir-plan"
            className="mt-8 inline-flex h-12 items-center justify-center rounded-xl bg-indigo-600 px-6 text-sm font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            Ver los planes
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </a>
          <p className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-600">
            <ShieldCheck className="h-4 w-4 text-indigo-700" aria-hidden="true" />
            Cobro seguro con Mercado Pago · Cancelá cuando quieras
          </p>
        </div>
      </section>

      <section className="px-4 pt-12 sm:px-6 sm:pt-16">
        <PremiumValuePreview source={source} />
      </section>

      <section id="elegir-plan" className="scroll-mt-8 px-4 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="grid items-stretch gap-6 lg:grid-cols-2">
            <article className="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
              <p className="text-sm font-semibold text-slate-600">Gratis</p>
              <div className="mt-3 flex items-end gap-2">
                <span className="text-4xl font-bold tracking-tight text-slate-950">$0</span>
                <span className="pb-1 text-sm text-slate-600">para siempre</span>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                Todo lo necesario para empezar a estudiar con Evaluo.
              </p>
              <ul className="mt-7 flex-1 space-y-4">
                {freeFeatures.map((feature) => (
                  <li key={feature} className="flex gap-3 text-sm leading-6 text-slate-800">
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-indigo-700" aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>
              <a
                href="/explorar"
                className="mt-8 inline-flex h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-900 transition hover:border-indigo-300 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                Seguir con el plan gratis
              </a>
            </article>

            <PaymentCheckoutCard features={premiumFeatures} source={source} materiaId={materiaId} />
          </div>

          <div className="mt-16 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Compará sin vueltas
            </h2>
            <p className="mt-3 text-sm text-slate-600 sm:text-base">
              Sabé exactamente qué desbloqueás al pasar a Premium.
            </p>
          </div>

          <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white">
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
                  {premium ? (
                    <Check className="h-5 w-5 text-indigo-700" aria-label="Incluido" />
                  ) : null}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-sm text-slate-600">¿Todavía tenés dudas?</p>
            <p className="mt-2 font-semibold text-slate-950">
              Podés cancelar la renovación en cualquier momento desde Mercado Pago.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
