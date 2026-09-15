'use client';

import { useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpenCheck,
  Brain,
  CalendarDays,
  Clock3,
  FileText,
  Layers3,
  ListChecks,
  Sparkles,
  Target,
  UploadCloud,
} from 'lucide-react';
import { TrackedLink } from '@/components/marketing/tracked-link';

const EXPERIMENT = 'preguntero_sucesorio_p2_study_plan_v2';

type PlanTask = {
  title: string;
  description: string;
  icon: typeof FileText;
};

const PLAN_TASKS: PlanTask[] = [
  {
    title: 'Entender el material',
    description: 'Resumen y lectura guiada para ubicar las ideas centrales de tus apuntes.',
    icon: FileText,
  },
  {
    title: 'Ordenar conceptos',
    description: 'Glosario y mapa mental para conectar los temas antes de memorizar.',
    icon: Brain,
  },
  {
    title: 'Repasar activamente',
    description: 'Flashcards para recuperar conceptos sin mirar la respuesta.',
    icon: Layers3,
  },
  {
    title: 'Practicar con tu material',
    description: 'Ejercicios sobre el contenido que subiste para comprobar comprensión.',
    icon: BookOpenCheck,
  },
  {
    title: 'Volver al Preguntero',
    description: 'Preguntas del Parcial 2 para detectar qué temas todavía cuestan.',
    icon: ListChecks,
  },
  {
    title: 'Simular el parcial',
    description: 'Un intento completo para revisar errores y priorizar el último repaso.',
    icon: Target,
  },
] as const;

function getDaysUntil(examDate: string) {
  if (!examDate) return 5;

  const target = new Date(`${examDate}T12:00:00`);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
  const diff = Math.ceil((target.getTime() - today.getTime()) / 86_400_000);

  if (!Number.isFinite(diff)) return 5;
  return Math.min(6, Math.max(3, diff));
}

function formatPlanDate(index: number) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + index);
  return new Intl.DateTimeFormat('es-AR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(date);
}

export function PregunteroSucesorioStudyPlan({ materiaId }: { materiaId: string }) {
  const [examDate, setExamDate] = useState('');
  const [dailyMinutes, setDailyMinutes] = useState(60);

  const daysAvailable = getDaysUntil(examDate);

  const plan = useMemo(() => {
    return Array.from({ length: daysAvailable }, (_, index) => ({
      day: index + 1,
      dateLabel: formatPlanDate(index),
      task: PLAN_TASKS[index % PLAN_TASKS.length],
    }));
  }, [daysAvailable]);

  const uploadParams = new URLSearchParams({
    materiaId,
    source: 'preguntero-derecho-sucesorio-p2',
    dailyMinutes: String(dailyMinutes),
  });
  if (examDate) uploadParams.set('examDate', examDate);
  const uploadHref = `/dashboard/materiales/subir?${uploadParams.toString()}`;

  return (
    <section
      className="w-full min-w-0 overflow-hidden rounded-[26px] border border-indigo-100 bg-white shadow-[0_20px_55px_rgba(79,70,229,0.08)]"
      data-experiment={EXPERIMENT}
    >
      <div className="border-b border-indigo-100 bg-[linear-gradient(135deg,#ffffff_0%,#f5f7ff_100%)] px-4 py-6 sm:px-6 sm:py-7 lg:px-8">
        <div className="flex min-w-0 flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 max-w-3xl">
            <p className="inline-flex items-center gap-2 text-[10px] font-black tracking-[0.14em] text-indigo-700 uppercase">
              <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              Prepará este parcial con tus apuntes
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-[-0.04em] text-slate-950 [overflow-wrap:anywhere] sm:text-3xl lg:text-4xl">
              Armá tu plan para Derecho Sucesorio · Parcial 2
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              Elegí cuándo rendís y cuánto tiempo tenés. Después subís tus apuntes y seguís el recorrido con las herramientas de Evaluo y las preguntas del parcial.
            </p>
          </div>

          <div className="flex max-w-full flex-wrap gap-2 text-[11px] font-semibold text-slate-600">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-white px-3 py-1.5">
              <FileText className="h-3.5 w-3.5 shrink-0 text-indigo-600" aria-hidden="true" />
              Tus apuntes
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-white px-3 py-1.5">
              <Target className="h-3.5 w-3.5 shrink-0 text-indigo-600" aria-hidden="true" />
              Parcial 2
            </span>
          </div>
        </div>
      </div>

      <div className="grid min-w-0 gap-0 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
        <div className="min-w-0 border-b border-slate-200 p-4 sm:p-6 xl:border-r xl:border-b-0 lg:p-7">
          <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <label className="min-w-0 text-xs font-bold text-slate-700">
              <span className="flex min-w-0 items-center gap-2">
                <CalendarDays className="h-4 w-4 shrink-0 text-indigo-600" aria-hidden="true" />
                <span className="min-w-0 [overflow-wrap:anywhere]">¿Cuándo rendís?</span>
              </span>
              <input
                type="date"
                value={examDate}
                onChange={(event) => setExamDate(event.target.value)}
                className="mt-2 h-12 w-full min-w-0 max-w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </label>

            <label className="min-w-0 text-xs font-bold text-slate-700">
              <span className="flex min-w-0 items-center gap-2">
                <Clock3 className="h-4 w-4 shrink-0 text-indigo-600" aria-hidden="true" />
                <span className="min-w-0 [overflow-wrap:anywhere]">Tiempo disponible por día</span>
              </span>
              <select
                value={dailyMinutes}
                onChange={(event) => setDailyMinutes(Number(event.target.value))}
                className="mt-2 h-12 w-full min-w-0 max-w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              >
                <option value={30}>30 minutos</option>
                <option value={45}>45 minutos</option>
                <option value={60}>1 hora</option>
                <option value={90}>1 hora y media</option>
              </select>
            </label>
          </div>

          <div className="mt-5 min-w-0 rounded-[20px] border border-dashed border-indigo-200 bg-indigo-50/45 p-4 sm:p-5">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-700 shadow-sm ring-1 ring-indigo-100">
                <UploadCloud className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-950">El siguiente paso usa tu material real</p>
                <p className="mt-1 text-xs leading-5 text-slate-600 [overflow-wrap:anywhere]">
                  La materia queda preseleccionada y el PDF que subas se usa como fuente para resumen, glosario, mapa mental, flashcards y ejercicios.
                </p>
              </div>
            </div>
          </div>

          <TrackedLink
            href={uploadHref}
            eventName="preguntero_study_plan_cta_clicked"
            payload={{
              experiment: EXPERIMENT,
              materia: 'Derecho Sucesorio',
              parcial: '2',
              cta_name: 'subir_material_y_empezar_plan',
              location: 'study_plan_card',
              destination: uploadHref,
              daily_minutes: dailyMinutes,
              exam_date_selected: Boolean(examDate),
            }}
            className="from-brand to-brand-2 mt-5 inline-flex min-h-13 w-full max-w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r px-4 py-3.5 text-center text-sm font-bold text-white shadow-[0_14px_30px_rgba(37,99,235,0.24)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 sm:px-5"
          >
            <UploadCloud className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
            <span className="min-w-0 [overflow-wrap:anywhere]">Subir mis apuntes y empezar</span>
            <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
          </TrackedLink>

          <p className="mt-3 text-center text-[11px] leading-5 text-slate-500">
            Si no tenés cuenta, primero completás el registro y después volvés directo a la carga del material.
          </p>
        </div>

        <div className="min-w-0 bg-slate-950 p-4 text-white sm:p-6 lg:p-7">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-black tracking-[0.13em] text-indigo-300 uppercase">Tu plan base</p>
              <p className="mt-1 text-base font-bold text-white [overflow-wrap:anywhere]">
                {daysAvailable} días · hasta {dailyMinutes} min por día
              </p>
            </div>
            <span className="w-fit shrink-0 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[10px] font-bold text-slate-200">
              Vista previa
            </span>
          </div>

          <div className="mt-5 grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            {plan.map((item) => {
              const Icon = item.task.icon;
              return (
                <article
                  key={item.day}
                  className="min-w-0 rounded-[18px] border border-white/10 bg-white/[0.06] p-4"
                >
                  <div className="grid min-w-0 grid-cols-[34px_minmax(0,1fr)] gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-400/15 text-[10px] font-black text-indigo-200">
                      {String(item.day).padStart(2, '0')}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-slate-500 uppercase [overflow-wrap:anywhere]">
                        Día {item.day} · {item.dateLabel}
                      </p>
                      <div className="mt-2 flex min-w-0 items-start gap-2">
                        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-indigo-300" aria-hidden="true" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white [overflow-wrap:anywhere]">{item.task.title}</p>
                          <p className="mt-1 text-[11px] leading-5 text-slate-300 [overflow-wrap:anywhere]">
                            {item.task.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <p className="mt-4 max-w-2xl text-[11px] leading-5 text-slate-400">
            Esta vista organiza el recorrido por fecha y disponibilidad. Tus apuntes siguen siendo la fuente de estudio y el Preguntero sirve para comprobar avances.
          </p>
        </div>
      </div>
    </section>
  );
}
