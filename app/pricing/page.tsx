import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, Sparkles } from 'lucide-react';
import { MarketingPageViewTracker } from '@/components/marketing/page-view-tracker';
import { PublicSiteHeader } from '@/components/marketing/public-site-header';
import { FooterHome } from '@/components/footer-home';
import { PricingPlanSelector } from '@/components/pricing/PricingPlanSelector';

const pricingDescription =
  'Conocé tu progreso, descubrí qué temas reforzar y continuá preparando tus parciales con tus apuntes. Planes Gratis y Premium desde $9.990 al mes.';

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

const freeFeatures = [
  '2 PDFs cada 15 días',
  'Resúmenes y flashcards de tus apuntes',
  'Práctica para conocer tu progreso por tema',
  'Identificá qué errores necesitás reforzar',
  'Calendario de exámenes y simuladores básicos',
];

const premiumFeatures = [
  'Tu práctica, tus resultados y todo lo de Gratis',
  'Seguí tu progreso en más materiales: hasta 3 PDFs por día',
  'Mapas mentales de tus apuntes',
  'Más ayudas con IA para avanzar en tus temas difíciles',
  'Modos Premium y explicaciones adicionales en simuladores',
];

const comparison = [
  ['Carga de PDFs propios', '2 cada 15 días', 'Hasta 3 por día'],
  ['Resúmenes y glosario', 'Incluidos', 'Incluidos'],
  ['Flashcards', 'Incluidas', 'Incluidas'],
  ['Práctica y resultados de tus PDFs', 'Incluidos', 'Incluidos'],
  ['Progreso por tema y repaso de errores', 'Incluidos', 'Incluidos'],
  ['Ayudas y comprobaciones con IA para errores', 'Con cupos', 'Uso ampliado'],
  ['Mapa mental de tus PDFs', 'No incluido', 'Incluido'],
  ['Simuladores de materias', 'Básicos', 'Modos Premium'],
  ['Explicaciones con IA en simuladores', 'Hasta 3', 'Más explicaciones'],
  ['Calendario de exámenes', 'Incluido', 'Incluido'],
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
      <main className="min-h-screen w-full min-w-0 overflow-x-clip bg-white text-slate-950">
        <MarketingPageViewTracker
          eventName="pricing_view"
          payload={{ location: source, plan_context: 'premium', recovery: showRecovery }}
        />

        <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-8 lg:px-10">
          <PublicSiteHeader trackingLocation="pricing_header" />
        </div>

        <section className="relative overflow-hidden border-b border-slate-200">
          <div className="absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-blue-100/70 blur-3xl" />
          <div className="relative mx-auto max-w-5xl px-4 pt-10 pb-12 text-center sm:px-6 sm:pt-14 sm:pb-14">
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-800">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Evaluo Premium
            </span>
            <h1 className="mx-auto mt-6 max-w-4xl text-[2rem] leading-[1.05] font-bold tracking-[-0.04em] break-words min-[360px]:text-4xl sm:text-6xl sm:leading-[1.04]">
              No estudies a ciegas. Descubrí cuánto avanzaste y qué necesitás reforzar.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-xl sm:leading-8">
              Practicá con tus apuntes, conocé tu progreso por tema y descubrí dónde mejorar.
              Empezá gratis. Con Premium, continuá estudiando más materiales y ampliá tus ayudas con IA.
            </p>
            <p className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-600">
              <ShieldCheck className="h-4 w-4 text-blue-700" aria-hidden="true" />
              Pago seguro con Mercado Pago
            </p>
          </div>
        </section>

        <section id="elegir-plan" className="px-4 py-12 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-7xl">
            <div className="mb-7 text-center">
              <p className="text-xs font-bold tracking-[0.18em] text-blue-700 uppercase">
                Planes
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Gratis o Premium. Sin vueltas.
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                Elegí cómo continuar tu preparación: gratis, mes a mes o durante 6 meses.
                Tu progreso y tus resultados están disponibles en los tres planes.
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
                Tu progreso es lo importante. Las herramientas te ayudan a conseguirlo.
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
                En los tres planes podés practicar, revisar errores y conocer tu avance por tema.
                Premium te permite continuar ese recorrido con más materiales y ayudas,
                sin que el progreso deje de ser parte de Gratis.
              </p>
            </div>

            <div className="mx-auto mt-8 max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white">
              <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_88px_96px] border-b border-slate-200 bg-slate-50 px-3 py-4 text-xs font-bold text-slate-900 min-[360px]:grid-cols-[minmax(0,1fr)_108px_112px] min-[360px]:px-4 sm:grid-cols-[minmax(0,1fr)_180px_180px] sm:px-6 sm:text-sm">
                <span>Qué incluye</span>
                <span className="text-center">Gratis</span>
                <span className="text-center text-blue-700">Premium</span>
              </div>
              {comparison.map(([feature, free, premium]) => (
                <div
                  key={feature}
                  className="grid min-w-0 grid-cols-[minmax(0,1fr)_88px_96px] items-center border-b border-slate-200 px-3 py-4 last:border-0 min-[360px]:grid-cols-[minmax(0,1fr)_108px_112px] min-[360px]:px-4 sm:grid-cols-[minmax(0,1fr)_180px_180px] sm:px-6"
                >
                  <span className="min-w-0 pr-2 text-xs leading-5 break-words text-slate-800 min-[360px]:pr-3 min-[360px]:text-sm">
                    {feature}
                  </span>
                  <span className="px-1 text-center text-[11px] leading-4 font-medium break-words text-slate-600 sm:text-xs">
                    {free}
                  </span>
                  <span className="px-1 text-center text-[11px] leading-4 font-semibold break-words text-blue-800 sm:text-xs">
                    {premium}
                  </span>
                </div>
              ))}
            </div>
            <p className="mx-auto mt-4 max-w-3xl text-center text-xs leading-5 text-slate-500">
              Los cupos de PDFs se aplican a nuevas cargas. Las ayudas con IA y los simuladores
              están sujetos a sus condiciones de uso. Tus materiales y resultados ya guardados
              no desaparecen por seguir en Gratis.
            </p>

            <div className="mt-12 text-center text-sm text-slate-600">
              <p>Los pagos se procesan de forma segura con Mercado Pago.</p>
              <p className="mt-2">
                Al comprar aceptás los{' '}
                <Link href="/facturacion" className="font-semibold text-blue-700 hover:underline">
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
