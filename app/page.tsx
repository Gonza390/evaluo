'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  BookOpen,
  Bot,
  Brain,
  CheckCircle2,
  GraduationCap,
  PlayCircle,
  Sparkles,
  Target,
  UploadCloud,
  Zap,
} from 'lucide-react';
import { FooterHome } from '@/components/footer-home';

const steps = [
  {
    icon: UploadCloud,
    title: 'Subis tu duda',
    description: 'Escribi tu pregunta o subi una foto de tu ejercicio o material.',
  },
  {
    icon: Bot,
    title: 'Recibis ayuda',
    description: 'Evaluo te responde al instante con una explicacion clara y ordenada.',
  },
  {
    icon: CheckCircle2,
    title: 'Practicas y aprobas',
    description: 'Preparas parciales y finales con contenido enfocado en rendir mejor.',
  },
];

const reasons = [
  {
    icon: Target,
    title: 'Enfocado en examenes',
    description: 'Todo el contenido esta pensado para que avances con criterio y apruebes.',
  },
  {
    icon: Zap,
    title: 'Respuestas rapidas',
    description: 'Encontras ayuda justo cuando la necesitas, sin perder tiempo buscando.',
  },
  {
    icon: BookOpen,
    title: 'Explicaciones simples',
    description: 'Los conceptos vienen bajados a tierra, con pasos y ejemplos concretos.',
  },
  {
    icon: Brain,
    title: 'Aprendes de verdad',
    description: 'No es solo resolver. Tambien te ayuda a entender y mejorar tu base.',
  },
];

const socialStats = [
  { value: '+10k', label: 'estudiantes usando Evaluo' },
  { value: '+32k', label: 'documentos abiertos para estudiar' },
  { value: '4.8/5', label: 'valoración media en materiales guardados' },
  { value: '24/7', label: 'acceso a resúmenes, lector y simuladores' },
];

const discoverySignals = [
  'Recursos mejor valorados',
  'Documentos más vistos',
  'Materiales destacados por carrera',
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
                Como funciona
              </a>
              <a href="#beneficios" className="transition hover:text-[#0F1B3D]">
                Beneficios
              </a>
              <a href="#cta" className="transition hover:text-[#0F1B3D]">
                Empezar
              </a>
            </nav>

            <Link
              href={primaryHref}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-[#2563EB] to-[#6366F1] px-4 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(37,99,235,0.20)] transition hover:opacity-95 sm:h-12 sm:px-6"
            >
              {primaryLabel}
            </Link>
          </header>

          <div className="grid items-center gap-8 pt-8 sm:gap-10 sm:pt-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pt-12">
            <div className="animate-surface-reveal max-w-[620px]">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-semibold ring-1 ring-[#C7D2FE] backdrop-blur">
                <Sparkles className="h-4 w-4 text-[#6366F1]" />
                <span className="bg-gradient-to-r from-[#2563EB] to-[#6366F1] bg-clip-text text-transparent">
                  Tu companero de estudio inteligente
                </span>
              </div>

              <h1 className="mt-6 text-[2.85rem] font-bold leading-[0.98] tracking-[-0.06em] text-[#0F1B3D] sm:mt-8 sm:text-6xl lg:text-[72px]">
                Aproba tus examenes con ayuda inteligente
              </h1>

              <p className="mt-5 max-w-[560px] text-base leading-7 text-slate-500 sm:mt-8 sm:text-xl sm:leading-8">
                Resuelve dudas, practica parciales y encontra materiales utiles en una sola plataforma.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:gap-4">
                <Link
                  href={primaryHref}
                  className="inline-flex h-13 items-center justify-center rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#6366F1] px-6 text-[15px] font-semibold text-white shadow-[0_10px_30px_rgba(37,99,235,0.24)] transition hover:translate-y-[-1px] sm:h-14 sm:px-8 sm:text-base"
                >
                  {primaryLabel}
                </Link>
                <Link
                  href="/explorar"
                  className="inline-flex h-13 items-center justify-center gap-2 rounded-2xl border border-[#2563EB]/25 bg-white px-6 text-[15px] font-semibold text-[#2563EB] shadow-[0_10px_30px_rgba(0,0,0,0.05)] transition hover:border-[#2563EB]/45 sm:h-14 sm:px-8 sm:text-base"
                >
                  <PlayCircle className="h-5 w-5" />
                  Buscar mi universidad
                </Link>
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

            <div className="animate-surface-reveal relative overflow-hidden rounded-[28px] border border-white/80 bg-white shadow-[0_22px_60px_rgba(15,27,61,0.12)] sm:rounded-[34px]" style={{ animationDelay: '120ms' }}>
              <Image
                src="/hero-student-right-v2.png"
                alt="Estudiante usando Evaluo"
                width={916}
                height={1024}
                className="h-auto w-full object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[1240px] px-6 sm:px-8 lg:px-10">
        <section className="py-8 lg:py-10">
          <div className="animate-surface-reveal rounded-[24px] border border-slate-100 bg-white px-4 py-4 shadow-[0_16px_40px_rgba(15,27,61,0.06)] sm:rounded-[28px] sm:px-5 sm:py-5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <p className="eyebrow-label text-indigo-500">Prueba social</p>
                <h2 className="mt-2 text-2xl font-bold tracking-[-0.04em] text-[#0F1B3D] sm:text-[2rem]">
                  Estudio, lectura y práctica en un mismo flujo.
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-500">
                  La plataforma ya combina documentos más vistos, recursos mejor valorados y recorridos de estudio por carrera.
                </p>
              </div>
              <div className="grid flex-1 gap-3 min-[460px]:grid-cols-2 xl:grid-cols-4">
                {socialStats.map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-slate-100 bg-slate-50/90 px-4 py-4">
                    <p className="text-2xl font-black tracking-[-0.05em] text-[#0F1B3D]">{stat.value}</p>
                    <p className="mt-2 text-xs leading-5 text-slate-500">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              {discoverySignals.map((signal) => (
                <span key={signal} className="inline-flex items-center rounded-full border border-[#CBD5E1] bg-[#F8FBFF] px-3 py-1.5 text-xs font-semibold text-[#2563EB]">
                  {signal}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section id="como-funciona" className="pb-12 pt-12 lg:pb-16 lg:pt-16">
          <div className="animate-surface-reveal mx-auto max-w-2xl text-center">
            <h2 className="text-[36px] font-bold tracking-[-0.04em] text-[#0F1B3D] sm:text-[44px]">
              Como funciona
            </h2>
            <div className="mx-auto mt-4 h-1 w-20 rounded-full bg-gradient-to-r from-[#2563EB] to-[#6366F1]" />
          </div>

          <div className="mt-16 grid gap-8 lg:grid-cols-3 lg:gap-10">
            {steps.map((step, index) => {
              const Icon = step.icon;

              return (
                <article
                  key={step.title}
                  style={{ animationDelay: `${index * 110}ms` }}
                  className="animate-surface-reveal rounded-2xl border border-slate-100 bg-white px-6 pb-7 pt-8 shadow-[0_10px_30px_rgba(0,0,0,0.05)]"
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-1 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#6366F1] text-white shadow-lg">
                      <Icon className="h-7 w-7" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-[#0F1B3D]">{step.title}</h3>
                      <p className="mt-3 text-sm leading-6 text-slate-500">{step.description}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section id="beneficios" className="pb-12 pt-12 lg:pb-16 lg:pt-16">
          <div className="animate-surface-reveal mx-auto max-w-3xl text-center">
            <h2 className="text-[32px] font-bold tracking-[-0.04em] text-[#0F1B3D] sm:text-[40px]">
              Por que elegir Evaluo
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

        <section
          id="demo-educacion"
          className="relative py-16 sm:py-20 lg:py-28"
        >
          <div className="absolute inset-y-0 left-1/2 w-screen max-w-none -translate-x-1/2 overflow-hidden bg-gradient-to-br from-[#eef4ff] via-[#e0e7ff] to-[#c7d2fe]">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHptMCAzMmMtNy43MzIgMC0xNC02LjI2OC0xNC0xNHM2LjI2OC0xNCAxNC0xNCAxNCA2LjI2OCAxNCAxNC02LjI2OCAxNC0xNCAxNHoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjEiLz48L2c+PC9zdmc+')] opacity-40" />
            <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-indigo-400/20 blur-3xl" />
          </div>

          <div className="relative mx-auto grid w-full max-w-[1240px] items-center gap-10 px-4 sm:px-8 lg:grid-cols-2 lg:px-10 lg:gap-12">
            <div className="animate-surface-reveal space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-indigo-600 shadow-sm">
                <Sparkles className="h-3.5 w-3.5" />
                IA + Educacion
              </span>
              <h2 className="text-[2.35rem] font-bold tracking-tight text-[#0F1B3D] sm:text-5xl lg:text-6xl">
                Entende mejor, <span className="bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">aprende mas</span>
              </h2>
              <p className="max-w-lg text-lg leading-relaxed text-slate-700">
                Evaluo no es solo respuestas. Es tu guia personalizada para entender, practicar y mejorar cada dia.
              </p>
              <ul className="space-y-3">
                {[
                  { icon: CheckCircle2, text: 'Explicaciones paso a paso' },
                  { icon: BookOpen, text: 'Ejemplos y resumenes relevantes' },
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
                      No entiendo como resolver este ejercicio de fisica
                    </div>
                    <div className="rounded-2xl rounded-tr-sm bg-gradient-to-r from-indigo-50 to-blue-50 p-4 text-sm text-slate-800 shadow-sm">
                      <p className="mb-1 font-semibold text-indigo-600">Te lo explico paso a paso:</p>
                      <ol className="space-y-1 text-xs leading-relaxed">
                        <li>1. Identificamos los datos del problema</li>
                        <li>2. Aplicamos la formula F = m x a</li>
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

                <div className="mt-7 flex flex-wrap gap-3">
                  {['Acceso simple', 'Materiales en un solo lugar', 'Simuladores listos'].map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-[0_8px_20px_rgba(15,27,61,0.04)]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-4 lg:items-end">
                <div className="w-full max-w-[360px] rounded-[28px] border border-slate-100 bg-white/90 p-4 shadow-[0_16px_40px_rgba(15,27,61,0.06)] backdrop-blur">
                  <p className="text-sm font-semibold text-[#0F1B3D]">Empieza en minutos</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Crea tu cuenta, elige tu universidad y retoma tus materias desde un mismo lugar.
                  </p>

                  <div className="mt-5 flex flex-col gap-3">
                    <Link
                      href={primaryHref}
                      className="inline-flex h-14 items-center justify-center rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#6366F1] px-8 text-base font-semibold text-white shadow-[0_14px_34px_rgba(37,99,235,0.22)] transition hover:translate-y-[-1px] hover:opacity-95"
                    >
                      Crear cuenta gratis
                    </Link>
                    <Link
                      href="/explorar"
                      className="inline-flex h-14 items-center justify-center rounded-2xl border border-[#2563EB]/18 bg-[#F8FBFF] px-8 text-base font-semibold text-[#2563EB] transition hover:border-[#2563EB]/35 hover:bg-white"
                    >
                      Ver universidades
                    </Link>
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
