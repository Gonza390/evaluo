import type { Metadata } from 'next';
import { hreflangAlternates } from '@/lib/seo/hreflang-clusters';
import Link from 'next/link';
import { safePremiumReturnTo } from '@/lib/premium-flow';
import { Sparkles } from 'lucide-react';
import { RegionalPricingMessage } from '@/components/pricing/RegionalPricingMessage';
import { MarketingPageViewTracker } from '@/components/marketing/page-view-tracker';
import { PublicSiteHeader } from '@/components/marketing/public-site-header';
import { FooterHome } from '@/components/footer-home';
import { PricingPlanSelector } from '@/components/pricing/PricingPlanSelector';

const pricingDescription =
  'Conocé los planes Gratis y Premium de Evaluo para estudiar apuntes PDF o Word, practicar por tema, revisar errores y seguir tu progreso.';

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

const freeFeatures = [
  '1 material PDF o Word gratis de por vida',
  'Resúmenes y glosario del material',
  '12 preguntas de opción múltiple y 10 de verdadero/falso',
  '25 flashcards, 2 casos prácticos y 1 ronda de unir conceptos',
  '1 simulacro y 1 plan de estudio gratuito',
];

const premiumFeatures = [
  'Todo lo de Gratis: práctica, resultados y progreso por tema',
  'Subí hasta 3 materiales PDF o Word por día para preparar más materias',
  'Pedí más explicaciones con IA y preguntas para repasar tus errores',
  'Creá mapas mentales para relacionar conceptos de tus apuntes',
  'Accedé a modos Premium de simuladores con más explicaciones',
];

const comparison = [
  ['Carga de PDF o Word', '1 material de por vida', 'Hasta 3 nuevos por día'],
  ['Resúmenes y glosario', 'Incluidos', 'Incluidos'],
  ['Opción múltiple', '12 preguntas', 'Sin cupo Free'],
  ['Verdadero o falso', '10 preguntas', 'Sin cupo Free'],
  ['Unir conceptos', '1 ronda de 6 pares', 'Sin cupo Free'],
  ['Casos prácticos', '2', 'Sin cupo Free'],
  ['Flashcards', '25', 'Sin cupo Free'],
  ['Simulacros de examen', '1 de 20 preguntas', 'Sin cupo Free'],
  ['Planes de estudio', '1 editable', 'Sin cupo Free'],
  ['Resultados y explicaciones de errores', 'Incluidos', 'Incluidos'],
  ['Mapa mental desde PDF', 'No incluido', 'Incluido'],
  ['Calendario de exámenes', 'Incluido', 'Incluido'],
] as const;

export default async function PricingPage({
  searchParams,
}: {
  searchParams?: Promise<{ source?: string; materia?: string; parcial?: string; returnTo?: string; recovery?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const source = String(params.source ?? 'pricing_direct').slice(0, 80);
  const materiaId = String(params.materia ?? '').slice(0, 80) || undefined;
  const showRecovery = params.recovery === '1';
  const returnTo = safePremiumReturnTo(params.returnTo);
  const parsedParcial = Number(params.parcial);
  const parcial = Number.isInteger(parsedParcial) && parsedParcial > 0 && parsedParcial <= 99
    ? parsedParcial : undefined;

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
              Practicá con tus apuntes, descubrí qué temas dominás y qué necesitás reforzar.
              Con Premium, seguí avanzando con más materiales y más ayuda para estudiar.
            </p>
            <RegionalPricingMessage locale="es" placement="hero" />
          </div>
        </section>

        <RegionalPricingMessage locale="es" placement="featured" />

        <section id="elegir-plan" className="px-4 py-12 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-7xl">
            <div className="mb-7 text-center">
              <p className="text-xs font-bold tracking-[0.18em] text-blue-700 uppercase">
                Planes
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Elegí cómo querés seguir avanzando.
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                Tu progreso y tus resultados están incluidos tanto en Gratis como en Premium.
                Elegí Premium cuando necesites estudiar más materiales y reforzar con más ayuda.
              </p>
            </div>

            <PricingPlanSelector
              freeFeatures={freeFeatures}
              premiumFeatures={premiumFeatures}
              source={source}
              materiaId={materiaId}
              parcial={parcial}
              returnTo={returnTo}
            />

            <div className="mx-auto mt-16 max-w-3xl text-center">
              <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                Primero entendé tus avances. Después, reforzá lo que falta.
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
                Practicá, revisá tus errores y conocé tu progreso desde Gratis.
                Premium amplía la capacidad para seguir estudiando y las herramientas
                disponibles para reforzar.
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
              <RegionalPricingMessage locale="es" placement="billing" />
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
