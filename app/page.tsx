import Link from 'next/link';
import Image from 'next/image';
import {
  BookOpen,
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
} from 'lucide-react';
import { FooterHome } from '@/components/footer-home';
import { TrackedLink } from '@/components/marketing/tracked-link';

const steps = [
  {
    icon: UploadCloud,
    title: 'Subís tu material',
    description: 'Carga tus resúmenes, apuntes o PDFs y nuestra IA los organiza por vos.',
    image: '/como-funciona-1.webp',
    imageAlt: 'Estudiante subiendo material de estudio',
  },
  {
    icon: Bot,
    title: 'Practicás con preguntas',
    description: 'Miles de preguntas por tema con explicaciones detalladas.',
    image: '/como-funciona-2.webp',
    imageAlt: 'Estudiante practicando con preguntas',
  },
  {
    icon: CheckCircle2,
    title: 'Simulás tu examen',
    description: 'Haz simulacros cronometrados y mide tu progreso real.',
    image: '/como-funciona-3.webp',
    imageAlt: 'Estudiante simulando un examen en notebook',
  },
];

const reasons = [
  {
    icon: Target,
    title: 'Enfocado en exámenes',
    description: 'Todo el contenido está pensado para que avances con criterio y apruebes.',
  },
  {
    icon: Zap,
    title: 'Respuestas rápidas',
    description: 'Encontrás ayuda justo cuando la necesitas, sin perder tiempo buscando.',
  },
  {
    icon: BookOpen,
    title: 'Explicaciones simples',
    description: 'Los conceptos vienen bajados a tierra, con pasos y ejemplos concretos.',
  },
  {
    icon: Brain,
    title: 'Aprendés de verdad',
    description: 'No es solo resolver. También te ayuda a entender y mejorar tu base.',
  },
];

const socialStats = [
  { value: '+10k', label: 'estudiantes usando Evaluo' },
  { value: '+32k', label: 'documentos abiertos para estudiar' },
  { value: '4.8/5', label: 'valoración media en materiales guardados' },
  { value: '24/7', label: 'acceso a resúmenes, lector y simuladores' },
];

const heroHighlights = [
  {
    title: 'Resúmenes',
    description: 'claros y completos',
    icon: FileText,
    className: 'left-0 top-8 sm:left-6 lg:left-2 lg:top-10',
  },
  {
    title: 'Miles de preguntas',
    description: 'para practicar',
    icon: Bot,
    className: 'left-0 top-[12.8rem] sm:left-0 lg:left-[-2rem] lg:top-[15.5rem]',
  },
  {
    title: 'Simuladores',
    description: 'como el del examen',
    icon: BarChart3,
    className: 'right-6 top-[26rem] sm:right-8 lg:right-4 lg:top-[25rem]',
  },
];

export default function Home() {
  const primaryHref = '/login';
  const primaryLabel = 'Empezar gratis';

  return (
    <div className="animate-page-enter w-full overflow-x-clip bg-white text-slate-900">
      <section className="relative overflow-hidden border-b border-slate-100 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.18),transparent_28%),radial-gradient(circle_at_top_left,rgba(37,99,235,0.12),transparent_24%),linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)]">
        <div className="mx-auto w-full max-w-[1240px] px-4 pb-16 pt-3 sm:px-8 lg:px-10 lg:pb-28">
          <header className="animate-surface-reveal flex h-14 items-center justify-between gap-3 sm:h-16 sm:gap-4">
            <Link href="/" className="text-[30px] font-black tracking-[-0.04em] text-[#0F1B3D]">
              Evaluo
            </Link>

            <nav className="hidden items-center gap-8 text-sm font-medium text-slate-500 lg:flex">
              <a href="#como-funciona" className="transition hover:text-[#0F1B3D]">
                Cómo funciona
              </a>
              <a href="#beneficios" className="transition hover:text-[#0F1B3D]">
                Beneficios
              </a>
              <a href="#cta" className="transition hover:text-[#0F1B3D]">
                Empezar
              </a>
            </nav>

            <TrackedLink
              href={primaryHref}
              eventName="cta_click"
              payload={{
                location: 'home_header',
                cta_name: 'empezar_gratis',
                destination: primaryHref,
              }}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-[#2563EB] to-[#6366F1] px-4 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(37,99,235,0.20)] transition hover:opacity-95 sm:h-12 sm:px-6"
            >
              {primaryLabel}
            </TrackedLink>
          </header>

          <div className="grid items-center gap-8 pt-8 sm:gap-10 sm:pt-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pt-12">
            <div className="animate-surface-reveal max-w-[620px]">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-semibold ring-1 ring-[#C7D2FE] backdrop-blur">
                <Sparkles className="h-4 w-4 text-[#6366F1]" />
                <span className="bg-gradient-to-r from-[#2563EB] to-[#6366F1] bg-clip-text text-transparent">
                  Tu compañero de estudio inteligente
                </span>
              </div>

              <h1 className="mt-6 text-[2.85rem] font-bold leading-[0.98] tracking-[-0.06em] text-[#0F1B3D] sm:mt-8 sm:text-6xl lg:text-[72px]">
                Aprobá tus exámenes con ayuda inteligente
              </h1>

              <p className="mt-5 max-w-[560px] text-base leading-7 text-slate-500 sm:mt-8 sm:text-xl sm:leading-8">
                Resuelve dudas, practica parciales y encontrá materiales útiles en una sola plataforma.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:gap-4">
                <TrackedLink
                  href={primaryHref}
                  eventName="cta_click"
                  payload={{
                    location: 'home_hero',
                    cta_name: 'empezar_gratis',
                    destination: primaryHref,
                  }}
                  className="inline-flex h-13 items-center justify-center rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#6366F1] px-6 text-[15px] font-semibold text-white shadow-[0_10px_30px_rgba(37,99,235,0.24)] transition hover:translate-y-[-1px] sm:h-14 sm:px-8 sm:text-base"
                >
                  {primaryLabel}
                </TrackedLink>
                <TrackedLink
                  href="/explorar"
                  eventName="cta_click"
                  payload={{
                    location: 'home_hero',
                    cta_name: 'buscar_universidad',
                    destination: '/explorar',
                  }}
                  className="inline-flex h-13 items-center justify-center gap-2 rounded-2xl border border-[#2563EB]/25 bg-white px-6 text-[15px] font-semibold text-[#2563EB] shadow-[0_10px_30px_rgba(0,0,0,0.05)] transition hover:border-[#2563EB]/45 sm:h-14 sm:px-8 sm:text-base"
                >
                  <PlayCircle className="h-5 w-5" />
                  Buscar mi universidad
                </TrackedLink>
              </div>

              <div className="mt-8 grid gap-3 text-sm text-slate-500 min-[440px]:grid-cols-3 sm:mt-10">
                {socialStats.slice(0, 3).map((stat) => (
                  <div key={stat.label} className="surface-card rounded-2xl bg-white/85 px-4 py-4">
                    <p className="text-2xl font-bold text-[#0F1B3D]">{stat.value}</p>
                    <p className="mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="animate-surface-reveal relative min-h-[340px] sm:min-h-[460px] lg:min-h-[640px]" style={{ animationDelay: '120ms' }}>
              <div className="absolute inset-x-10 bottom-0 h-20 rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.18),rgba(99,102,241,0))] blur-3xl" />
              {heroHighlights.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className={`absolute z-20 hidden w-[230px] rounded-[28px] border border-white/90 bg-white/92 px-5 py-4 shadow-[0_18px_45px_rgba(15,23,42,0.10)] backdrop-blur md:block ${item.className}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5C62F4] to-[#2563EB] text-white shadow-[0_14px_30px_rgba(92,98,244,0.30)]">
                        <Icon className="h-7 w-7" />
                      </div>
                      <div>
                        <p className="text-[15px] font-bold text-[#0F1B3D]">{item.title}</p>
                        <p className="mt-1 text-sm leading-6 text-slate-500">{item.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="relative z-10 mx-auto w-full max-w-[680px] sm:max-w-[740px] lg:max-w-[780px]">
                <Image
                  src="/hero-home-estudiante.webp"
                  alt="Estudiante usando Evaluo"
                  width={1536}
                  height={1024}
                  sizes="(max-width: 1023px) 100vw, 48vw"
                  className="h-auto w-full object-contain"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[1240px] px-6 sm:px-8 lg:px-10">
        <section id="como-funciona" className="pb-14 pt-12 lg:pb-20 lg:pt-16">
          <div className="animate-surface-reveal overflow-hidden rounded-[34px] border border-[#E8EAFB] bg-[linear-gradient(180deg,#FFFFFF_0%,#FCFCFF_100%)] px-5 py-8 shadow-[0_24px_70px_rgba(100,116,139,0.10)] sm:px-8 sm:py-10 lg:rounded-[40px] lg:px-12 lg:py-14">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#EEF0FF] px-4 py-2 text-sm font-semibold text-[#5B5FEF]">
                <Sparkles className="h-4 w-4" />
                Así de simple
              </div>
              <h2 className="mt-4 text-[30px] font-bold tracking-[-0.05em] text-[#0F1B3D] sm:text-[40px] lg:text-[48px]">
                {'\u00BFCómo funciona Evaluo?'}
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-[#5F6C8D] sm:text-[21px] sm:leading-8">
                Todo lo que necesitas para aprobar, en 3 pasos.
              </p>
            </div>

            <div className="mt-8 grid gap-10 lg:mt-10 lg:grid-cols-3 lg:gap-10">
              {steps.map((step, index) => {
                return (
                  <article
                    key={step.title}
                    style={{ animationDelay: `${index * 110}ms` }}
                    className="animate-surface-reveal flex h-full flex-col items-center text-center"
                  >
                    <div className="relative flex h-[210px] w-full max-w-[280px] items-end justify-center overflow-hidden sm:h-[240px] sm:max-w-[290px] lg:h-[290px] lg:max-w-[300px]">
                      <Image
                        src={step.image}
                        alt={step.imageAlt}
                        width={1024}
                        height={1536}
                        sizes="(max-width: 639px) 250px, (max-width: 1023px) 280px, 300px"
                        className="h-full w-auto object-contain"
                      />
                    </div>

                    <div className="mb-4 hidden h-[2px] w-16 rounded-full bg-gradient-to-r from-[#8A83FF] to-[#6F65F8] lg:block" />

                    <div className="mt-2 flex w-full items-start justify-center gap-2.5 text-left">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#5D65F6] to-[#6366F1] text-sm font-bold text-white shadow-[0_12px_30px_rgba(99,102,241,0.28)] sm:h-10 sm:w-10">
                        {index + 1}
                      </div>
                      <div className="max-w-[300px]">
                        <h3 className="text-[20px] font-bold leading-[1.15] tracking-[-0.03em] text-[#0F1B3D] sm:text-[21px] lg:text-[22px]">
                          {step.title}
                        </h3>
                        <p className="mt-2 max-w-[300px] text-[13px] leading-6 text-[#5F6C8D] sm:text-[14px] sm:leading-6">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="beneficios" className="pb-12 pt-12 lg:pb-16 lg:pt-16">
          <div className="animate-surface-reveal mx-auto max-w-3xl text-center">
            <h2 className="text-[32px] font-bold tracking-[-0.04em] text-[#0F1B3D] sm:text-[40px]">
              Por qué elegir Evaluo
            </h2>
            <p className="mt-4 text-lg text-slate-500">
              Una experiencia enfocada en estudiar mejor, no en perder tiempo saltando entre herramientas.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {reasons.map((reason, index) => {
              const Icon = reason.icon;
              return (
                <article
                  key={reason.title}
                  style={{ animationDelay: `${index * 90}ms` }}
                  className="animate-surface-reveal rounded-2xl border border-[#EEF2FF] bg-white px-6 py-8 text-center shadow-[0_10px_30px_rgba(0,0,0,0.05)] transition-colors hover:border-[#2563EB]/30"
                >
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#6366F1] text-white shadow-lg">
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="mt-4 text-[17px] font-semibold leading-6 text-[#0F1B3D]">{reason.title}</h3>
                  <p className="mt-3 text-[14px] leading-7 text-slate-500">{reason.description}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section id="demo-educacion" className="relative py-16 sm:py-20 lg:py-28">
          <div className="absolute inset-y-0 left-1/2 w-screen max-w-none -translate-x-1/2 overflow-hidden bg-gradient-to-br from-[#eef4ff] via-[#e0e7ff] to-[#c7d2fe]">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHptMCAzMmMtNy43MzIgMC0xNC02LjI2OC0xNC0xNHM2LjI2OC0xNCAxNC0xNCAxNCA2LjI2OCAxNCAxNC02LjI2OCAxNC0xNCAxNHoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjEiLz48L2c+PC9zdmc+')] opacity-40" />
            <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-indigo-400/20 blur-3xl" />
          </div>

          <div className="relative mx-auto grid w-full max-w-[1240px] items-center gap-10 px-4 sm:px-8 lg:grid-cols-2 lg:px-10 lg:gap-12">
            <div className="animate-surface-reveal space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-indigo-600 shadow-sm">
                <Sparkles className="h-3.5 w-3.5" />
                IA + Educación
              </span>
              <h2 className="text-[2.35rem] font-bold tracking-tight text-[#0F1B3D] sm:text-5xl lg:text-6xl">
                Entendé mejor, <span className="bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">aprendé más</span>
              </h2>
              <p className="max-w-lg text-lg leading-relaxed text-slate-700">
                Evaluo no es solo respuestas. Es tu guía personalizada para entender, practicar y mejorar cada día.
              </p>
              <ul className="space-y-3">
                {[
                  { icon: CheckCircle2, text: 'Explicaciones paso a paso' },
                  { icon: BookOpen, text: 'Ejemplos y resúmenes relevantes' },
                  { icon: Zap, text: 'Disponible 24/7' },
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-700">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                      <item.icon className="h-4 w-4" />
                    </div>
                    <span className="font-medium">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex w-full justify-center lg:justify-end">
              <div className="animate-surface-reveal w-full transform transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1" style={{ animationDelay: '120ms' }}>
                <div className="rounded-3xl border border-white/50 bg-white p-6 shadow-[0_20px_60px_rgba(15,27,61,0.15)] backdrop-blur">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-500 shadow-lg">
                      <Bot className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-slate-800">Evaluo</span>
                      <p className="text-xs text-slate-500">Tu asistente de estudio</p>
                    </div>
                    <div className="ml-auto flex gap-1">
                      <div className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
                      <div className="h-2 w-2 rounded-full bg-slate-200" />
                      <div className="h-2 w-2 rounded-full bg-slate-200" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="rounded-2xl rounded-tl-sm bg-slate-100 p-3 text-sm text-slate-700">
                      No entiendo como resolver este ejercicio de física
                    </div>
                    <div className="rounded-2xl rounded-tr-sm bg-gradient-to-r from-indigo-50 to-blue-50 p-4 text-sm text-slate-800 shadow-sm">
                      <p className="mb-1 font-semibold text-indigo-600">Te lo explico paso a paso:</p>
                      <ol className="space-y-1 text-xs leading-relaxed">
                        <li>1. Identificamos los datos del problema</li>
                        <li>2. Aplicamos la fórmula F = m x a</li>
                        <li>3. Reemplazamos los valores</li>
                        <li>4. <strong>Resultado: F = 30N</strong></li>
                      </ol>
                    </div>
                    <div className="flex items-center justify-center gap-2 py-2">
                      <div className="h-1 w-1 animate-bounce rounded-full bg-indigo-300" style={{ animationDelay: '0ms' }} />
                      <div className="h-1 w-1 animate-bounce rounded-full bg-indigo-300" style={{ animationDelay: '150ms' }} />
                      <div className="h-1 w-1 animate-bounce rounded-full bg-indigo-300" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="cta" className="py-16 sm:py-20 lg:py-28">
          <div className="animate-surface-reveal relative overflow-hidden rounded-[28px] border border-slate-100 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.12),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(37,99,235,0.10),transparent_24%),linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] px-4 py-6 shadow-[0_18px_55px_rgba(15,27,61,0.08)] sm:rounded-[34px] sm:px-8 sm:py-10 lg:px-10 lg:py-12">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#6366F1]/40 to-transparent" />
            <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-[#EEF2FF] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#4F46E5] ring-1 ring-[#C7D2FE]">
                  <Sparkles className="h-3.5 w-3.5" />
                  Sigue con Evaluo
                </div>

                <div className="mt-6 flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#6366F1] text-white shadow-[0_14px_30px_rgba(79,93,255,0.22)]">
                    <GraduationCap className="h-7 w-7" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold tracking-[-0.04em] text-[#0F1B3D] sm:text-4xl lg:text-[2.85rem]">
                      Todo listo para que empieces a estudiar mejor.
                    </h2>
                    <p className="mt-3 max-w-xl text-base leading-8 text-slate-500">
                      Centraliza tus materias, encuentra materiales útiles y practica con una experiencia simple, ordenada y pensada para rendir mejor.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4 lg:items-end">
                <div className="w-full max-w-[360px] rounded-[28px] border border-slate-100 bg-white/90 p-4 shadow-[0_16px_40px_rgba(15,27,61,0.06)] backdrop-blur">
                  <p className="text-sm font-semibold text-[#0F1B3D]">Empieza en minutos</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Crea tu cuenta, elige tu universidad y retoma tus materias desde un mismo lugar.
                  </p>

                  <div className="mt-5 flex flex-col gap-3">
                    <TrackedLink
                      href={primaryHref}
                      eventName="cta_click"
                      payload={{
                        location: 'home_final_cta',
                        cta_name: 'crear_cuenta_gratis',
                        destination: primaryHref,
                      }}
                      className="inline-flex h-14 items-center justify-center rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#6366F1] px-8 text-base font-semibold text-white shadow-[0_14px_34px_rgba(37,99,235,0.22)] transition hover:translate-y-[-1px] hover:opacity-95"
                    >
                      Crear cuenta gratis
                    </TrackedLink>
                    <TrackedLink
                      href="/explorar"
                      eventName="cta_click"
                      payload={{
                        location: 'home_final_cta',
                        cta_name: 'ver_universidades',
                        destination: '/explorar',
                      }}
                      className="inline-flex h-14 items-center justify-center rounded-2xl border border-[#2563EB]/18 bg-[#F8FBFF] px-8 text-base font-semibold text-[#2563EB] transition hover:border-[#2563EB]/35 hover:bg-white"
                    >
                      Ver universidades
                    </TrackedLink>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <FooterHome />
    </div>
  );
}
