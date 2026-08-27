import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Bot,
  Brain,
  CheckCircle2,
  FileText,
  BarChart3,
  PlayCircle,
  Sparkles,
  Target,
  UploadCloud,
  Zap,
  ListFilter,
  Check,
  X,
} from 'lucide-react';
import { FooterHome } from '@/components/footer-home';
import { CatalogStats } from '@/components/marketing/catalog-stats';
import { MarketingAnalyticsSlot } from '@/components/MarketingAnalyticsSlot';
import { HomeHeroV2 } from '@/components/marketing/home-hero-v2';
import { TrackedLink } from '@/components/marketing/tracked-link';
import { LazyInteractiveDemo } from '@/components/marketing/lazy-interactive-demo';
import { JsonLd } from '@/components/seo/JsonLd';
import { FaqAccordion, FAQ_ITEMS } from '@/components/marketing/faq-accordion';
import { buildFaqJsonLd, buildOrganizationJsonLd, buildWebsiteJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Prepará mejor tu próximo parcial',
  description:
    'Encontrá materiales de tu materia o subí tus apuntes. Evaluo los transforma en resúmenes, glosarios, flashcards y ejercicios para estudiar y practicar.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Evaluo | Prepará mejor tu próximo parcial',
    description:
      'Materiales de tu materia, apuntes transformados en herramientas de estudio y práctica para llegar mejor preparado al parcial.',
    url: '/',
  },
};

const steps = [
  {
    icon: UploadCloud,
    title: 'Elegí tu carrera y materia',
    description:
      'Entrá al catálogo, encontrá tu carrera y tus materias y armá tu espacio de estudio.',
  },
  {
    icon: FileText,
    title: 'Estudiá con materiales claros',
    description:
      'Abrí recursos por materia o convertí tus propios PDFs en guías de estudio con resumen, glosario, tarjetas y ejercicios.',
  },
  {
    icon: Bot,
    title: 'Practicá con preguntas y simuladores',
    description:
      'Respondé preguntas, practicá con tiempo y usá las explicaciones para entender por qué una respuesta está bien o mal.',
  },
  {
    icon: CheckCircle2,
    title: 'Reforzá lo que te cuesta',
    description:
      'Revisá tus resultados y volvé sobre los temas donde necesitás más práctica antes del parcial.',
  },
];

const features = [
  {
    icon: FileText,
    title: 'Materiales y guías de estudio',
    description:
      'Estudiá recursos de tu materia o generá una guía estructurada a partir de tus propios apuntes en PDF.',
  },
  {
    icon: Bot,
    title: 'Pregunteros con feedback',
    description:
      'No es solo responder un multiple choice. Las explicaciones te ayudan a revisar el razonamiento detrás de cada respuesta.',
  },
  {
    icon: BarChart3,
    title: 'Simuladores con tiempo',
    description:
      'Practicá en sesiones cronometradas y medí cómo respondés bajo una dinámica parecida a la de rendir.',
  },
  {
    icon: Target,
    title: 'Contenido específico',
    description:
      'El catálogo se organiza por universidad, carrera y materia; tus guías generadas se construyen desde el PDF que subís.',
  },
  {
    icon: Brain,
    title: 'Progreso para decidir qué reforzar',
    description:
      'Usá tus resultados de práctica para identificar qué temas vienen mejor y cuáles necesitan otra vuelta.',
  },
  {
    icon: Zap,
    title: 'Todo unificado en un solo lugar',
    description:
      'Se acabó el caos de saltar entre grupos, enlaces de Drive, fotocopiadoras y PDFs difíciles de ordenar.',
  },
];

const comparison = {
  chaos: [
    'PDFs eternos, borrosos e imposibles de leer en el celular.',
    'Grupos de WhatsApp ruidosos con spam y apuntes viejos.',
    'Drives desactualizados con links rotos y archivos de años anteriores.',
    'Herramientas genéricas sin el contexto del material que estás estudiando.',
  ],
  evaluo: [
    'Material estructurado, limpio y optimizado para cualquier pantalla.',
    'Espacio enfocado únicamente al estudio, sin distracciones de chat.',
    'Catálogo organizado por universidad, carrera y materia.',
    'IA que trabaja sobre el material que subís para generar apoyo de estudio.',
  ],
};

export default function Home() {
  const primaryHref = '/login?mode=signup';
  return (
    <div className="animate-page-enter w-full overflow-x-clip bg-white text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      <MarketingAnalyticsSlot />
      <JsonLd data={[buildOrganizationJsonLd(), buildWebsiteJsonLd(), buildFaqJsonLd(FAQ_ITEMS)]} />

      <HomeHeroV2 primaryHref={primaryHref} />

      <section id="como-funciona" className="py-16 sm:py-24">
        <div className="mx-auto w-full max-w-[1240px] px-6 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3.5 py-1 text-xs font-bold text-indigo-700">
              <ListFilter className="h-3.5 w-3.5" />
              Paso a paso
            </span>
            <h2 className="text-foreground mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-[40px]">
              ¿Cómo funciona Evaluo?
            </h2>
            <p className="mt-3 text-sm text-slate-600 sm:text-base">
              Un flujo simple para encontrar tu materia, estudiar mejor y practicar antes del parcial.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <article
                  key={step.title}
                  className="group relative flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_8px_20px_rgba(0,0,0,0.02)] transition hover:border-indigo-300 hover:shadow-md"
                >
                  {index < 3 && (
                    <div className="absolute top-12 right-[-16px] z-10 hidden h-[2px] w-[32px] bg-white group-hover:bg-indigo-200 lg:block" />
                  )}

                  <div>
                    <div className="from-brand to-brand-2 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md">
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="mt-6 flex items-center gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-[12px] font-bold text-indigo-600">
                        {index + 1}
                      </span>
                      <h3 className="text-[15px] font-bold tracking-tight text-slate-800 transition-colors group-hover:text-indigo-600">
                        {step.title}
                      </h3>
                    </div>

                    <p className="mt-3 text-xs leading-5 text-slate-600">{step.description}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="features" className="border-y border-slate-100 bg-white py-16 sm:py-24">
        <div className="mx-auto w-full max-w-[1240px] px-6 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3.5 py-1 text-xs font-bold text-indigo-700">
              <Sparkles className="h-3.5 w-3.5" />
              ¿Por qué Evaluo?
            </span>
            <h2 className="text-foreground mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-[40px]">
              Qué encontrás en la plataforma
            </h2>
            <p className="mt-3 text-sm text-slate-600 sm:text-base">
              Herramientas de estudio integradas para pasar de tus materiales a la práctica sin
              cambiar de plataforma.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feat) => {
              const Icon = feat.icon;
              return (
                <article
                  key={feat.title}
                  className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-indigo-300 hover:shadow-md"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-[15px] font-bold tracking-tight text-slate-800">
                    {feat.title}
                  </h3>
                  <p className="mt-3 text-xs leading-5 text-slate-600">{feat.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="comparativa" className="py-16 sm:py-24">
        <div className="mx-auto w-full max-w-[1240px] px-6 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl lg:text-[40px]">
              Dejá de luchar contra el caos de estudio
            </h2>
            <p className="mt-3 text-sm text-slate-600 sm:text-base">
              Preparar un parcial ya requiere suficiente energía. Tu espacio de estudio no debería
              agregar más desorden.
            </p>
          </div>

          <div className="mt-12 grid items-stretch gap-8 lg:grid-cols-2">
            <div className="flex flex-col justify-between rounded-3xl border border-red-100 bg-red-50/20 p-6 shadow-sm md:p-8">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-red-100/70 px-3.5 py-1.5 text-xs font-bold text-red-700">
                  <X className="h-4 w-4 shrink-0" />
                  <span>El caos tradicional de archivos y chat</span>
                </div>
                <p className="mt-4 text-xs font-bold tracking-wider text-slate-500 uppercase">
                  Estudiar con todo separado
                </p>

                <ul className="mt-6 space-y-4">
                  {comparison.chaos.map((item, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 text-xs leading-5 text-slate-600"
                    >
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-red-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 rounded-2xl border border-red-100 bg-red-50 p-4 text-[12px] leading-5 text-red-800">
                <strong>El problema:</strong> perdés tiempo ordenando archivos y saltando entre
                herramientas cuando podrías estar leyendo, practicando y revisando errores.
              </div>
            </div>

            <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl border border-indigo-200 bg-[linear-gradient(135deg,rgba(99,102,241,0.03)_0%,rgba(37,99,235,0.03)_100%)] p-6 shadow-md md:p-8">
              <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-indigo-500/5 blur-3xl" />

              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3.5 py-1.5 text-xs font-bold text-indigo-700">
                  <Check className="h-4 w-4 shrink-0" />
                  <span>Todo conectado en Evaluo</span>
                </div>
                <p className="mt-4 text-xs font-bold tracking-wider text-indigo-700 uppercase">
                  Estudiar con contexto
                </p>

                <ul className="mt-6 space-y-4">
                  {comparison.evaluo.map((item, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 text-xs leading-5 font-medium text-slate-700"
                    >
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 rounded-2xl bg-indigo-600 p-5 text-[12px] leading-5 text-white shadow-lg">
                <strong>El beneficio Evaluo:</strong> todo reunido en un mismo flujo. Practicás con
                material de tu materia, medís resultados y llegás al parcial con más contexto y
                confianza.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="demo" className="bg-white py-16 sm:py-24">
        <div className="mx-auto w-full max-w-[1240px] px-6 sm:px-8 lg:px-10">
          <div className="mx-auto mb-10 max-w-3xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3.5 py-1 text-xs font-bold text-indigo-700">
              <PlayCircle className="h-3.5 w-3.5" />
              Probalo en vivo
            </span>
            <h2 className="text-foreground mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-[40px]">
              Viví la experiencia de estudio
            </h2>
            <p className="mt-3 text-sm text-slate-600 sm:text-base">
              Recorré una materia, abrí materiales y probá una pregunta del simulador. Sin registro
              obligatorio para explorar.
            </p>
          </div>

          <LazyInteractiveDemo />
        </div>
      </section>

      <section id="faq" className="border-t border-slate-100 bg-white py-16 sm:py-24">
        <div className="mx-auto w-full max-w-[1240px] px-6 sm:px-8 lg:px-10">
          <div className="mx-auto mb-10 max-w-3xl text-center">
            <h2 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl lg:text-[40px]">
              Preguntas Frecuentes
            </h2>
            <p className="mt-3 text-sm text-slate-600 sm:text-base">
              Todo lo que necesitás saber sobre la plataforma y cómo preparar tus parciales.
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
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold text-indigo-200 backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5 animate-pulse text-indigo-300" />
                Comenzá hoy mismo
              </span>

              <h2 className="mt-6 text-3xl leading-tight font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Dejá de estudiar a ciegas.
              </h2>
              <p className="mt-4 max-w-xl text-xs leading-6 text-white/80 sm:text-sm">
                Encontrá tu materia y prepará tus parciales con materiales organizados, práctica y
                una guía clara de qué reforzar.
              </p>

              <CatalogStats />

              <div className="mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
                <TrackedLink
                  href="/explorar"
                  eventName="cta_click"
                  payload={{
                    location: 'home_final_cta',
                    cta_name: 'explorar_catalogo_final',
                    destination: '/explorar',
                  }}
                  className="inline-flex h-13 items-center justify-center gap-2 rounded-2xl bg-white px-6 text-sm font-bold text-slate-900 shadow-md transition hover:translate-y-[-1px] hover:bg-white"
                >
                  <PlayCircle className="h-4.5 w-4.5 text-indigo-600" />
                  Explorar catálogo
                </TrackedLink>
                <TrackedLink
                  href={primaryHref}
                  eventName="cta_click"
                  payload={{
                    location: 'home_final_cta',
                    cta_name: 'crear_cuenta_final',
                    destination: primaryHref,
                  }}
                  className="from-brand to-brand-2 inline-flex h-13 items-center justify-center rounded-2xl bg-gradient-to-r px-6 text-sm font-bold text-white shadow-lg shadow-indigo-950/40 transition hover:translate-y-[-1px] hover:shadow-indigo-950/60"
                >
                  Crear cuenta gratis
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
