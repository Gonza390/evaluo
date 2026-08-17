import type { Metadata } from 'next';
import Link from 'next/link';
import { unstable_cache } from 'next/cache';
import { createPublicClient } from '@/lib/supabase-public';
import { fetchUniversidades } from '@/lib/data/catalog';
import {
  Bot,
  Brain,
  CheckCircle2,
  FileText,
  GraduationCap,
  BarChart3,
  PlayCircle,
  Sparkles,
  Target,
  UploadCloud,
  Zap,
  ShieldCheck,
  ListFilter,
  Check,
  X,
} from 'lucide-react';
import { FooterHome } from '@/components/footer-home';
import { CatalogStats } from '@/components/marketing/catalog-stats';
import { MarketingAnalyticsSlot } from '@/components/MarketingAnalyticsSlot';
import { TrackedLink } from '@/components/marketing/tracked-link';
import { LazyInteractiveDemo } from '@/components/marketing/lazy-interactive-demo';
import { JsonLd } from '@/components/seo/JsonLd';
import { FaqAccordion, FAQ_ITEMS } from '@/components/marketing/faq-accordion';
import { buildFaqJsonLd, buildOrganizationJsonLd, buildWebsiteJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Todo lo que necesitás para aprobar tus parciales, en un solo lugar',
  description:
    'Encontrá tu universidad, estudiá con resúmenes claros y practicá con pregunteros y simuladores de examen de tus materias. Sin PDFs caóticos ni ChatGPT genérico.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Evaluo | Plataforma para estudiar parciales universitarios',
    description:
      'Resúmenes, pregunteros y simuladores adaptados a tu plan de estudio en Argentina.',
    url: '/',
  },
};

const trustSignals = [
  'Contenido ordenado por universidad, carrera y materia.',
  'Resumenes, pregunteros y simuladores dentro del mismo flujo.',
  'Experiencia pensada para estudiar mejor desde celular y desktop.',
  'Acceso rápido a lo importante sin perseguir PDFs ni links rotos.',
];

const argentinianUnis = [
  { name: 'UBA', longName: 'Universidad de Buenos Aires' },
  { name: 'UTN', longName: 'Universidad Tecnológica Nacional' },
  { name: 'UNC', longName: 'Universidad Nacional de Córdoba' },
  { name: 'UNLP', longName: 'Universidad Nacional de La Plata' },
  { name: 'UADE', longName: 'Universidad de la Empresa' },
  { name: 'UCA', longName: 'Univ. Católica Argentina' },
  { name: 'UdeSA', longName: 'Universidad de San Andrés' },
  { name: 'UTDT', longName: 'Univ. Torcuato Di Tella' },
];

const steps = [
  {
    icon: UploadCloud,
    title: 'Elegí tu universidad y carrera',
    description:
      'Buscás tu facultad. Accedés al catálogo de materias adaptado exactamente a tu plan de estudio y cátedra.',
  },
  {
    icon: FileText,
    title: 'Estudiá con resúmenes claros',
    description:
      'Chau resúmenes eternos. Accedés a explicaciones bajadas a tierra, limpias y estructuradas por unidades de clase.',
  },
  {
    icon: Bot,
    title: 'Practicás con pregunteros',
    description:
      'Respondés cientos de preguntas específicas. Si te equivocás, la IA te explica el paso a paso en el acto.',
  },
  {
    icon: CheckCircle2,
    title: 'Rendís simulacros de examen',
    description:
      'Hacés modelos de parcial cronometrados con el formato y la dificultad de un examen, para medir tu confianza antes del examen.',
  },
];

const features = [
  {
    icon: FileText,
    title: 'Resúmenes claros y completos',
    description:
      'Elaborados por estudiantes destacados y revisados académicamente. Van directo al grano, con esquemas, fórmulas y ejemplos prácticos.',
  },
  {
    icon: Bot,
    title: 'Pregunteros inteligentes con feedback',
    description:
      'No es solo responder un multiple choice. Cada error se transforma en una lección gracias a las explicaciones instantáneas del asistente de IA.',
  },
  {
    icon: BarChart3,
    title: 'Simuladores con formato de examen',
    description:
      'Cronómetros, ponderación y estructura similares a los de un parcial universitario. Entrená con la presión del tiempo antes de rendir.',
  },
  {
    icon: Target,
    title: 'Contenido específico',
    description:
      'Focalizá tu estudio en los temas relevantes. En Evaluo el contenido se organiza según el programa de tu propia universidad.',
  },
  {
    icon: Brain,
    title: 'Radar de progreso y confianza',
    description:
      'Nuestra analítica te indica qué temas tenés dominados al 100% y en cuáles necesitás reforzar antes de que llegue la fecha del examen.',
  },
  {
    icon: Zap,
    title: 'Todo unificado en un solo lugar',
    description:
      'Se acabó el caos de saltar entre 5 grupos de WhatsApp, enlaces de Drive caídos, fotocopiadoras y PDFs escaneados borrosos.',
  },
];

const comparison = {
  chaos: [
    'PDFs eternos, borrosos e imposibles de leer en el celular.',
    'Grupos de WhatsApp ruidosos con spam y apuntes viejos.',
    'Drives desactualizados con links rotos y archivos de 2018.',
    'ChatGPT genérico que desconoce tu programa y confunde conceptos locales.',
  ],
  evaluo: [
    'Material estructurado, limpio y optimizado para cualquier pantalla.',
    'Espacio enfocado únicamente al estudio, sin distracciones de chat.',
    'Catálogo actualizado con los temas que se evalúan en tu materia.',
    'IA académica experta que te acompaña con explicaciones paso a paso.',
  ],
};

const loadHomeUniversidades = unstable_cache(
  async () => {
    const client = createPublicClient();
    const universidades = await fetchUniversidades(client);
    const byName: Record<string, string> = {};
    for (const uni of universidades) {
      byName[uni.nombre.toLowerCase()] = uni.id;
    }
    return byName;
  },
  ['home-universidades'],
  { revalidate: 600, tags: ['universidad-data'] }
);

async function HomeUniversidadLinks() {
  const idByName = await loadHomeUniversidades();

  return (
    <div className="mt-6 flex flex-wrap justify-center gap-3">
      {argentinianUnis.map((uni) => {
        const uniId = idByName[uni.name.toLowerCase()];
        const content = (
          <>
            <span>{uni.name}</span>
            <span className="ml-1 hidden font-normal text-slate-400 sm:inline">{uni.longName}</span>
          </>
        );
        const className =
          'inline-flex items-center rounded-xl border border-slate-200/80 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:border-indigo-400 hover:text-indigo-600 hover:scale-[1.03]';

        return uniId ? (
          <Link
            key={uni.name}
            href={`/universidad/${uniId}`}
            title={uni.longName}
            className={className}
          >
            {content}
          </Link>
        ) : (
          <div key={uni.name} title={uni.longName} className={`${className} cursor-default`}>
            {content}
          </div>
        );
      })}
    </div>
  );
}

export default function Home() {
  const primaryHref = '/login?mode=signup';
  return (
    <div className="animate-page-enter w-full overflow-x-clip bg-white text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      <MarketingAnalyticsSlot />
      <JsonLd data={[buildOrganizationJsonLd(), buildWebsiteJsonLd(), buildFaqJsonLd(FAQ_ITEMS)]} />

      {/* --- HEADER & HERO SECTION --- */}
      <section className="relative overflow-hidden border-b border-slate-100 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.14),transparent_35%),radial-gradient(circle_at_top_left,rgba(37,99,235,0.08),transparent_25%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
        {/* Adornos flotantes de fondo */}
        <div className="absolute top-44 left-1/4 h-64 w-64 rounded-full bg-blue-100/30 blur-3xl" />
        <div className="absolute top-20 right-10 h-72 w-72 rounded-full bg-indigo-100/20 blur-3xl" />

        <div className="mx-auto w-full max-w-[1240px] px-4 pt-3 pb-12 sm:px-8 lg:px-10 lg:pb-24">
          {/* Header / Navbar */}
          <header className="animate-surface-reveal flex h-13 items-center justify-between gap-2 rounded-2xl border-b border-slate-200/50 bg-white/70 px-3 shadow-sm backdrop-blur-md sm:h-16 sm:gap-4 sm:px-6">
            <Link
              href="/"
              className="text-foreground flex items-center gap-2 text-2xl font-bold tracking-[-0.04em]"
            >
              <div className="from-brand to-brand-2 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md">
                <GraduationCap className="h-5 w-5" />
              </div>
              <span>Evaluo</span>
            </Link>

            <nav className="hidden items-center gap-7 text-xs font-semibold text-slate-500 md:flex">
              <a href="#como-funciona" className="transition hover:text-indigo-600">
                Cómo funciona
              </a>
              <a href="#features" className="transition hover:text-indigo-600">
                Qué encontrás
              </a>
              <a href="#comparativa" className="transition hover:text-indigo-600">
                Comparación
              </a>
              <a href="#demo" className="transition hover:text-indigo-600">
                Demo interactiva
              </a>
              <a href="#faq" className="transition hover:text-indigo-600">
                Preguntas
              </a>
            </nav>

            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/login"
                className="hidden min-h-[44px] items-center px-3 text-xs font-bold text-slate-700 transition hover:text-indigo-600 sm:inline-flex"
              >
                Ingresar
              </Link>
              <TrackedLink
                href={primaryHref}
                eventName="cta_click"
                payload={{
                  location: 'home_header',
                  cta_name: 'crear_cuenta',
                  destination: primaryHref,
                }}
                className="from-brand to-brand-2 hidden h-9 items-center justify-center rounded-xl bg-gradient-to-r px-2.5 text-[12px] font-bold text-white shadow-[0_8px_20px_rgba(37,99,235,0.18)] transition hover:translate-y-[-1px] hover:shadow-[0_12px_24px_rgba(37,99,235,0.22)] sm:inline-flex sm:px-4 sm:text-xs"
              >
                <span>Crear cuenta gratis</span>
              </TrackedLink>
            </div>
          </header>

          {/* Hero Content */}
          <div className="grid items-center gap-8 pt-8 sm:pt-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12 lg:pt-16">
            {/* Left Column: Text & CTAs */}
            <div className="animate-surface-reveal flex flex-col items-start text-left">
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50/80 px-3 py-1.5 text-[12px] font-bold text-indigo-700 ring-1 ring-indigo-200/50 backdrop-blur-sm sm:px-3.5 sm:text-xs">
                <Sparkles className="h-4 w-4 text-indigo-600" />
                <span>Estudiá con inteligencia, aprobá con confianza</span>
              </div>

              <h1 className="text-foreground mt-4 text-[2.2rem] leading-[1.02] font-bold tracking-[-0.05em] sm:mt-5 sm:text-5xl lg:text-[62px]">
                Todo lo que necesitás para aprobar tus parciales,{' '}
                <span className="from-brand to-brand-2 bg-gradient-to-r bg-clip-text text-transparent">
                  en un solo lugar
                </span>
                .
              </h1>

              <p className="mt-4 max-w-[560px] text-[13px] leading-6 text-slate-600 sm:mt-5 sm:text-base sm:leading-8">
                Encontrá tu universidad, estudiá con resúmenes claros y practicá con simuladores de
                examen de tus materias. Sin PDFs caóticos ni ChatGPT genérico.
              </p>

              {/* CTAs */}
              <div className="mt-6 flex w-full flex-col gap-2.5 sm:mt-8 sm:flex-row sm:gap-4">
                <TrackedLink
                  href="/explorar"
                  eventName="cta_click"
                  payload={{
                    location: 'home_hero',
                    cta_name: 'buscar_universidad',
                    destination: '/explorar',
                  }}
                  className="from-brand to-brand-2 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r px-5 text-sm font-bold text-white shadow-[0_12px_28px_rgba(37,99,235,0.22)] transition hover:translate-y-[-1px] hover:shadow-[0_16px_32px_rgba(37,99,235,0.26)] sm:h-13 sm:px-8"
                >
                  <PlayCircle className="h-5 w-5" />
                  Buscar mi universidad
                </TrackedLink>
                <TrackedLink
                  href={primaryHref}
                  eventName="cta_click"
                  payload={{
                    location: 'home_hero',
                    cta_name: 'crear_cuenta_gratis',
                    destination: primaryHref,
                  }}
                  className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 shadow-[0_6px_20px_rgba(0,0,0,0.03)] transition hover:translate-y-[-1px] hover:bg-slate-50 sm:h-13 sm:px-8"
                >
                  Crear cuenta gratis
                </TrackedLink>
              </div>

              {/* Key Benefits micro-list */}
              <div className="mt-6 grid w-full gap-3 border-t border-slate-100 pt-5 text-[12px] font-semibold text-slate-500 sm:mt-8 sm:flex sm:flex-wrap sm:gap-4 sm:pt-6 sm:text-xs">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  <span>Cátedras de Argentina</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  <span>Simuladores con tiempo</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  <span>Sin costo de registro</span>
                </div>
              </div>
            </div>

            {/* Right Column: Premium CSS Product Mockup */}
            <div
              className="animate-surface-reveal relative block"
              style={{ animationDelay: '100ms' }}
            >
              {/* Contenedor del mockup */}
              <div className="relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 p-3 shadow-[0_28px_60px_rgba(15,23,42,0.15)]">
                {/* Header Mockup */}
                <div className="mb-3 flex items-center justify-between rounded-xl border-b border-slate-800 bg-slate-900/60 px-4 py-2.5 text-[12px]">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500" />
                    <span className="font-bold text-white/90">UTN FRBA &bull; Sistemas</span>
                  </div>
                  <div className="font-medium text-white/60">Análisis Matemático I</div>
                  <div className="rounded bg-indigo-500/20 px-2 py-0.5 font-bold text-indigo-400">
                    28:14 min restantes
                  </div>
                </div>

                {/* Progress bar Mockup */}
                <div className="mb-3 flex items-center justify-between gap-3 border-b border-slate-900 px-3 pb-2.5">
                  <span className="shrink-0 text-[12px] font-bold text-white/50">
                    Pregunta 9 de 20
                  </span>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                    <div className="h-full w-[45%] rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" />
                  </div>
                  <span className="shrink-0 text-[12px] font-bold text-white/80">45%</span>
                </div>

                {/* Question Area */}
                <div className="p-3">
                  <div className="flex gap-2">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-[12px] font-bold text-indigo-400">
                      ?
                    </div>
                    <p className="text-xs leading-5 font-bold text-white">
                      Utilizando el criterio de la derivada segunda para extremos locales, ¿cuál de
                      las siguientes afirmaciones es la correcta si f&apos;(c) = 0?
                    </p>
                  </div>

                  {/* Options */}
                  <div className="mt-4 space-y-2">
                    {/* Option A (Correct & Selected) */}
                    <div className="flex items-start gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-[12px] text-white">
                      <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                        <Check className="h-2.5 w-2.5" />
                      </div>
                      <span className="leading-relaxed">
                        Si <strong>f&apos;&apos;(c) &gt; 0</strong>, entonces la función f presenta
                        un <strong>mínimo relativo</strong> en el punto c.
                      </span>
                    </div>

                    {/* Option B */}
                    <div className="flex items-start gap-2.5 rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-[12px] text-white/60">
                      <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-slate-700 text-[8px] font-bold text-white/40">
                        B
                      </div>
                      <span className="leading-relaxed">
                        Si f&apos;&apos;(c) &lt; 0, entonces la función presenta un mínimo relativo
                        en el punto c.
                      </span>
                    </div>

                    {/* Option C */}
                    <div className="flex items-start gap-2.5 rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-[12px] text-white/60">
                      <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-slate-700 text-[8px] font-bold text-white/40">
                        C
                      </div>
                      <span className="leading-relaxed">
                        Si f&apos;&apos;(c) = 0, se puede confirmar al 100% que existe un punto de
                        inflexión.
                      </span>
                    </div>
                  </div>

                  {/* Explanation Popup */}
                  <div className="mt-4 rounded-xl border border-t-2 border-indigo-500/20 border-t-indigo-500 bg-indigo-950/40 p-3.5">
                    <div className="mb-1.5 flex items-center gap-1.5">
                      <Bot className="h-4 w-4 text-indigo-400" />
                      <span className="text-[12px] font-bold text-indigo-200">
                        Explicación Paso a Paso &bull; Exclusivo Evaluo:
                      </span>
                    </div>
                    <p className="text-[12px] leading-5 text-indigo-200/80">
                      ¡Excelente respuesta! Como f&apos;&apos;(c) &gt; 0, la función posee una
                      concavidad hacia arriba en el entorno de c, lo cual geométricamente asegura
                      que el valor de la función en f(c) corresponds a un mínimo local. Si
                      f&apos;&apos;(c) hubiese dado 0, el criterio no definiría.
                    </p>
                  </div>
                </div>
              </div>

              {/* Decoración flotante con Sparkles */}
              <div className="absolute -bottom-5 -left-5 z-20 hidden rounded-2xl border border-white/10 bg-white/95 px-4 py-3 shadow-lg backdrop-blur sm:block">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[12px] font-bold text-slate-800">Cátedras locales</p>
                    <p className="text-[8px] leading-3 text-slate-500">
                      UBA, UTN, UNC, UNLP, UADE y más.
                    </p>
                  </div>
                </div>
              </div>

              <div className="absolute -top-5 -right-5 z-20 hidden rounded-2xl border border-white/10 bg-white/95 px-4 py-3 shadow-lg backdrop-blur sm:block">
                <div className="flex items-center gap-2">
                  <div className="animate-study-float flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[12px] font-bold text-slate-800">Preparado específico</p>
                    <p className="text-[8px] leading-3 text-slate-500">
                      Con el formato de un examen.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- TRUST SECTION --- */}
      <section className="border-b border-slate-100 bg-slate-50 py-10 sm:py-12">
        <div className="mx-auto w-full max-w-[1240px] px-6 sm:px-8 lg:px-10">
          <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
            {trustSignals.map((signal) => (
              <div
                key={signal}
                className="flex items-center rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm transition hover:shadow-md"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <CheckCircle2 className="h-5 w-5" />
                </span>
                <span className="ml-3 text-xs leading-5 font-semibold text-slate-700 sm:text-sm">
                  {signal}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-10 border-t border-slate-200/60 pt-8 text-center">
            <p className="text-xs font-bold tracking-widest text-slate-500 uppercase">
              Contenido adaptado para estudiantes de universidades argentinas
            </p>
            <HomeUniversidadLinks />
          </div>
        </div>
      </section>

      {/* --- CÓMO FUNCIONA --- */}
      <section id="como-funciona" className="py-16 sm:py-24">
        <div className="mx-auto w-full max-w-[1240px] px-6 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3.5 py-1 text-xs font-bold text-indigo-700">
              <ListFilter className="h-3.5 w-3.5" />
              Paso a paso
            </span>
            <h2 className="text-foreground mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-[40px]">
              ¿Cómo funciona el Método Evaluo?
            </h2>
            <p className="mt-3 text-sm text-slate-600 sm:text-base">
              Todo lo que necesitás para preparar tus parciales universitarios en 4 simples pasos
              coordinados.
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
                  {/* Conector visual entre pasos */}
                  {index < 3 && (
                    <div className="absolute top-12 right-[-16px] z-10 hidden h-[2px] w-[32px] bg-slate-100 group-hover:bg-indigo-200 lg:block" />
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

      {/* --- QUÉ ENCONTRÁS EN EVALUO (VALUE GRID) --- */}
      <section id="features" className="border-y border-slate-100 bg-slate-50/60 py-16 sm:py-24">
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
              Una suite de herramientas académicas integradas diseñadas específicamente para el
              ritmo de estudio universitario argentino.
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

      {/* --- COMPARATIVA SECTION --- */}
      <section id="comparativa" className="py-16 sm:py-24">
        <div className="mx-auto w-full max-w-[1240px] px-6 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl lg:text-[40px]">
              Dejá de luchar contra el caos de estudio
            </h2>
            <p className="mt-3 text-sm text-slate-600 sm:text-base">
              Estudiar para un examen universitario en Argentina ya es bastante complejo. Tu
              plataforma de estudio no debería complicarlo más.
            </p>
          </div>

          {/* Panel Comparativo */}
          <div className="mt-12 grid items-stretch gap-8 lg:grid-cols-2">
            {/* The Chaos Column */}
            <div className="flex flex-col justify-between rounded-3xl border border-red-100 bg-red-50/20 p-6 shadow-sm md:p-8">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-red-100/70 px-3.5 py-1.5 text-xs font-bold text-red-700">
                  <X className="h-4 w-4 shrink-0" />
                  <span>El caos tradicional de fotocopiadora y chat</span>
                </div>
                <p className="mt-4 text-xs font-bold tracking-wider text-slate-500 uppercase">
                  Estudiar a la vieja escuela
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
                <strong>Resultado habitual:</strong> Pérdida de horas preciosas ordenando archivos,
                dudas sin responder, ansiedad antes del parcial y estudio a ciegas sin saber qué
                nivel de práctica tenés.
              </div>
            </div>

            {/* The Evaluo Column */}
            <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl border border-indigo-200 bg-[linear-gradient(135deg,rgba(99,102,241,0.03)_0%,rgba(37,99,235,0.03)_100%)] p-6 shadow-md md:p-8">
              <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-indigo-500/5 blur-3xl" />

              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3.5 py-1.5 text-xs font-bold text-indigo-700">
                  <Check className="h-4 w-4 shrink-0" />
                  <span>El Método Evaluo centralizado</span>
                </div>
                <p className="mt-4 text-xs font-bold tracking-wider text-indigo-700 uppercase">
                  Estudiar con Evaluo
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
                <strong>El beneficio Evaluo:</strong> Foco absoluto. Todo lo que necesitás reunido
                en minutos. Practicás con el formato del profesor, ganás confianza y aprobás con
                tranquilidad.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- DEMO INTERACTIVA SECTION --- */}
      <section id="demo" className="bg-slate-50 py-16 sm:py-24">
        <div className="mx-auto w-full max-w-[1240px] px-6 sm:px-8 lg:px-10">
          <div className="mx-auto mb-10 max-w-3xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3.5 py-1 text-xs font-bold text-indigo-700">
              <PlayCircle className="h-3.5 w-3.5" />
              Interactúa en vivo
            </span>
            <h2 className="text-foreground mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-[40px]">
              Viví la experiencia de estudio
            </h2>
            <p className="mt-3 text-sm text-slate-600 sm:text-base">
              Seleccioná tu universidad, recorré el plan de tu materia y probá una pregunta del
              simulador. Sin registros obligatorios.
            </p>
          </div>

          <LazyInteractiveDemo />
        </div>
      </section>
      {/* --- FAQ SECTION --- */}
      <section id="faq" className="border-t border-slate-100 bg-slate-50 py-16 sm:py-24">
        <div className="mx-auto w-full max-w-[1240px] px-6 sm:px-8 lg:px-10">
          <div className="mx-auto mb-10 max-w-3xl text-center">
            <h2 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl lg:text-[40px]">
              Preguntas Frecuentes
            </h2>
            <p className="mt-3 text-sm text-slate-600 sm:text-base">
              Todo lo que necesitás saber sobre la plataforma y cómo prepararte para tus parciales.
            </p>
          </div>

          <FaqAccordion />
        </div>
      </section>

      {/* --- CTA FINAL --- */}
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
                Unite a estudiantes de universidades argentinas que preparan sus parciales con
                orden, practicidad y la estructura de sus materias.
              </p>

              <CatalogStats />

              {/* Botones */}
              <div className="mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
                <TrackedLink
                  href="/explorar"
                  eventName="cta_click"
                  payload={{
                    location: 'home_final_cta',
                    cta_name: 'buscar_universidad_final',
                    destination: '/explorar',
                  }}
                  className="inline-flex h-13 items-center justify-center gap-2 rounded-2xl bg-white px-6 text-sm font-bold text-slate-900 shadow-md transition hover:translate-y-[-1px] hover:bg-slate-50"
                >
                  <PlayCircle className="h-4.5 w-4.5 text-indigo-600" />
                  Buscar mi universidad
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

      {/* Footer */}
      <FooterHome />
    </div>
  );
}
