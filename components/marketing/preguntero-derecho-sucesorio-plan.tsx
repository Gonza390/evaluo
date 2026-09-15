'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Brain,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Layers3,
  ListChecks,
  Sparkles,
  Target,
  UploadCloud,
} from 'lucide-react';
import { TrackedLink } from '@/components/marketing/tracked-link';

type SampleQuestion = {
  id: string;
  enunciado: string;
  opcionesCount: number;
};

type Props = {
  title: string;
  materiaNombre: string;
  universidadNombre?: string;
  carreraNombre?: string;
  totalPreguntas: number;
  samplePreguntas: SampleQuestion[];
  simuladorHref: string;
  pregunteroHref: string;
  materiaHref: string;
  resumenHref: string;
  uploadHref: string;
  parcial1Href: string;
  integradorHref: string;
};

const EXPERIMENT = 'preguntero_derecho_sucesorio_p2_plan_v1';

function getDaysUntilExam(examDate: string) {
  if (!examDate) return 7;
  const exam = new Date(`${examDate}T12:00:00`);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
  const diff = Math.ceil((exam.getTime() - today.getTime()) / 86_400_000);
  return Math.max(1, Math.min(30, diff));
}

export function PregunteroDerechoSucesorioPlan({
  title,
  materiaNombre,
  universidadNombre,
  carreraNombre,
  totalPreguntas,
  samplePreguntas,
  simuladorHref,
  pregunteroHref,
  materiaHref,
  resumenHref,
  uploadHref,
  parcial1Href,
  integradorHref,
}: Props) {
  const [examDate, setExamDate] = useState('');
  const [minutesPerDay, setMinutesPerDay] = useState(60);

  const daysUntilExam = useMemo(() => getDaysUntilExam(examDate), [examDate]);
  const totalMinutes = daysUntilExam * minutesPerDay;

  const plan = useMemo(() => {
    const compact = daysUntilExam <= 3;
    return [
      {
        phase: compact ? 'Primera sesión' : 'Inicio',
        title: 'Entender el material',
        description: 'Empezá por un resumen y un glosario para ubicar conceptos, instituciones y relaciones importantes.',
        tool: 'Resumen + glosario',
        icon: BookOpen,
      },
      {
        phase: compact ? 'Segunda sesión' : 'Mitad del plan',
        title: 'Conectar los temas',
        description: 'Usá un mapa mental para ver cómo se relacionan los conceptos antes de memorizar detalles aislados.',
        tool: 'Mapa mental',
        icon: Brain,
      },
      {
        phase: compact ? 'Repaso' : 'Últimos días',
        title: 'Recordar activamente',
        description: 'Convertí conceptos del mismo material en flashcards y recuperalos sin mirar la respuesta.',
        tool: 'Flashcards',
        icon: Layers3,
      },
      {
        phase: 'Antes del parcial',
        title: 'Practicar y detectar huecos',
        description: 'Volvé al Preguntero del Parcial 2, practicá y usá los errores para decidir qué reforzar.',
        tool: 'Preguntero + ejercicios',
        icon: Target,
      },
    ];
  }, [daysUntilExam]);

  return (
    <div
      className="w-full overflow-x-clip bg-white text-slate-950"
      data-experiment={EXPERIMENT}
    >
      <section className="border-b border-slate-100 bg-[radial-gradient(circle_at_80%_10%,rgba(99,102,241,0.12),transparent_28%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
        <div className="mx-auto w-full max-w-[1120px] px-4 py-10 sm:px-8 sm:py-14 lg:px-10 lg:py-16">
          <div className="min-w-0 max-w-4xl">
            <Link
              href={pregunteroHref}
              className="inline-flex max-w-full items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-indigo-700"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate">Preguntero de {materiaNombre}</span>
            </Link>

            <div className="mt-6 inline-flex max-w-full items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3.5 py-1.5 text-[11px] font-bold text-indigo-700 sm:text-xs">
              <ListChecks className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>Preguntero · Parcial 2</span>
            </div>

            <h1 className="mt-5 max-w-[900px] break-words text-[2.35rem] leading-[1.02] font-bold tracking-[-0.055em] text-slate-950 sm:text-5xl lg:text-[62px]">
              {title}
            </h1>

            {universidadNombre ? (
              <p className="mt-4 max-w-full break-words text-sm font-bold text-indigo-700 sm:text-base">
                {universidadNombre}
                {carreraNombre ? ` · ${carreraNombre}` : ''}
              </p>
            ) : null}

            <p className="mt-5 max-w-3xl text-[15px] leading-7 text-slate-600 sm:text-[17px] sm:leading-8">
              Practicá con preguntas del Parcial 2 y, cuando quieras dar el siguiente paso, organizá cómo estudiar con tus propios apuntes.
            </p>

            <div className="mt-7 flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a
                href="#preguntas-parcial"
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700 sm:w-auto"
              >
                Ver preguntas de muestra
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href="#plan-parcial"
                className="from-brand to-brand-2 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r px-5 text-sm font-bold text-white shadow-[0_12px_28px_rgba(37,99,235,0.22)] transition hover:-translate-y-0.5 sm:w-auto"
              >
                <CalendarDays className="h-4.5 w-4.5" aria-hidden="true" />
                Armar mi plan para este parcial
              </a>
            </div>

            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-200/80 pt-5 text-[11px] font-semibold text-slate-600 sm:text-xs">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                {totalPreguntas.toLocaleString('es-AR')} preguntas disponibles
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                Tus apuntes siguen siendo la fuente
              </span>
            </div>
          </div>
        </div>
      </section>

      <section id="preguntas-parcial" className="scroll-mt-24 border-b border-slate-100 bg-white py-12 sm:py-16">
        <div className="mx-auto w-full max-w-[1120px] px-4 sm:px-8 lg:px-10">
          <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
            <div className="min-w-0">
              <p className="text-[11px] font-black tracking-[0.14em] text-indigo-700 uppercase">Antes del plan</p>
              <h2 className="mt-3 max-w-2xl break-words text-2xl font-bold tracking-[-0.04em] text-slate-950 sm:text-3xl">
                Mirá el tipo de preguntas que vas a practicar.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                El Preguntero sigue siendo el contenido principal de esta página. El plan aparece después como una forma de continuar la preparación.
              </p>

              {samplePreguntas.length === 0 ? (
                <div className="mt-7 rounded-[24px] border border-slate-200 bg-slate-50 p-5 sm:p-6">
                  <p className="text-sm leading-7 text-slate-600">
                    Todavía estamos cargando preguntas de muestra para este parcial. Podés entrar al simulador para ver las disponibles.
                  </p>
                </div>
              ) : (
                <ul className="mt-7 space-y-3">
                  {samplePreguntas.slice(0, 4).map((question, index) => (
                    <li
                      key={question.id}
                      className="min-w-0 rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-6"
                    >
                      <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-[10px] font-black text-indigo-700">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="break-words text-sm leading-7 font-semibold text-slate-900">
                            {question.enunciado}
                          </p>
                          <p className="mt-2 text-xs font-semibold text-slate-500">
                            {question.opcionesCount} opciones
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <aside className="min-w-0 rounded-[26px] border border-slate-200 bg-slate-50/70 p-5 sm:p-6 lg:sticky lg:top-24">
              <Sparkles className="h-5 w-5 text-indigo-700" aria-hidden="true" />
              <h2 className="mt-4 break-words text-lg font-bold tracking-[-0.03em] text-slate-950">
                ¿Querés medir cómo venís?
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Entrá al simulador del Parcial 2 y usá tus errores como señal para decidir qué estudiar después.
              </p>
              <TrackedLink
                href={simuladorHref}
                eventName="preguntero_landing_cta_clicked"
                payload={{
                  experiment: EXPERIMENT,
                  location: 'questions_sidebar',
                  cta_name: 'practicar_parcial_2',
                  destination: simuladorHref,
                  materia: materiaNombre,
                  parcial: '2',
                }}
                className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                Practicar Parcial 2
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </TrackedLink>
            </aside>
          </div>
        </div>
      </section>

      <section id="plan-parcial" className="scroll-mt-24 bg-slate-950 py-14 text-white sm:py-18">
        <div className="mx-auto w-full max-w-[1120px] px-4 sm:px-8 lg:px-10">
          <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-start lg:gap-12">
            <div className="min-w-0">
              <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-[11px] font-bold text-indigo-200">
                <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                Nuevo · plan para tu parcial
              </div>
              <h2 className="mt-5 max-w-2xl break-words text-3xl font-bold tracking-[-0.05em] text-white sm:text-4xl lg:text-[48px] lg:leading-[1.05]">
                Organizá cómo preparar Derecho Sucesorio con el tiempo que tenés.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
                Elegí cuándo rendís y cuánto podés estudiar por día. Te mostramos una estructura inicial para combinar tus apuntes, las herramientas de Evaluo y el Preguntero del Parcial 2.
              </p>

              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                <label className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                  <span className="flex items-center gap-2 text-xs font-bold text-slate-200">
                    <CalendarDays className="h-4 w-4 text-indigo-300" aria-hidden="true" />
                    ¿Cuándo rendís?
                  </span>
                  <input
                    type="date"
                    value={examDate}
                    onChange={(event) => setExamDate(event.target.value)}
                    className="mt-3 min-h-11 w-full min-w-0 rounded-xl border border-white/10 bg-slate-900 px-3 text-sm text-white outline-none focus:border-indigo-400"
                  />
                </label>

                <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                  <span className="flex items-center gap-2 text-xs font-bold text-slate-200">
                    <Clock3 className="h-4 w-4 text-indigo-300" aria-hidden="true" />
                    Tiempo por día
                  </span>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {[30, 60, 90].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setMinutesPerDay(value)}
                        className={`min-h-11 rounded-xl border px-2 text-xs font-bold transition ${
                          minutesPerDay === value
                            ? 'border-indigo-400 bg-indigo-500 text-white'
                            : 'border-white/10 bg-slate-900 text-slate-300 hover:border-white/25'
                        }`}
                      >
                        {value} min
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-indigo-400/20 bg-indigo-500/10 p-4">
                <p className="text-xs font-bold text-indigo-200">Tu marco de estudio</p>
                <p className="mt-1 break-words text-sm leading-6 text-slate-200">
                  {examDate ? `${daysUntilExam} día${daysUntilExam === 1 ? '' : 's'} hasta el parcial` : 'Ejemplo de 7 días'} · {minutesPerDay} min por día · hasta {Math.round(totalMinutes / 60)} h totales.
                </p>
              </div>

              <div className="mt-7 rounded-[24px] border border-white/10 bg-white/[0.04] p-5 sm:p-6">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-200">
                    <UploadCloud className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white">Subí tus apuntes para trabajar este plan con tu material.</p>
                    <p className="mt-1 text-xs leading-6 text-slate-400">
                      El cargador real de Evaluo se abre con Derecho Sucesorio como contexto. Si todavía no tenés cuenta, primero te pedimos crearla.
                    </p>
                  </div>
                </div>
                <TrackedLink
                  href={uploadHref}
                  eventName="preguntero_study_plan_cta_clicked"
                  payload={{
                    experiment: EXPERIMENT,
                    location: 'study_plan_upload',
                    cta_name: 'subir_apuntes_para_plan',
                    destination: uploadHref,
                    materia: materiaNombre,
                    parcial: '2',
                  }}
                  className="from-brand to-brand-2 mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r px-5 text-sm font-bold text-white shadow-[0_14px_30px_rgba(37,99,235,0.25)] transition hover:-translate-y-0.5"
                >
                  <UploadCloud className="h-4.5 w-4.5" aria-hidden="true" />
                  Subir mis apuntes en Evaluo
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </TrackedLink>
              </div>
            </div>

            <div className="min-w-0 rounded-[28px] border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur sm:p-7">
              <div className="flex min-w-0 items-start justify-between gap-4 border-b border-white/10 pb-5">
                <div className="min-w-0">
                  <p className="text-[10px] font-black tracking-[0.14em] text-indigo-200 uppercase">Plan inicial</p>
                  <p className="mt-1 break-words text-lg font-bold text-white">
                    Derecho Sucesorio · Parcial 2
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold text-slate-200">
                  {daysUntilExam} días
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {plan.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <div
                      key={step.title}
                      className="grid min-w-0 grid-cols-[40px_minmax(0,1fr)] gap-3 rounded-2xl border border-white/10 bg-slate-900/55 p-4 sm:grid-cols-[44px_minmax(0,1fr)] sm:gap-4"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-200 sm:h-11 sm:w-11">
                        <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                          <p className="break-words text-sm font-bold text-white">{step.title}</p>
                          <span className="text-[10px] font-bold text-indigo-200">{step.phase}</span>
                        </div>
                        <p className="mt-1.5 break-words text-xs leading-5 text-slate-400">{step.description}</p>
                        <span className="mt-2 inline-flex max-w-full rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold text-slate-200">
                          {step.tool}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 rounded-2xl bg-white p-4 text-slate-950">
                <p className="text-xs font-bold">El plan no reemplaza tus apuntes.</p>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Es una estructura para decidir qué hacer con tu material y cuándo volver a practicar el parcial.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-100 bg-white py-12 sm:py-16">
        <div className="mx-auto w-full max-w-[1120px] px-4 sm:px-8 lg:px-10">
          <div className="grid min-w-0 gap-4 md:grid-cols-3">
            <Link
              href={parcial1Href}
              className="min-w-0 rounded-[22px] border border-slate-200 bg-white p-5 transition hover:border-indigo-200 hover:shadow-sm"
            >
              <p className="text-xs font-black text-indigo-700">PARCIAL 1</p>
              <p className="mt-2 break-words text-sm font-bold text-slate-950">Ver el otro parcial de {materiaNombre}</p>
            </Link>
            <Link
              href={integradorHref}
              className="min-w-0 rounded-[22px] border border-slate-200 bg-white p-5 transition hover:border-indigo-200 hover:shadow-sm"
            >
              <p className="text-xs font-black text-indigo-700">INTEGRADOR</p>
              <p className="mt-2 break-words text-sm font-bold text-slate-950">Practicar el integrador</p>
            </Link>
            <Link
              href={resumenHref}
              className="min-w-0 rounded-[22px] border border-slate-200 bg-white p-5 transition hover:border-indigo-200 hover:shadow-sm"
            >
              <p className="text-xs font-black text-indigo-700">MATERIAL</p>
              <p className="mt-2 break-words text-sm font-bold text-slate-950">Ver resúmenes de la materia</p>
            </Link>
          </div>

          <div className="mt-8 flex min-w-0 flex-col gap-3 rounded-[24px] bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="min-w-0">
              <p className="break-words text-sm font-bold text-slate-950">Seguí con {materiaNombre}</p>
              <p className="mt-1 text-xs leading-5 text-slate-600">Volvé a la materia o al Preguntero completo cuando quieras cambiar de recorrido.</p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Link
                href={materiaHref}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 hover:border-indigo-200 hover:text-indigo-700 sm:w-auto"
              >
                <FileText className="h-4 w-4" aria-hidden="true" />
                Ir a la materia
              </Link>
              <Link
                href={pregunteroHref}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 hover:border-indigo-200 hover:text-indigo-700 sm:w-auto"
              >
                <ListChecks className="h-4 w-4" aria-hidden="true" />
                Preguntero completo
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
