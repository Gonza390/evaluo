import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  FileText,
  ListChecks,
  PlayCircle,
  Sparkles,
  UploadCloud,
} from 'lucide-react';
import { TrackedLink } from '@/components/marketing/tracked-link';
import { HomeStudyPreview } from '@/components/marketing/home-study-preview';

const artifactCards = [
  {
    icon: FileText,
    label: 'Resumen',
    description: 'Lo importante, ordenado para repasar.',
  },
  {
    icon: BookOpen,
    label: 'Glosario',
    description: 'Conceptos y definiciones del material.',
  },
  {
    icon: Brain,
    label: 'Flashcards',
    description: 'Repaso activo para fijar conceptos.',
  },
  {
    icon: ListChecks,
    label: 'Ejercicios',
    description: 'Comprobá si realmente lo entendiste.',
  },
];

export function HomeHeroV2({ primaryHref }: { primaryHref: string }) {
  return (
    <>
      <section className="relative overflow-hidden border-b border-slate-100 bg-[radial-gradient(circle_at_78%_18%,rgba(99,102,241,0.16),transparent_28%),radial-gradient(circle_at_12%_35%,rgba(37,99,235,0.08),transparent_24%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-300/70 to-transparent" />

        <div className="mx-auto w-full max-w-[1240px] px-4 pb-14 sm:px-8 lg:px-10 lg:pb-24">
          <header className="animate-surface-reveal relative z-20 flex min-h-18 items-center justify-between gap-3 border-b border-slate-200/70 py-3 sm:min-h-20">
            <Link
              href="/"
              className="group flex items-center gap-2.5 text-xl font-black tracking-[-0.045em] text-slate-950 sm:text-2xl"
            >
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-[0_7px_20px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/80 transition group-hover:-translate-y-0.5">
                <Image
                  src="/icon.png"
                  alt=""
                  width={40}
                  height={40}
                  priority
                  unoptimized
                  className="h-full w-full object-contain"
                />
              </span>
              <span>Evaluo</span>
            </Link>

            <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded-full border border-slate-200/80 bg-white/85 p-1.5 text-[11px] font-bold text-slate-500 shadow-[0_8px_24px_rgba(15,23,42,0.05)] backdrop-blur lg:flex">
              <a href="#demo" className="rounded-full px-4 py-2 transition hover:bg-slate-100 hover:text-slate-900">
                Producto
              </a>
              <a href="#como-funciona" className="rounded-full px-4 py-2 transition hover:bg-slate-100 hover:text-slate-900">
                Cómo funciona
              </a>
              <Link href="/explorar" className="rounded-full px-4 py-2 transition hover:bg-slate-100 hover:text-slate-900">
                Materias
              </Link>
              <a href="#faq" className="rounded-full px-4 py-2 transition hover:bg-slate-100 hover:text-slate-900">
                Preguntas
              </a>
            </nav>

            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/login"
                className="hidden min-h-[42px] items-center rounded-xl px-3 text-xs font-bold text-slate-600 transition hover:bg-white hover:text-slate-950 sm:inline-flex"
              >
                Ingresar
              </Link>
              <TrackedLink
                href={primaryHref}
                eventName="cta_click"
                payload={{
                  location: 'home_header',
                  cta_name: 'empezar_estudiar',
                  destination: primaryHref,
                }}
                className="from-brand to-brand-2 inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r px-3.5 text-[11px] font-bold text-white shadow-[0_9px_22px_rgba(37,99,235,0.2)] transition hover:-translate-y-0.5 hover:shadow-[0_13px_28px_rgba(37,99,235,0.28)] sm:px-4 sm:text-xs"
              >
                Empezar gratis
                <ArrowRight className="h-3.5 w-3.5" />
              </TrackedLink>
            </div>
          </header>

          <div className="grid items-center gap-10 pt-10 sm:pt-16 lg:grid-cols-[0.92fr_1.08fr] lg:gap-14 lg:pt-18">
            <div className="animate-surface-reveal flex flex-col items-start text-left">
              <span className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50/80 px-3.5 py-1.5 text-[11px] font-bold text-indigo-700 shadow-sm sm:text-xs">
                <Sparkles className="h-3.5 w-3.5" />
                Tu próximo parcial empieza acá
              </span>

              <h1 className="text-foreground mt-5 max-w-[680px] text-[2.55rem] leading-[0.98] font-bold tracking-[-0.055em] sm:text-6xl lg:text-[68px]">
                Prepará mejor tu próximo{' '}
                <span className="from-brand to-brand-2 bg-gradient-to-r bg-clip-text text-transparent">
                  parcial.
                </span>
              </h1>

              <p className="mt-5 max-w-[610px] text-[14px] leading-7 text-slate-600 sm:text-[17px] sm:leading-8">
                Encontrá materiales de tu materia o subí tus propios apuntes. Evaluo los convierte
                en resumen, glosario, flashcards y ejercicios para que estudies y después practiques
                en un solo lugar.
              </p>

              <div className="mt-7 flex w-full flex-col gap-2.5 sm:mt-9 sm:flex-row sm:gap-3">
                <TrackedLink
                  href={primaryHref}
                  eventName="cta_click"
                  payload={{
                    location: 'home_hero',
                    cta_name: 'empezar_estudiar_gratis',
                    destination: primaryHref,
                  }}
                  className="from-brand to-brand-2 inline-flex h-13 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r px-6 text-sm font-bold text-white shadow-[0_14px_30px_rgba(37,99,235,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(37,99,235,0.3)] sm:px-8"
                >
                  Empezar a estudiar gratis
                  <ArrowRight className="h-4 w-4" />
                </TrackedLink>
                <TrackedLink
                  href="/explorar"
                  eventName="cta_click"
                  payload={{
                    location: 'home_hero',
                    cta_name: 'explorar_materias',
                    destination: '/explorar',
                  }}
                  className="inline-flex h-13 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 text-sm font-bold text-slate-700 shadow-[0_6px_20px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-indigo-200 hover:text-indigo-700 sm:px-7"
                >
                  <PlayCircle className="h-4.5 w-4.5" />
                  Explorar materias
                </TrackedLink>
              </div>

              <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-200/70 pt-5 text-[11px] font-semibold text-slate-500 sm:text-xs">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Gratis para empezar
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Materiales por materia
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Estudio + práctica conectados
                </span>
              </div>
            </div>

            <HomeStudyPreview />
          </div>
        </div>
      </section>

      <section className="border-b border-slate-100 bg-white py-16 sm:py-20">
        <div className="mx-auto w-full max-w-[1240px] px-6 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3.5 py-1.5 text-xs font-bold text-indigo-700">
              <UploadCloud className="h-3.5 w-3.5" />
              De tus apuntes a una forma de estudiar
            </span>
            <h2 className="text-foreground mt-5 text-3xl font-bold tracking-[-0.035em] sm:text-4xl lg:text-[44px]">
              Un PDF. Cuatro formas de estudiarlo.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              Subí tus apuntes una vez. Evaluo organiza el contenido y construye herramientas para
              entender, memorizar y practicar sin tener que empezar de cero en cada app.
            </p>
          </div>

          <div className="mt-10 grid items-stretch gap-4 lg:grid-cols-[0.9fr_auto_1.7fr] lg:gap-6">
            <div className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-slate-50 p-6 sm:p-7">
              <div>
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200">
                  <UploadCloud className="h-5 w-5" />
                </span>
                <p className="mt-5 text-[11px] font-bold tracking-[0.14em] text-slate-400 uppercase">
                  Paso 1
                </p>
                <h3 className="mt-2 text-xl font-bold tracking-tight text-slate-900">Subí tus apuntes</h3>
                <p className="mt-2 text-xs leading-5 text-slate-600">
                  Texto, tablas, fórmulas y páginas visuales se procesan antes de crear el material de estudio.
                </p>
              </div>
              <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600">
                    <FileText className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Apuntes del parcial.pdf</p>
                    <p className="mt-0.5 text-[10px] text-slate-400">Listo para procesar</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden items-center justify-center lg:flex">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-indigo-100 bg-indigo-50 text-indigo-600">
                <ArrowRight className="h-4 w-4" />
              </span>
            </div>

            <div className="rounded-3xl border border-indigo-100 bg-[linear-gradient(135deg,#f8fafc_0%,#eef2ff_100%)] p-5 sm:p-7">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold tracking-[0.14em] text-indigo-500 uppercase">Paso 2</p>
                  <h3 className="mt-2 text-xl font-bold tracking-tight text-slate-900">
                    Elegí cómo querés estudiar
                  </h3>
                </div>
                <span className="hidden rounded-full bg-white px-3 py-1.5 text-[10px] font-bold text-indigo-700 shadow-sm ring-1 ring-indigo-100 sm:inline-flex">
                  Generado desde tu material
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {artifactCards.map(({ icon: Icon, label, description }) => (
                  <article
                    key={label}
                    className="rounded-2xl border border-white bg-white/90 p-4 shadow-[0_8px_22px_rgba(15,23,42,0.04)]"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <Icon className="h-4 w-4" />
                    </span>
                    <h4 className="mt-3 text-sm font-bold text-slate-900">{label}</h4>
                    <p className="mt-1 text-[11px] leading-5 text-slate-500">{description}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 px-5 py-4 text-center sm:flex-row sm:text-left">
            <div>
              <p className="text-xs font-bold text-slate-800">¿Preferís empezar con material que ya existe?</p>
              <p className="mt-1 text-[11px] text-slate-500">
                Entrá a tu materia y revisá apuntes y recursos compartidos antes de subir el tuyo.
              </p>
            </div>
            <TrackedLink
              href="/explorar"
              eventName="cta_click"
              payload={{
                location: 'home_pdf_transform',
                cta_name: 'explorar_materias',
                destination: '/explorar',
              }}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 text-xs font-bold text-indigo-700 transition hover:bg-indigo-50"
            >
              Explorar materias
              <ArrowRight className="h-3.5 w-3.5" />
            </TrackedLink>
          </div>
        </div>
      </section>
    </>
  );
}
