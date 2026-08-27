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

const studyCapabilities = [
  {
    icon: FileText,
    title: 'Estudiá tus materiales',
    description: 'Resumen, glosario, flashcards y ejercicios construidos desde el contenido que estás estudiando.',
  },
  {
    icon: ListChecks,
    title: 'Practicá como vas a rendir',
    description: 'Pasá del repaso a preguntas, pregunteros y simuladores sin salir de la misma materia.',
  },
  {
    icon: BookOpen,
    title: 'Encontrá material de tu materia',
    description: 'Entrá por universidad, carrera y materia y aprovechá recursos que otros estudiantes ya compartieron.',
  },
  {
    icon: Brain,
    title: 'Reforzá lo que te cuesta',
    description: 'Usá tus resultados para volver sobre los temas donde todavía necesitás otra vuelta.',
  },
];

export function HomeHeroV2({ primaryHref }: { primaryHref: string }) {
  return (
    <>
      <section className="relative overflow-hidden border-b border-slate-100 bg-[radial-gradient(circle_at_78%_18%,rgba(99,102,241,0.16),transparent_28%),radial-gradient(circle_at_12%_35%,rgba(37,99,235,0.08),transparent_24%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-300/70 to-transparent" />

        <div className="mx-auto w-full max-w-[1240px] px-4 pb-14 sm:px-8 lg:px-10 lg:pb-24">
          <header className="animate-surface-reveal relative z-20 flex min-h-18 items-center justify-between gap-2 border-b border-slate-200/70 py-3 sm:min-h-20 sm:gap-3">
            <Link
              href="/"
              className="group flex min-w-0 items-center gap-2 text-lg font-black tracking-[-0.045em] text-slate-950 sm:gap-2.5 sm:text-2xl"
            >
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-[0_7px_20px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/80 transition group-hover:-translate-y-0.5 sm:h-10 sm:w-10 sm:rounded-2xl">
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
              <span className="truncate">Evaluo</span>
            </Link>

            <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded-full border border-slate-200/80 bg-white/85 p-1.5 text-[11px] font-bold text-slate-500 shadow-[0_8px_24px_rgba(15,23,42,0.05)] backdrop-blur lg:flex">
              <a href="#producto" className="rounded-full px-4 py-2 transition hover:bg-slate-100 hover:text-slate-900">
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

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
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
                className="from-brand to-brand-2 inline-flex h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-gradient-to-r px-3 text-[10px] font-bold text-white shadow-[0_9px_22px_rgba(37,99,235,0.2)] transition hover:-translate-y-0.5 hover:shadow-[0_13px_28px_rgba(37,99,235,0.28)] sm:px-4 sm:text-xs"
              >
                Empezar gratis
                <ArrowRight className="h-3.5 w-3.5 shrink-0" />
              </TrackedLink>
            </div>
          </header>

          <div className="grid items-center gap-10 pt-10 sm:pt-16 lg:grid-cols-[0.92fr_1.08fr] lg:gap-14 lg:pt-18">
            <div className="animate-surface-reveal flex min-w-0 flex-col items-start text-left">
              <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50/80 px-3.5 py-1.5 text-[11px] font-bold text-indigo-700 shadow-sm sm:text-xs">
                <Sparkles className="h-3.5 w-3.5 shrink-0" />
                <span className="min-w-0">Tu próximo parcial empieza acá</span>
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
                  <ArrowRight className="h-4 w-4 shrink-0" />
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
                  <PlayCircle className="h-4.5 w-4.5 shrink-0" />
                  Explorar materias
                </TrackedLink>
              </div>

              <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-200/70 pt-5 text-[11px] font-semibold text-slate-500 sm:text-xs">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  Gratis para empezar
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  Materiales por materia
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  Estudio + práctica conectados
                </span>
              </div>
            </div>

            <HomeStudyPreview />
          </div>
        </div>
      </section>

      <section id="producto" className="border-b border-slate-100 bg-white py-20 sm:py-24 lg:py-28">
        <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-8 lg:px-10">
          <div className="grid gap-6 border-b border-slate-200 pb-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end lg:gap-16 lg:pb-12">
            <div>
              <div className="flex items-center gap-3 text-[11px] font-bold tracking-[0.16em] text-indigo-600 uppercase">
                <span className="h-px w-8 shrink-0 bg-indigo-400" />
                Todo para preparar una materia
              </div>
              <h2 className="mt-5 max-w-[620px] text-3xl font-bold tracking-[-0.045em] text-slate-950 sm:text-4xl lg:text-[46px] lg:leading-[1.04]">
                Estudiá, practicá y reforzá sin cambiar de lugar.
              </h2>
            </div>
            <p className="max-w-[620px] text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
              Evaluo conecta el material que estás leyendo con las herramientas que necesitás después.
              No son funciones sueltas: es un recorrido continuo desde tus apuntes hasta la práctica.
            </p>
          </div>

          <div className="grid gap-12 pt-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:gap-16 lg:pt-14">
            <div className="min-w-0">
              <div className="border-t border-slate-200">
                {studyCapabilities.map(({ icon: Icon, title, description }, index) => (
                  <div key={title} className="grid grid-cols-[34px_minmax(0,1fr)] gap-4 border-b border-slate-200 py-5 sm:grid-cols-[40px_minmax(0,1fr)] sm:py-6">
                    <div className="flex items-start justify-between pt-0.5">
                      <Icon className="h-4.5 w-4.5 text-indigo-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-baseline justify-between gap-4">
                        <h3 className="min-w-0 text-sm font-bold tracking-tight text-slate-950 sm:text-[15px]">{title}</h3>
                        <span className="shrink-0 text-[10px] font-semibold text-slate-300">0{index + 1}</span>
                      </div>
                      <p className="mt-2 max-w-[470px] text-xs leading-5 text-slate-500 sm:text-[13px] sm:leading-6">
                        {description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs font-bold">
                <TrackedLink
                  href="/login?mode=signup&next=%2Fdashboard%3FopenUpload%3D1"
                  eventName="cta_click"
                  payload={{
                    location: 'home_product_overview',
                    cta_name: 'subir_pdf',
                    destination: '/login?mode=signup&next=%2Fdashboard%3FopenUpload%3D1',
                  }}
                  className="inline-flex items-center gap-2 text-indigo-700 transition hover:text-indigo-900"
                >
                  <UploadCloud className="h-4 w-4 shrink-0" />
                  Subir mi PDF
                  <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                </TrackedLink>
                <TrackedLink
                  href="/explorar"
                  eventName="cta_click"
                  payload={{
                    location: 'home_product_overview',
                    cta_name: 'explorar_materias',
                    destination: '/explorar',
                  }}
                  className="inline-flex items-center gap-2 text-slate-600 transition hover:text-slate-950"
                >
                  Explorar materias
                  <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                </TrackedLink>
              </div>
            </div>

            <div className="relative min-w-0">
              <div className="pointer-events-none absolute -inset-8 rounded-[42px] bg-[radial-gradient(circle_at_60%_35%,rgba(99,102,241,0.15),transparent_58%)] blur-2xl" />

              <div className="relative min-w-0 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_28px_70px_rgba(15,23,42,0.11)]">
                <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:gap-4 sm:px-6">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <BookOpen className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-slate-400">Tu materia</p>
                      <p className="truncate text-xs font-bold text-slate-900 sm:text-sm">Marketing I</p>
                    </div>
                  </div>
                  <span className="hidden shrink-0 text-[10px] font-semibold text-emerald-600 sm:inline">Material listo para estudiar</span>
                </div>

                <div className="grid min-h-[350px] min-w-0 sm:grid-cols-[150px_minmax(0,1fr)]">
                  <aside className="hidden border-r border-slate-200 bg-slate-50/70 p-4 sm:block">
                    <p className="mb-3 px-2 text-[9px] font-bold tracking-[0.14em] text-slate-400 uppercase">Estudio</p>
                    {[
                      ['Resumen', true],
                      ['Glosario', false],
                      ['Flashcards', false],
                      ['Ejercicios', false],
                    ].map(([label, active]) => (
                      <div
                        key={String(label)}
                        className={`flex items-center gap-2 border-l-2 px-3 py-2.5 text-[10px] font-bold ${
                          active ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500'
                        }`}
                      >
                        {label}
                      </div>
                    ))}
                    <div className="mt-5 border-t border-slate-200 pt-4">
                      <p className="px-2 text-[9px] font-bold tracking-[0.14em] text-slate-400 uppercase">Práctica</p>
                      <div className="mt-2 flex items-center gap-2 px-3 py-2.5 text-[10px] font-bold text-slate-500">Preguntero</div>
                      <div className="flex items-center gap-2 px-3 py-2.5 text-[10px] font-bold text-slate-500">Simulador</div>
                    </div>
                  </aside>

                  <div className="min-w-0 p-4 sm:p-6 lg:p-7">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold tracking-[0.14em] text-indigo-600 uppercase">Resumen</p>
                        <h3 className="mt-2 text-lg font-bold tracking-tight text-slate-950 sm:text-xl">Qué tenés que saber para el parcial</h3>
                      </div>
                      <span className="hidden shrink-0 text-[10px] font-semibold text-slate-400 md:block">10 temas</span>
                    </div>

                    <div className="mt-6 border-t border-slate-200">
                      {[
                        ['Segmentación de mercado', 'Cómo dividir el mercado y elegir segmentos relevantes.'],
                        ['Posicionamiento', 'Qué lugar busca ocupar una marca frente a sus alternativas.'],
                        ['Propuesta de valor', 'Por qué un cliente debería elegir una oferta sobre otra.'],
                      ].map(([title, description], index) => (
                        <div key={title} className="grid grid-cols-[28px_minmax(0,1fr)] gap-3 border-b border-slate-100 py-4">
                          <span className="text-[10px] font-black text-indigo-500">0{index + 1}</span>
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold text-slate-900">{title}</p>
                            <p className="mt-1 text-[10px] leading-4 text-slate-500">{description}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-4 border-t border-slate-200 pt-4">
                      <p className="min-w-0 text-[10px] leading-5 text-slate-500">
                        Terminaste de leer. Ahora podés pasar a tarjetas o practicar preguntas del mismo tema.
                      </p>
                      <ArrowRight className="h-4 w-4 shrink-0 text-indigo-600" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
