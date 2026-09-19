import type { Metadata } from 'next';
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Sparkles,
  UploadCloud,
} from 'lucide-react';
import { FooterHome } from '@/components/footer-home';
import { MarketingAnalyticsSlot } from '@/components/MarketingAnalyticsSlot';
import { HomeHeroV2 } from '@/components/marketing/home-hero-v2';
import { HomeLiveStudyDemo } from '@/components/marketing/home-live-study-demo';
import { TrackedLink } from '@/components/marketing/tracked-link';
import { JsonLd } from '@/components/seo/JsonLd';
import { FaqAccordion, FAQ_ITEMS } from '@/components/marketing/faq-accordion';
import { buildFaqJsonLd, buildOrganizationJsonLd, buildWebsiteJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Subí tu PDF y prepará tu examen',
  description:
    'Convertí tus apuntes en resúmenes, mapas mentales, flashcards y práctica. Detectá qué temas necesitás reforzar antes del examen.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    siteName: 'Evaluo',
    locale: 'es_AR',
    title: 'Evaluo | Subí tu PDF y prepará tu examen',
    description:
      'Convertí tus apuntes en distintas formas de estudio y practicá sobre el mismo material antes del examen.',
    url: '/',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'Evaluo | Subí tu PDF y prepará tu examen',
      },
    ],
  },
};

const steps = [
  {
    icon: UploadCloud,
    title: 'Subí tu PDF',
    description:
      'Cargá el apunte o material que querés estudiar.',
  },
  {
    icon: CheckCircle2,
    title: 'Entendé y repasá',
    description:
      'Recorré el resumen, conectá conceptos y repasá el contenido con flashcards.',
  },
  {
    icon: FileText,
    title: 'Practicá y reforzá',
    description:
      'Respondé preguntas, revisá tus errores y volvé a los temas que todavía te cuestan.',
  },
];

const demoJourney = [
  ['01', 'Tu material', 'Partimos de un fragmento del PDF de Marketing I.'],
  ['02', 'Entendé el tema', 'El resumen organiza el concepto sin cambiar de fuente.'],
  ['03', 'Ponete a prueba', 'Respondé una pregunta basada en el mismo contenido.'],
  ['04', 'Repasá el error', 'Usá el feedback para saber qué tema conviene volver a trabajar.'],
] as const;

/** Signup → materiales with open-upload modal (post-#70 PDF-first activation). */
const primaryHref =
  '/login?mode=signup&next=%2Fdashboard%2Fmateriales%3FopenUpload%3D1';

export default function Home() {
  return (
    <div className="w-full overflow-x-clip bg-white text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      <a
        href="#producto"
        className="fixed top-3 left-3 z-[100] -translate-y-20 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white shadow-lg transition-transform focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
      >
        Saltar al contenido
      </a>
      <MarketingAnalyticsSlot />
      <JsonLd data={[buildOrganizationJsonLd(), buildWebsiteJsonLd(), buildFaqJsonLd(FAQ_ITEMS)]} />

      <HomeHeroV2 primaryHref={primaryHref} />

      <section id="como-funciona" className="border-b border-slate-100 bg-slate-50/70 py-12 sm:py-14">
        <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-8 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[0.68fr_1.32fr] lg:items-start lg:gap-14">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1 text-xs font-bold text-indigo-700 shadow-sm">
                <UploadCloud className="h-3.5 w-3.5" />
                Así de simple
              </span>
              <h2 className="text-foreground mt-4 text-3xl font-bold tracking-[-0.04em] sm:text-4xl">
                ¿Cómo funciona Evaluo?
              </h2>
              <p className="mt-3 max-w-[420px] text-sm leading-7 text-slate-600">
                Subí una vez tu material y usalo para entender, repasar y practicar.
              </p>
            </div>

            <div className="grid border-t border-slate-200 sm:grid-cols-3">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <article
                    key={step.title}
                    className={`py-5 sm:px-5 sm:py-6 ${index > 0 ? 'border-t border-slate-200 sm:border-t-0 sm:border-l' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-indigo-700 shadow-sm">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className="text-[10px] font-black text-indigo-700">0{index + 1}</span>
                    </div>
                    <h3 className="mt-4 text-sm font-bold tracking-tight text-slate-950">{step.title}</h3>
                    <p className="mt-2 text-xs leading-5 text-slate-600">{step.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section
        id="demo"
        className="relative overflow-hidden bg-[radial-gradient(circle_at_85%_15%,rgba(99,102,241,0.22),transparent_30%),linear-gradient(180deg,#0f172a_0%,#111827_100%)] py-20 sm:py-24 lg:py-28"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/60 to-transparent" />
        <div className="mx-auto grid w-full max-w-[1280px] gap-12 px-4 sm:px-8 lg:grid-cols-[0.6fr_1.4fr] lg:items-center lg:gap-16 lg:px-10">
          <div className="min-w-0">
            <div className="flex items-center gap-3 text-[11px] font-bold tracking-[0.16em] text-indigo-300 uppercase">
              <span className="h-px w-8 shrink-0 bg-indigo-400" />
              Demo interactiva
            </div>
            <h2 className="mt-5 max-w-[520px] text-3xl font-bold tracking-[-0.045em] text-white sm:text-4xl lg:text-[48px] lg:leading-[1.03]">
              Ahora probalo vos.
            </h2>
            <p className="mt-5 max-w-[500px] text-sm leading-7 text-slate-300 sm:text-base sm:leading-8">
              Interactuá con un apunte de Marketing I: leé un concepto, respondé y descubrí qué conviene repasar.
            </p>

            <div className="mt-8 border-t border-white/10">
              {demoJourney.map(([number, title, description]) => (
                <div
                  key={number}
                  className="grid grid-cols-[38px_minmax(0,1fr)] gap-4 border-b border-white/10 py-4 sm:py-4.5"
                >
                  <span className="pt-0.5 text-[10px] font-black text-indigo-300">{number}</span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold tracking-tight text-white">{title}</h3>
                    <p className="mt-1.5 text-xs leading-5 text-slate-400">{description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
              <TrackedLink
                href={primaryHref}
                eventName="cta_click"
                payload={{
                  location: 'home_real_material_demo',
                  cta_name: 'probar_con_mi_pdf_demo',
                  destination: primaryHref,
                }}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-xs font-bold text-slate-950 shadow-[0_10px_24px_rgba(0,0,0,0.18)] transition hover:-translate-y-0.5 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <UploadCloud className="h-4 w-4 shrink-0" />
                Probar con mi PDF
                <ArrowRight className="h-4 w-4 shrink-0" />
              </TrackedLink>

            </div>
          </div>

          <div className="relative min-w-0 lg:scale-[1.02]">
            <div className="pointer-events-none absolute -inset-8 rounded-[42px] bg-indigo-500/10 blur-3xl" />
            <div className="relative">
              <HomeLiveStudyDemo />
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="border-t border-slate-100 bg-white py-16 sm:py-24">
        <div className="mx-auto w-full max-w-[1240px] px-6 sm:px-8 lg:px-10">
          <div className="mx-auto mb-10 max-w-3xl text-center">
            <h2 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl lg:text-[40px]">
              Preguntas Frecuentes
            </h2>
            <p className="mt-3 text-sm text-slate-600 sm:text-base">
              Cómo funciona Evaluo cuando estudiás desde tus propios apuntes y PDFs.
            </p>
          </div>

          <FaqAccordion />
        </div>
      </section>

      <section className="bg-white py-16 sm:py-24">
        <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-8 lg:px-10">
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.08),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(37,99,235,0.08),transparent_40%),linear-gradient(180deg,#050B2C_0%,var(--heading)_100%)] p-8 text-center shadow-xl md:p-14">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

            <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold text-indigo-100 backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5 animate-pulse text-indigo-200" />
                Comenzá hoy mismo
              </span>

              <h2 className="mt-6 text-3xl leading-tight font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Empezá con el PDF que tenés que estudiar.
              </h2>
              <p className="mt-4 max-w-xl text-xs leading-6 text-white/90 sm:text-sm">
                Convertí tu material en una experiencia de repaso y práctica.
              </p>

              <div className="mt-8 flex w-full max-w-md justify-center">
                <TrackedLink
                  href={primaryHref}
                  eventName="cta_click"
                  payload={{
                    location: 'home_final_cta',
                    cta_name: 'probar_con_mi_pdf_final',
                    destination: primaryHref,
                  }}
                  className="from-brand to-brand-2 inline-flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r px-6 text-sm font-bold text-white shadow-lg shadow-indigo-950/40 transition hover:translate-y-[-1px] hover:shadow-indigo-950/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:w-auto"
                >
                  <UploadCloud className="h-4.5 w-4.5 shrink-0" />
                  Probar con mi PDF
                </TrackedLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      <FooterHome />
    </div>
  );
}
