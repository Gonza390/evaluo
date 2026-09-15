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

const EXPERIMENT = 'preguntero_sucesorio_p2_study_plan_v1';

type PlanTask = {
  title: string;
  description: string;
  minutes: number;
  icon: typeof FileText;
};

const PLAN_TASKS: PlanTask[] = [
  {
    title: 'Entender el material',
    description: 'Empezá por una lectura guiada y un resumen para ubicar las ideas centrales de tus apuntes.',
    minutes: 35,
    icon: FileText,
  },
  {
    title: 'Ordenar conceptos',
    description: 'Usá glosario y mapa mental para relacionar términos, institutos y temas del material.',
    minutes: 30,
    icon: Brain,
  },
  {
    title: 'Repasar activamente',
    description: 'Convertí los conceptos importantes en flashcards y recuperalos sin mirar la respuesta.',
    minutes: 30,
    icon: Layers3,
  },
  {
    title: 'Practicar con tu material',
    description: 'Hacé ejercicios sobre el contenido que subiste para comprobar qué entendiste y qué falta reforzar.',
    minutes: 35,
    icon: BookOpenCheck,
  },
  {
    title: 'Volver al Preguntero',
    description: 'Respondé preguntas del Parcial 2 de Derecho Sucesorio y marcá los temas que todavía te cuestan.',
    minutes: 40,
    icon: ListChecks,
  },
  {
    title: 'Simular el parcial',
    description: 'Hacé un intento completo, revisá errores y priorizá solo lo que todavía necesita trabajo.',
    minutes: 45,
    icon: Target,
  },
  {
    title: 'Repaso final',
    description: 'Volvé a flashcards, errores y conceptos débiles. Evitá empezar temas nuevos a último momento.',
    minutes: 30,
    icon: Sparkles,
  },
];

function getDaysUntil(examDate: string) {
  if (!examDate) return 5;

  const target = new Date(`${examDate}T12:00:00`);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
  const diff = Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
  return Math.max(1, diff);
}

function formatPlanDate(index: number) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + index);
  return new Intl.DateTimeFormat('es-AR', { weekday: 'short', day: 'numeric', month: 'short' }).format(date);
}

export function PregunteroSucesorioStudyPlan({ materiaId }: { materiaId: string }) {
  const [examDate, setExamDate] = useState('');
  const [dailyMinutes, setDailyMinutes] = useState(60);

  const daysAvailable = Math.min(getDaysUntil(examDate), PLAN_TASKS.length);

  const plan = useMemo(() => {
    const groups = Array.from({ length: daysAvailable }, () => [] as PlanTask[]);

    PLAN_TASKS.forEach((task, index) => {
      const bucket = Math.min(
        daysAvailable - 1,
        Math.floor((index * daysAvailable) / PLAN_TASKS.length)
      );
      groups[bucket].push(task);
    });

    return groups.map((tasks, index) => ({
      day: index + 1,
      dateLabel: formatPlanDate(index),
      tasks,
      minutes: Math.min(
        dailyMinutes,
        tasks.reduce((total, task) => total + task.minutes, 0)
      ),
    }));
  }, [dailyMinutes, daysAvailable]);

  const uploadParams = new URLSearchParams({
    materiaId,
    source: 'preguntero-derecho-sucesorio-p2',
    dailyMinutes: String(dailyMinutes),
  });
  if (examDate) uploadParams.set('examDate', examDate);
  const uploadHref = `/dashboard/materiales/subir?${uploadParams.toString()}`;

  return (
    <section
      className="mt-6 overflow-hidden rounded-[28px] border border-indigo-100 bg-[linear-gradient(145deg,#ffffff_0%,#f8faff_55%,#eef2ff_100%)] shadow-[0_18px_50px_rgba(79,70,229,0.08)]"
      data-experiment={EXPERIMENT}
    >
      <div className="border-b border-indigo-100/80 px-5 py-6 sm:px-7">
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-black tracking-[0.14em] text-indigo-700 uppercase">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          Prepará este parcial con tus apuntes
        </div>
        <h2 className="mt-3 max-w-2xl text-2xl font-bold tracking-[-0.045em] text-slate-950 sm:text-3xl">
          Armá un plan de estudio para Derecho Sucesorio · Parcial 2
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
          Decinos cuándo rendís y cuánto tiempo tenés por día. Te mostramos un plan base y, en el siguiente paso, podés subir tu PDF para usar tu propio material en cada etapa.
        </p>
      </div>

      <div className="grid gap-0 lg:grid-cols-[0.78fr_1.22fr]">
        <div className="border-b border-indigo-100/70 p-5 sm:p-7 lg:border-r lg:border-b-0">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <label className="text-xs font-bold text-slate-700">
              <span className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-indigo-600" aria-hidden="true" />
                ¿Cuándo rendís?
              </span>
              <input
                type="date"
                value={examDate}
                onChange={(event) => setExamDate(event.target.value)}
                className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </label>

            <label className="text-xs font-bold text-slate-700">
              <span className="flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-indigo-600" aria-hidden="true" />
                Tiempo disponible por día
              </span>
              <select
                value={dailyMinutes}
                onChange={(event) => setDailyMinutes(Number(event.target.value))}
                className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              >
                <option value={30}>30 minutos</option>
                <option value={45}>45 minutos</option>
                <option value={60}>1 hora</option>
                <option value={90}>1 hora y media</option>
              </select>
            </label>
          </div>

          <div className="mt-5 rounded-2xl border border-dashed border-indigo-200 bg-white/80 p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                <UploadCloud className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-bold text-slate-950">Después subís tus apuntes</p>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  El PDF queda asociado a Derecho Sucesorio para que puedas resumir, organizar, repasar y practicar sobre la misma fuente.
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
            className="from-brand to-brand-2 mt-5 inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r px-5 py-3.5 text-sm font-bold text-white shadow-[0_14px_30px_rgba(37,99,235,0.24)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            <UploadCloud className="h-4.5 w-4.5" aria-hidden="true" />
            Subir mis apuntes y empezar
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </TrackedLink>

          <p className="mt-3 text-center text-[11px] leading-5 text-slate-500">
            Si todavía no tenés cuenta, te pedimos registrarte antes de subir el archivo.
          </p>
        </div>

        <div className="p-5 sm:p-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black tracking-[0.13em] text-indigo-700 uppercase">Tu plan base</p>
              <p className="mt-1 text-sm font-bold text-slate-950">
                {daysAvailable} {daysAvailable === 1 ? 'día' : 'días'} · hasta {dailyMinutes} min por día
              </p>
            </div>
            <span className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-[10px] font-bold text-indigo-700">
              Parcial 2
            </span>
          </div>

          <div className="mt-5 space-y-3">
            {plan.map((item) => (
              <article key={item.day} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                <div className="flex items-start gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-xs font-black text-white">
                    {item.day}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-bold text-slate-950">Día {item.day} · {item.dateLabel}</p>
                      <span className="text-[10px] font-bold text-slate-500">≈ {item.minutes} min</span>
                    </div>
                    <div className="mt-3 space-y-3">
                      {item.tasks.map((task) => {
                        const Icon = task.icon;
                        return (
                          <div key={task.title} className="grid grid-cols-[24px_minmax(0,1fr)] gap-2.5">
                            <Icon className="mt-0.5 h-4 w-4 text-indigo-600" aria-hidden="true" />
                            <div>
                              <p className="text-xs font-bold text-slate-800">{task.title}</p>
                              <p className="mt-0.5 text-[11px] leading-5 text-slate-500">{task.description}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <p className="mt-4 text-[11px] leading-5 text-slate-500">
            Este es un plan inicial basado en tu fecha y disponibilidad. Tus apuntes siguen siendo la fuente de estudio; no reemplaza el programa oficial de la materia.
          </p>
        </div>
      </div>
    </section>
  );
}
