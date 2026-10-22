import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpenCheck,
  BrainCircuit,
  Check,
  CheckCircle2,
  Clock3,
  FileStack,
  FileText,
  GraduationCap,
  Layers3,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { MarketingPageViewTracker } from '@/components/marketing/page-view-tracker';
import { PublicSiteHeader } from '@/components/marketing/public-site-header';
import { FooterHome } from '@/components/footer-home';
import { PaymentCheckoutCard } from '@/components/pricing/PaymentCheckoutCard';
import { PricingPlanSelector } from '@/components/pricing/PricingPlanSelector';

const pricingDescription =
  'Prepará más materias con tus propios apuntes. Conocé los límites y beneficios de Evaluo Free y Premium, desde $12.990 por mes.';

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
  '2 PDFs propios cada 15 días',
  'Resúmenes, glosario y flashcards de tus PDFs',
  'Práctica por temas, resultados y progreso',
  'Repaso de errores con ayudas de IA limitadas',
  'Simuladores básicos y calendario de exámenes',
];

const premiumFeatures = [
  'Todo lo que incluye Gratis',
  'Hasta 3 PDFs nuevos por día',
  'Mapas mentales de tus PDFs',
  'Modalidades Premium de simuladores de materias',
  'Más explicaciones con IA en los simuladores',
  'Más ayudas y comprobaciones con IA para reforzar errores',
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
  const fromPdfLimit = /(?:pdf|material).*(?:limit|quota|cupo)|(?:limit|quota|cupo).*(?:pdf|material)/i.test(source);

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

        <section className="relative overflow-hidden border-b border-[#E7EBF4] bg-gradient-to-br from-[#F6F8FF] via-white to-[#EEF2FF]">
          <div className="pointer-events-none absolute -right-20 -top-48 h-96 w-96 rounded-full bg-[#4F5DFF]/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-[#2563EB]/10 blur-3xl" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-14 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)] lg:gap-14 lg:py-20">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/85 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[#3844D6] sm:text-xs">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Evaluo Free y Premium
              </span>
              {fromPdfLimit ? (
                <>
                  <h1 className="mt-6 text-[2.5rem] font-extrabold leading-[1.06] tracking-[-0.055em] text-[#0F1B3D] sm:text-5xl lg:text-[3.7rem]">
                    ¿Necesitás subir otro PDF? <span className="text-[#4F5DFF]">Seguí con Premium.</span>
                  </h1>
                  <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
                    Free incluye 2 PDFs cada 15 días. Con Premium podés cargar hasta 3 por día
                    y preparar más materiales ahora, sin esperar a que se renueve tu cupo.
                  </p>
                </>
              ) : (
                <>
                  <h1 className="mt-6 text-[2.5rem] font-extrabold leading-[1.06] tracking-[-0.055em] text-[#0F1B3D] sm:text-5xl lg:text-[3.7rem]">
                    Tus parciales no esperan. <span className="text-[#4F5DFF]">Tu estudio tampoco.</span>
                  </h1>
                  <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
                    Estudiá gratis con tus apuntes: entendé cada tema, practicá y reforzá
                    tus errores. Con Premium podés preparar más materiales y acceder
                    a herramientas adicionales cuando las necesitás.
                  </p>
                </>
              )}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#elegir-plan"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#4F5DFF] px-6 py-3 text-sm font-bold text-white shadow-[0_12px_24px_rgba(79,93,255,0.20)] transition hover:bg-[#3E4CF2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F5DFF]"
                >
                  Ver planes y precios <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
                <Link
                  href="/estudiar-pdf-con-ia"
                  className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-[#D8DEEC] bg-white px-6 py-3 text-sm font-bold text-[#0F1B3D] transition hover:border-[#4F5DFF] hover:text-[#4F5DFF]"
                >
                  Empezá gratis con tu PDF
                </Link>
              </div>
              <p className="mt-5 flex items-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="h-4 w-4 shrink-0 text-[#4F5DFF]" aria-hidden="true" />
                Gratis sin tarjeta · Premium con Mercado Pago
              </p>
            </div>
            <div className="relative mx-auto w-full max-w-md">
              <div className="absolute inset-4 translate-x-3 translate-y-4 rounded-[32px] bg-[#4F5DFF]/10 blur-xl" aria-hidden="true" />
              <div className="relative overflow-hidden rounded-[28px] border border-[#DCE4FA] bg-white p-5 shadow-[0_24px_80px_rgba(15,27,61,0.09)] sm:p-7">
                <div className="flex items-center justify-between gap-2 border-b border-[#EBEEF6] pb-5">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.13em] text-[#4F5DFF]">Tu espacio de estudio</p>
                    <h2 className="mt-1 text-xl font-extrabold tracking-tight text-[#0F1B3D]">Prepará más materias</h2>
                  </div>
                  <span className="rounded-xl bg-[#EEF2FF] p-3 text-[#4F5DFF]">
                    <GraduationCap className="h-6 w-6" aria-hidden="true" />
                  </span>
                </div>
                <div className="mt-5 space-y-3">
                  {[
                    ['Materia 1', 'Tu primer PDF'],
                    ['Materia 2', 'Tu segundo PDF'],
                    ['Materia 3', 'El próximo material que querés preparar'],
                  ].map(([title, subtitle], index) => (
                    <div key={title} className="flex items-center gap-3 rounded-2xl border border-[#E7EBF4] bg-[#F8FAFF] p-3">
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${index === 2 ? 'bg-[#4F5DFF] text-white' : 'bg-white text-[#4F5DFF]'}`}>
                        <FileText className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-[#0F1B3D]">{title}</p>
                        <p className="truncate text-xs text-slate-500">{subtitle}</p>
                      </div>
                      {index === 2 ? (
                        <Sparkles className="h-4 w-4 shrink-0 text-[#4F5DFF]" aria-label="Capacidad adicional Premium" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-label="Dentro de la cuota Free" />
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex items-start gap-2 rounded-2xl bg-[#EEF2FF] p-3 text-xs leading-5 text-[#303D79]">
                  <Layers3 className="mt-0.5 h-4 w-4 shrink-0 text-[#4F5DFF]" aria-hidden="true" />
                  <span>Free: 2 PDFs cada 15 días. Premium: hasta 3 PDFs por día.</span>
                </div>
                <p className="mt-3 text-center text-[10px] text-slate-400">Ejemplo ilustrativo de uso · No representa una cuenta real</p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[#E7EBF4] bg-white px-4 py-14 sm:px-6 sm:py-20" aria-labelledby="premium-benefits-title">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#4F5DFF]">Más capacidad para tus parciales</p>
              <h2 id="premium-benefits-title" className="mt-3 text-2xl font-extrabold tracking-tight text-[#0F1B3D] sm:text-3xl">
                ¿Qué cambia cuando elegís Premium?
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
                Lo esencial para aprender sigue siendo gratis. Premium amplía tu
                capacidad y suma herramientas para cuando necesitás más.
              </p>
            </div>
            <div className="mt-9 grid gap-4 md:grid-cols-3">
              <article className="rounded-3xl border border-[#E7EBF4] bg-[#F8FAFF] p-6">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EEF2FF] text-[#4F5DFF]"><FileStack className="h-6 w-6" aria-hidden="true" /></span>
                <h3 className="mt-5 text-lg font-bold tracking-tight text-[#0F1B3D]">Prepará más materiales</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Si cursás varias materias, no dependas del cupo gratuito de
                  2 PDFs cada 15 días: con Premium podés cargar hasta 3 por día.
                </p>
              </article>
              <article className="rounded-3xl border border-[#E7EBF4] bg-[#F8FAFF] p-6">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EEF2FF] text-[#4F5DFF]"><BookOpenCheck className="h-6 w-6" aria-hidden="true" /></span>
                <h3 className="mt-5 text-lg font-bold tracking-tight text-[#0F1B3D]">Conectá los temas de tus PDFs</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Sumá mapas mentales para visualizar conceptos y relaciones
                  junto al resumen, las tarjetas y la práctica que ya conocés.
                </p>
              </article>
              <article className="rounded-3xl border border-[#E7EBF4] bg-[#F8FAFF] p-6">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EEF2FF] text-[#4F5DFF]"><BrainCircuit className="h-6 w-6" aria-hidden="true" /></span>
                <h3 className="mt-5 text-lg font-bold tracking-tight text-[#0F1B3D]">Ampliá tus ayudas con IA</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Accedé a más ayudas y comprobaciones al reforzar errores,
                  además de las modalidades Premium de los simuladores de materias.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="bg-[#0F1B3D] px-4 py-12 text-white sm:px-6 sm:py-14" aria-labelledby="premium-scenario-title">
          <div className="mx-auto grid max-w-6xl items-center gap-7 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-indigo-300">Un ejemplo concreto</p>
              <h2 id="premium-scenario-title" className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
                ¿Tenés que estudiar tres materias?
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-300 sm:text-base">
                Con Free podés subir 2 PDFs cada 15 días. Si ya usaste ese cupo
                y necesitás preparar el material de otra materia, Premium te permite
                seguir cargando sin esperar la renovación gratuita.
              </p>
              <a href="#elegir-plan" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-white underline decoration-indigo-400 underline-offset-4 hover:text-indigo-200">
                Compará los planes <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/20 bg-white/10 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-300">Con Free</p>
                <p className="mt-3 text-3xl font-extrabold">2 PDFs</p>
                <p className="mt-1 text-sm text-slate-300">Cada 15 días</p>
                <div className="mt-5 flex items-center gap-2 text-xs text-slate-300"><Clock3 className="h-4 w-4" aria-hidden="true" /> Esperás a que se renueve el cupo</div>
              </div>
              <div className="rounded-2xl border border-indigo-300/60 bg-[#4F5DFF] p-5">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-indigo-100">Con Premium</p>
                <p className="mt-3 text-3xl font-extrabold">Hasta 3 PDFs</p>
                <p className="mt-1 text-sm text-indigo-100">Por día</p>
                <div className="mt-5 flex items-center gap-2 text-xs text-white"><Check className="h-4 w-4" aria-hidden="true" /> Preparás más materiales ahora</div>
              </div>
            </div>
          </div>
        </section>

        {showRecovery ? (
          <section className="border-b border-blue-100 bg-blue-50/40 px-4 py-12 sm:px-6">
            <div className="mx-auto max-w-xl">
              <div className="mb-6 text-center">
                <p className="text-xs font-bold tracking-[0.18em] text-blue-700 uppercase">
                  Retomá tu compra
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                  Premium mensual a $9.990
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Esta oferta está disponible si empezaste una compra y todavía no la completaste.
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
              <p className="text-xs font-bold tracking-[0.18em] text-blue-700 uppercase">
                Planes
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Dos formas de estudiar. Elegí cuánto necesitás.
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                Premium es siempre el mismo. Elegí si preferís pagarlo mes a mes o cubrir un
                semestre con 6 meses.
              </p>
            </div>

            <PricingPlanSelector
              freeFeatures={freeFeatures}
              premiumFeatures={premiumFeatures}
              source={source}
              materiaId={materiaId}
            />

            <div className="mx-auto mt-16 max-w-3xl text-center">
              <h2 className="text-2xl font-extrabold tracking-tight text-[#0F1B3D] sm:text-3xl">
                Compará lo que incluye cada plan
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
                En ambos podés estudiar tus PDFs, practicar por tema, conocer tus resultados
                y revisar tu progreso. Premium agrega capacidad y herramientas,
                no reemplaza el ciclo gratuito de aprendizaje.
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
