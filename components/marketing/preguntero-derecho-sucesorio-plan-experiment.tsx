'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
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
import { trackMarketingEvent } from '@/lib/marketing-analytics';

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
  label: string;
  totalPreguntas: number;
  samplePreguntas: SampleQuestion[];
  simuladorHref: string;
  pregunteroHref: string;
  materiaHref: string;
  resumenHref: string;
};

const EXPERIMENT = 'preguntero_derecho_sucesorio_p2_plan_v1';
const uploadHref = '/login?mode=signup&next=%2Fdashboard%3FopenUpload%3D1';

const PLAN_STEPS = [
  {
    title: 'Entendé el material',
    description: 'Empezá por una lectura guiada y un resumen para ubicar las ideas centrales.',
    icon: BookOpen,
  },
  {
    title: 'Conectá los conceptos',
    description: 'Usá glosario y mapa mental para ordenar relaciones antes de memorizar.',
    icon: Brain,
  },
  {
    title: 'Repasá activamente',
    description: 'Convertí conceptos del material en flashcards y recuperalos de memoria.',
    icon: Layers3,
  },
  {
    title: 'Practicá el parcial',
    description: 'Volvé al Preguntero y al simulador para comprobar qué temas necesitan refuerzo.',
    icon: Target,
  },
  {
    title: 'Cerrá con tus errores',
    description: 'Usá el último repaso para volver únicamente sobre lo que todavía falla.',
    icon: CheckCircle2,
  },
] as const;

function getPlanLength(examDate: string) {
  if (!examDate) return 5;

  const exam = new Date(`${examDate}T12:00:00`);
  const now = new Date();
  const diffDays = Math.ceil((exam.getTime() - now.getTime()) / 86_400_000);

  if (!Number.isFinite(diffDays)) return 5;
  return Math.min(7, Math.max(3, diffDays));
}

export function PregunteroDerechoSucesorioPlanExperiment({
  title,
  materiaNombre,
  universidadNombre,
  carreraNombre,
  label,
  totalPreguntas,
  samplePreguntas,
  simuladorHref,
  pregunteroHref,
  materiaHref,
  resumenHref,
}: Props) {
  const [material, setMaterial] = useState<File | null>(null);
  const [examDate, setExamDate] = useState('');
  const [dailyMinutes, setDailyMinutes] = useState('60');
  const [showPlan, setShowPlan] = useState(false);

  const plan = useMemo(() => {
    if (!showPlan) return [];
    const length = getPlanLength(examDate);
    const minutes = Number.parseInt(dailyMinutes, 10) || 60;

    return Array.from({ length }, (_, index) => {
      const step = PLAN_STEPS[index % PLAN_STEPS.length];
      return {
        ...step,
        day: index + 1,
        minutes,
      };
    });
  }, [dailyMinutes, examDate, showPlan]);

  const handleGeneratePlan = () => {
    if (!material || !examDate) return;

    setShowPlan(true);
    trackMarketingEvent('study_plan_preview_created', {
      experiment: EXPERIMENT,
      materia: materiaNombre,
      parcial: '2',
      daily_minutes: Number.parseInt(dailyMinutes, 10),
      has_material: true,
    });
  };

  return (
    <div className="w-full overflow-x-clip bg-white text-slate-950" data-experiment={EXPERIMENT}>
      <section className="border-b border-slate-100 bg-[radial-gradient(circle_at_85%_10%,rgba(99,102,241,0.12),transparent_28%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
        <div className="mx-auto w-full max-w-[1160px] px-4 py-9 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
          <div className="min-w-0">
            <Link
              href={pregunteroHref}
              className="inline-flex max-w-full items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-indigo-700"
            >
              <ListChecks className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="min-w-0 break-words">Preguntero de {materiaNombre}</span>
            </Link>

            <div className="mt-6 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-[11px] font-bold text-indigo-700">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                {label}
              </span>
              {universidadNombre ? (
                <span className="max-w-full rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 [overflow-wrap:anywhere]">
                  {universidadNombre}
                </span>
              ) : null}
            </div>

            <div className="mt-5 grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end lg:gap-12">
              <div className="min-w-0">
                <h1 className="max-w-[760px] text-3xl leading-[1.05] font-bold tracking-[-0.045em] text-slate-950 [overflow-wrap:anywhere] sm:text-5xl lg:text-[54px]">
                  {title}
                </h1>
                {carreraNombre ? (
                  <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-500 [overflow-wrap:anywhere]">
                    {carreraNombre}
                  </p>
                ) : null}
                <p className="mt-5 max-w-2xl text-[15px] leading-7 text-slate-600 sm:text-base sm:leading-8">
                  Usá las preguntas como punto de partida y prepará este parcial con tus propios apuntes.
                  La idea es que el Preguntero te muestre qué practicar y tu material te ayude a decidir qué estudiar primero.
                </p>
              </div>

              <div className="min-w-0 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.07)]">
                <p className="text-[10px] font-black tracking-[0.14em] text-indigo-700 uppercase">Tu objetivo</p>
                <p className="mt-2 text-base font-bold text-slate-950">Llegar al Parcial 2 con un recorrido claro.</p>
                <div className="mt-4 grid gap-2.5 text-xs text-slate-600">
                  <span className="flex min-w-0 items-start gap-2">
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" aria-hidden="true" />
                    <span className="min-w-0 break-words">Tus apuntes como fuente</span>
                  </span>
                  <span className="flex min-w-0 items-start gap-2">
                    <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" aria-hidden="true" />
                    <span className="min-w-0 break-words">Plan según tu fecha de examen</span>
                  </span>
                  <span className="flex min-w-0 items-start gap-2">
                    <Target className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" aria-hidden="true" />
                    <span className="min-w-0 break-words">Preguntas para comprobar avances</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1160px] px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
          <div className="min-w-0">
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <p className="text-[11px] font-black tracking-[0.14em] text-indigo-700 uppercase">Empezá por las preguntas</p>
                <h2 className="mt-2 text-2xl font-bold tracking-[-0.035em] text-slate-950 sm:text-3xl">
                  Mirá cómo viene el Parcial 2.
                </h2>
              </div>
              <span className="text-sm font-semibold text-slate-500">
                {totalPreguntas.toLocaleString('es-AR')} preguntas disponibles
              </span>
            </div>

            <div className="mt-6 grid min-w-0 gap-3">
              {samplePreguntas.slice(0, 3).map((question, index) => (
                <article
                  key={question.id}
                  className="min-w-0 rounded-[20px] border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-5"
                >
                  <div className="flex min-w-0 gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-[11px] font-black text-indigo-700">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-6 font-semibold text-slate-900 [overflow-wrap:anywhere] sm:text-[15px]">
                        {question.enunciado}
                      </p>
                      <p className="mt-2 text-xs font-semibold text-slate-400">
                        {question.opcionesCount} opciones
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="min-w-0 rounded-[22px] border border-slate-200 bg-slate-50/70 p-5 lg:sticky lg:top-24">
            <p className="text-xs font-black text-slate-500 uppercase">¿Querés medir cómo venís?</p>
            <p className="mt-2 text-sm leading-6 font-semibold text-slate-800">
              Hacé el simulador completo y usá el resultado para decidir qué reforzar en tu plan.
            </p>
            <TrackedLink
              href={simuladorHref}
              eventName="cta_click"
              payload={{
                experiment: EXPERIMENT,
                location: 'derecho_sucesorio_p2_questions',
                cta_name: 'practicar_parcial_2',
                materia: materiaNombre,
                parcial: '2',
                destination: simuladorHref,
              }}
              className="from-brand to-brand-2 mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r px-4 text-center text-sm font-bold text-white shadow-[0_12px_28px_rgba(37,99,235,0.22)]"
            >
              Practicar Parcial 2
              <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
            </TrackedLink>
          </aside>
        </div>
      </section>

      <section id="plan-estudio" className="border-y border-slate-100 bg-slate-50/60 py-12 sm:py-16">
        <div className="mx-auto w-full max-w-[1160px] px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-[11px] font-black tracking-[0.14em] text-indigo-700 uppercase">Tu material + tu fecha</p>
            <h2 className="mt-3 text-3xl font-bold tracking-[-0.045em] text-slate-950 sm:text-4xl">
              Armá un plan de estudio para este parcial.
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
              En esta prueba, el archivo se selecciona en tu navegador para construir la experiencia visual del plan. El flujo real de Evaluo continúa después con la carga del material en tu cuenta.
            </p>
          </div>

          <div className="mt-8 grid min-w-0 gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
            <div className="min-w-0 rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:p-7">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
                  <UploadCloud className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-slate-950">1. Elegí tus apuntes</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500">PDF, Word o texto. En esta preview no se envía el archivo.</p>
                </div>
              </div>

              <label
                htmlFor="derecho-sucesorio-material"
                className="mt-5 flex min-h-32 w-full cursor-pointer flex-col items-center justify-center rounded-[20px] border-2 border-dashed border-indigo-200 bg-indigo-50/40 px-4 py-6 text-center transition hover:border-indigo-300 hover:bg-indigo-50/70"
              >
                <FileText className="h-6 w-6 text-indigo-600" aria-hidden="true" />
                <span className="mt-3 max-w-full text-sm font-bold text-slate-900 [overflow-wrap:anywhere]">
                  {material ? material.name : 'Elegir material de Derecho Sucesorio'}
                </span>
                <span className="mt-1 text-xs text-slate-500">
                  {material ? 'Archivo seleccionado' : 'Tocá para buscar un archivo'}
                </span>
              </label>
              <input
                id="derecho-sucesorio-material"
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setMaterial(file);
                  setShowPlan(false);
                  if (file) {
                    trackMarketingEvent('study_plan_material_selected', {
                      experiment: EXPERIMENT,
                      materia: materiaNombre,
                      parcial: '2',
                      file_type: file.type || 'unknown',
                    });
                  }
                }}
              />

              <div className="mt-7 grid min-w-0 gap-4 sm:grid-cols-2">
                <div className="min-w-0">
                  <label htmlFor="derecho-sucesorio-date" className="text-xs font-bold text-slate-700">
                    2. ¿Cuándo rendís?
                  </label>
                  <div className="relative mt-2">
                    <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                    <input
                      id="derecho-sucesorio-date"
                      type="date"
                      value={examDate}
                      onChange={(event) => {
                        setExamDate(event.target.value);
                        setShowPlan(false);
                      }}
                      className="h-12 w-full min-w-0 rounded-2xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                </div>

                <div className="min-w-0">
                  <label htmlFor="derecho-sucesorio-minutes" className="text-xs font-bold text-slate-700">
                    3. Tiempo por día
                  </label>
                  <div className="relative mt-2">
                    <Clock3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                    <select
                      id="derecho-sucesorio-minutes"
                      value={dailyMinutes}
                      onChange={(event) => {
                        setDailyMinutes(event.target.value);
                        setShowPlan(false);
                      }}
                      className="h-12 w-full min-w-0 appearance-none rounded-2xl border border-slate-200 bg-white pl-10 pr-8 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    >
                      <option value="30">30 minutos</option>
                      <option value="45">45 minutos</option>
                      <option value="60">1 hora</option>
                      <option value="90">1 h 30 min</option>
                      <option value="120">2 horas</option>
                    </select>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGeneratePlan}
                disabled={!material || !examDate}
                className="from-brand to-brand-2 mt-6 inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r px-5 text-sm font-bold text-white shadow-[0_14px_30px_rgba(37,99,235,0.22)] transition enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Sparkles className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
                Ver mi plan de estudio
              </button>
            </div>

            <div className="min-w-0 rounded-[26px] border border-slate-200 bg-slate-950 p-5 text-white shadow-[0_24px_60px_rgba(15,23,42,0.14)] sm:p-7">
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[10px] font-black tracking-[0.14em] text-indigo-300 uppercase">Vista previa</p>
                  <h3 className="mt-2 text-xl font-bold tracking-[-0.03em] [overflow-wrap:anywhere]">Tu plan para Derecho Sucesorio</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-400">Parcial 2 · {dailyMinutes} min por día</p>
                </div>
                <span className="w-fit rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-bold text-slate-200">
                  {showPlan ? `${plan.length} días` : 'Completá los datos'}
                </span>
              </div>

              {showPlan ? (
                <div className="mt-6 grid min-w-0 gap-3">
                  {plan.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.day} className="grid min-w-0 grid-cols-[38px_minmax(0,1fr)] gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-400/15 text-[10px] font-black text-indigo-200">
                          {String(item.day).padStart(2, '0')}
                        </span>
                        <div className="min-w-0">
                          <div className="flex min-w-0 items-center gap-2">
                            <Icon className="h-4 w-4 shrink-0 text-indigo-300" aria-hidden="true" />
                            <p className="min-w-0 text-sm font-bold text-white [overflow-wrap:anywhere]">{item.title}</p>
                          </div>
                          <p className="mt-1.5 text-xs leading-5 text-slate-300 [overflow-wrap:anywhere]">{item.description}</p>
                          <p className="mt-2 text-[10px] font-bold text-slate-500">Hasta {item.minutes} min</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-6 grid gap-3">
                  {['Entender', 'Conectar', 'Recordar', 'Practicar'].map((item, index) => (
                    <div key={item} className="flex min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/5 text-[10px] font-black text-slate-500">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="h-2.5 w-24 max-w-full rounded-full bg-white/10" />
                        <div className="mt-2 h-2 w-full max-w-[260px] rounded-full bg-white/[0.06]" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {showPlan ? (
                <TrackedLink
                  href={uploadHref}
                  eventName="cta_click"
                  payload={{
                    experiment: EXPERIMENT,
                    location: 'derecho_sucesorio_p2_plan',
                    cta_name: 'continuar_con_material',
                    materia: materiaNombre,
                    parcial: '2',
                    destination: uploadHref,
                  }}
                  className="mt-6 inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 text-center text-sm font-bold text-slate-950 transition hover:bg-slate-100"
                >
                  Continuar con mi material en Evaluo
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                </TrackedLink>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1160px] px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="grid min-w-0 gap-4 md:grid-cols-3">
          <Link href={pregunteroHref} className="min-w-0 rounded-[20px] border border-slate-200 p-5 transition hover:border-indigo-200 hover:bg-indigo-50/30">
            <ListChecks className="h-5 w-5 text-indigo-600" aria-hidden="true" />
            <p className="mt-3 text-sm font-bold text-slate-950">Ver el Preguntero completo</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">Seguí explorando preguntas de {materiaNombre}.</p>
          </Link>
          <Link href={materiaHref} className="min-w-0 rounded-[20px] border border-slate-200 p-5 transition hover:border-indigo-200 hover:bg-indigo-50/30">
            <BookOpen className="h-5 w-5 text-indigo-600" aria-hidden="true" />
            <p className="mt-3 text-sm font-bold text-slate-950">Volver a la materia</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">Entrá al contexto completo de Derecho Sucesorio.</p>
          </Link>
          <Link href={resumenHref} className="min-w-0 rounded-[20px] border border-slate-200 p-5 transition hover:border-indigo-200 hover:bg-indigo-50/30">
            <FileText className="h-5 w-5 text-indigo-600" aria-hidden="true" />
            <p className="mt-3 text-sm font-bold text-slate-950">Ver resúmenes</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">Revisá materiales disponibles antes de seguir practicando.</p>
          </Link>
        </div>
      </section>
    </div>
  );
}
