'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, CalendarDays, Check, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { saveStudentMaterialExamDateAction } from '@/app/dashboard/materiales/exam-date-prompt-actions';
import { trackMarketingEvent } from '@/lib/marketing-analytics';
import type { HomeView } from '@/lib/dashboard-home-model';

type Agenda = HomeView['agenda'];

type Locale = 'es' | 'en';

const WEEKDAYS: Record<Locale, string[]> = {
  es: ['L', 'M', 'M', 'J', 'V', 'S', 'D'],
  en: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
};

function monthLabel(year: number, month: number, locale: Locale) {
  const text = new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'es-AR', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(Date.UTC(year, month, 1)))
    .replace(' de ', ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const TEXT = {
  es: {
    prevMonth: 'Mes anterior', nextMonth: 'Mes siguiente', today: 'hoy', day: 'día', days: 'días', todayExam: 'Hoy',
    examOf: (t: string) => `Examen de ${t}`, when: (t: string) => `¿Cuándo rendís ${t}?`, cancel: 'Cancelar',
    addDate: 'Agregar fecha', close: 'Cerrar', agenda: 'Agenda', tabToday: 'Hoy', tabExams: 'Exámenes', done: 'Hecha:',
    planTitle: 'Armá tu plan hasta el examen', planText: 'Te decimos qué estudiar cada día para llegar listo. Te lleva 2 minutos.',
    planCta: 'Armar mi plan', noExams: 'Todavía no cargaste fechas de examen.',
    more: (n: number) => `Ver ${n} más en tu plan`,
  },
  en: {
    prevMonth: 'Previous month', nextMonth: 'Next month', today: 'today', day: 'day', days: 'days', todayExam: 'Today',
    examOf: (t: string) => `${t} exam`, when: (t: string) => `When is your ${t} exam?`, cancel: 'Cancel',
    addDate: 'Add date', close: 'Close', agenda: 'Agenda', tabToday: 'Today', tabExams: 'Exams', done: 'Done:',
    planTitle: 'Build your plan until the exam', planText: 'We tell you what to study each day so you get there ready. It takes 2 minutes.',
    planCta: 'Build my plan', noExams: 'You haven’t added any exam dates yet.',
    more: (n: number) => `See ${n} more in your plan`,
  },
};

const pad = (n: number) => String(n).padStart(2, '0');

function formatLong(dateKey: string, locale: Locale) {
  const date = new Date(`${dateKey}T12:00:00`);
  const text = new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'es-AR', { weekday: 'long', day: 'numeric', month: 'long' }).format(date);
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatShort(dateKey: string, locale: Locale) {
  const date = new Date(`${dateKey}T12:00:00`);
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'es-AR', { weekday: 'short', day: 'numeric', month: 'short' }).format(date).replace(/\./g, '');
}

function MonthCalendar({ today, onPick, disabled, locale }: { today: string; onPick: (dateKey: string) => void; disabled: boolean; locale: Locale }) {
  const t = TEXT[locale];
  const [view, setView] = useState(() => ({ year: +today.slice(0, 4), month: +today.slice(5, 7) - 1 }));
  const cells = useMemo(() => {
    const first = new Date(Date.UTC(view.year, view.month, 1));
    const offset = (first.getUTCDay() + 6) % 7; // lunes primero
    const days = new Date(Date.UTC(view.year, view.month + 1, 0)).getUTCDate();
    const list: Array<{ key: string; n: number } | null> = Array.from({ length: offset }, () => null);
    for (let n = 1; n <= days; n++) list.push({ key: `${view.year}-${pad(view.month + 1)}-${pad(n)}`, n });
    return list;
  }, [view]);
  const isCurrentMonth = view.year === +today.slice(0, 4) && view.month === +today.slice(5, 7) - 1;
  const move = (delta: number) =>
    setView(({ year, month }) => {
      const next = month + delta;
      return { year: year + Math.floor(next / 12), month: ((next % 12) + 12) % 12 };
    });

  return (
    <div>
      <div className="flex items-center justify-between">
        <button type="button" aria-label={t.prevMonth} disabled={isCurrentMonth} onClick={() => move(-1)}
          className="inline-flex size-10 items-center justify-center rounded-full text-slate-600 hover:bg-slate-50 disabled:text-slate-300 disabled:hover:bg-transparent">
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>
        <span className="text-ui font-semibold text-slate-950">{monthLabel(view.year, view.month, locale)}</span>
        <button type="button" aria-label={t.nextMonth} onClick={() => move(1)}
          className="inline-flex size-10 items-center justify-center rounded-full text-slate-600 hover:bg-slate-50">
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </div>
      <div className="mt-1 grid grid-cols-7 text-center text-etiqueta font-semibold text-slate-400" aria-hidden="true">
        {WEEKDAYS[locale].map((day, index) => <span key={index}>{day}</span>)}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-0.5">
        {cells.map((cell, index) => {
          if (!cell) return <span key={`b${index}`} className="h-10" />;
          if (cell.key < today) {
            return <span key={cell.key} className="flex h-10 items-center justify-center text-ui text-slate-300">{cell.n}</span>;
          }
          if (cell.key === today) {
            return (
              <span key={cell.key} className="flex h-10 flex-col items-center justify-center text-ui leading-tight font-semibold text-blue-700">
                {cell.n}
                <span className="text-[9px] font-medium text-slate-400">{t.today}</span>
              </span>
            );
          }
          return (
            <button key={cell.key} type="button" disabled={disabled} onClick={() => onPick(cell.key)}
              aria-label={formatLong(cell.key, locale)}
              className="h-10 rounded-xl text-ui font-medium text-slate-950 transition-colors hover:bg-blue-50 hover:text-blue-800 disabled:opacity-50">
              {cell.n}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ExamRow({ daysLeft, title, date, compact = false, locale }: { daysLeft: number; title: string; date: string; compact?: boolean; locale: Locale }) {
  const t = TEXT[locale];
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-10 shrink-0 flex-col items-center justify-center rounded-[10px] bg-amber-50 leading-none ring-1 ring-amber-100">
        {daysLeft === 0 ? (
          <span className="text-chico font-bold text-amber-900">{t.todayExam}</span>
        ) : (
          <>
            <span className="text-ui font-bold text-amber-900">{daysLeft}</span>
            <span className="mt-0.5 text-[10px] text-amber-700">{daysLeft === 1 ? t.day : t.days}</span>
          </>
        )}
      </span>
      <span className="min-w-0">
        <span className={`block truncate font-semibold text-slate-950 ${compact ? 'text-ui' : 'text-ui'}`}>{t.examOf(title)}</span>
        <span className="mt-0.5 block text-chico text-slate-400">{formatLong(date, locale)}</span>
      </span>
    </div>
  );
}

export function HomeAgenda({ agenda, today, locale = 'es' }: { agenda: Agenda; today: string; locale?: Locale }) {
  const t = TEXT[locale];
  const router = useRouter();
  const [tab, setTab] = useState<'hoy' | 'examenes'>('hoy');
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Ocultar la pregunta del material apenas se confirma la fecha, sin esperar router.refresh().
  const [savedExamMaterialId, setSavedExamMaterialId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const pick = (dateKey: string) => {
    if (!agenda.askDate) return;
    const materialId = agenda.askDate.materialId;
    setError(null);
    startTransition(async () => {
      const result = await saveStudentMaterialExamDateAction({ materialId, examDate: dateKey, locale });
      if (!result.success) {
        setError(result.message);
        return;
      }
      setSavedExamMaterialId(materialId);
      trackMarketingEvent('exam_date_selected', { location: 'dashboard_agenda', material_id: materialId });
      // En la misma transición: el calendario se cierra recién cuando llegan los datos nuevos,
      // sin mostrar "Agregar fecha" un instante.
      startTransition(() => {
        router.refresh();
        setPicking(false);
      });
    });
  };

  // Hoy muestra como máximo 2 tareas (primero las pendientes); el resto queda en el plan.
  const MAX_TASKS = 2;
  const orderedTasks = [...agenda.tasks.filter((task) => !task.done), ...agenda.tasks.filter((task) => task.done)];
  const visibleTasks = orderedTasks.slice(0, MAX_TASKS);
  const hiddenTasks = orderedTasks.length - visibleTasks.length;

  const tabClass = (active: boolean) =>
    `h-8 rounded-full text-ui font-medium transition-colors ${active ? 'bg-slate-100 text-slate-950' : 'text-slate-500 hover:text-slate-800'}`;

  const askRow = agenda.askDate && agenda.askDate.materialId !== savedExamMaterialId ? (
    <div className="mt-2.5 border-t border-slate-100 pt-3">
      <div className="flex items-center justify-between gap-2.5">
        <span className="text-ui text-slate-600">{t.when(agenda.askDate.materialTitle)}</span>
        {picking ? (
          <button type="button" onClick={() => setPicking(false)} className="hidden h-9 shrink-0 px-1 text-ui font-medium text-slate-500 lg:inline-flex lg:items-center">
            {t.cancel}
          </button>
        ) : (
          <button type="button" onClick={() => setPicking(true)} className="h-9 shrink-0 px-1 text-ui font-semibold text-blue-700 hover:text-blue-800">
            {t.addDate}
          </button>
        )}
      </div>
      {error ? <div role="alert" className="mt-2 text-chico text-red-700">{error}</div> : null}
      {picking ? (
        <>
          {/* Escritorio: calendario dentro de la Agenda. */}
          <div className="evaluo-enter mt-2 hidden rounded-[18px] border border-slate-200 bg-white p-3.5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] lg:block">
            <MonthCalendar today={today} onPick={pick} disabled={pending} locale={locale} />
          </div>
          {/* Teléfono y tablet: hoja inferior. */}
          <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label={t.when(agenda.askDate.materialTitle)}>
            <button type="button" aria-label={t.close} className="absolute inset-0 bg-slate-950/40" onClick={() => setPicking(false)} />
            <div className="evaluo-enter pb-safe absolute inset-x-0 bottom-0 rounded-t-3xl bg-white px-4 pt-2.5 pb-6 shadow-[0_-10px_30px_rgba(15,23,42,0.12)]">
              <div className="mx-auto mb-3.5 h-1 w-10 rounded-full bg-slate-200" />
              <div className="flex items-center justify-between">
                <h2 className="text-subtitulo font-semibold tracking-titulo text-slate-950">{t.when(agenda.askDate.materialTitle)}</h2>
                <button type="button" aria-label={t.close} onClick={() => setPicking(false)} className="-mr-2.5 inline-flex size-11 items-center justify-center text-slate-500">
                  <X className="size-[18px]" aria-hidden="true" />
                </button>
              </div>
              {error ? <div role="alert" className="mt-1 text-chico text-red-700">{error}</div> : null}
              <div className="mt-1.5">
                <MonthCalendar today={today} onPick={pick} disabled={pending} locale={locale} />
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  ) : null;

  return (
    <section aria-labelledby="home-agenda-title">
      <div className="flex items-center justify-between">
        <h2 id="home-agenda-title" className="flex items-center gap-2 text-subtitulo font-semibold tracking-titulo text-slate-950">
          <CalendarDays className="size-[17px]" aria-hidden="true" />
          {t.agenda}
        </h2>
        <Link href="/calendario" className="text-chico text-slate-500 hover:text-slate-700">{formatShort(today, locale)}</Link>
      </div>

      <div role="tablist" aria-label={t.agenda} className="mt-3 grid grid-cols-2 gap-1 rounded-full border border-slate-200 bg-white p-1">
        <button type="button" role="tab" aria-selected={tab === 'hoy'} onClick={() => setTab('hoy')} className={tabClass(tab === 'hoy')}>
          {t.tabToday} <span className="font-normal text-slate-400">{agenda.tasks.length}</span>
        </button>
        <button type="button" role="tab" aria-selected={tab === 'examenes'} onClick={() => setTab('examenes')} className={tabClass(tab === 'examenes')}>
          {t.tabExams} <span className="font-normal text-slate-400">{agenda.exams.length}</span>
        </button>
      </div>

      {/* Las dos pestañas ocupan la misma celda: el bloque toma el alto de la más alta
          y cambiar de pestaña no mueve lo que está debajo (Descubrí). */}
      <div className="grid">
        <div
          key={tab === 'hoy' ? 'hoy-activa' : 'hoy'}
          role="tabpanel"
          aria-hidden={tab !== 'hoy'}
          inert={tab !== 'hoy'}
          className={`[grid-area:1/1] ${tab === 'hoy' ? 'evaluo-enter' : 'invisible'}`}
        >
          <ul className="mt-3 space-y-1.5">
            {visibleTasks.map((task) => (
              <li key={task.id}>
                <Link
                  href={task.href}
                  className="group flex items-center gap-2.5 px-1 py-2 transition-colors"
                >
                  <span
                    className={`relative flex size-8 shrink-0 items-center justify-center rounded-[9px] ${
                      task.done ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {task.done ? (
                      <>
                        <Check className="size-4" strokeWidth={2.75} aria-hidden="true" />
                        <span className="sr-only">{t.done}</span>
                      </>
                    ) : (
                      <BookOpen className="size-4" aria-hidden="true" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={`line-clamp-2 text-ui leading-snug font-medium ${
                        task.done ? 'text-slate-400 line-through' : 'text-slate-900 group-hover:text-blue-800'
                      }`}
                    >
                      {task.title}
                    </span>
                    <span
                      className={`mt-1 block text-[11px] font-medium ${
                        task.done ? 'text-slate-400' : 'text-blue-700'
                      }`}
                    >
                      {task.meta}
                    </span>
                  </span>
                  {task.done ? null : (
                    <ChevronRight className="size-4 shrink-0 text-blue-300 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-500" aria-hidden="true" />
                  )}
                </Link>
              </li>
            ))}
          </ul>
          {hiddenTasks > 0 ? (
            <Link href="/dashboard/plan-de-estudio" className="mt-1 inline-flex min-h-8 items-center px-1 text-chico font-semibold text-blue-700 hover:text-blue-800">
              {t.more(hiddenTasks)}
            </Link>
          ) : null}
          {tab === 'hoy' ? askRow : null}
          {agenda.exam ? (
            <Link href="/calendario" className="mt-2.5 block border-t border-slate-100 pt-3">
              <ExamRow daysLeft={agenda.exam.daysLeft} title={agenda.exam.materialTitle} date={agenda.exam.date} compact locale={locale} />
            </Link>
          ) : null}
          {agenda.planCta ? (
            <div className="mt-3 rounded-xl bg-slate-100/80 px-3.5 py-3">
              <div className="text-ui font-semibold text-slate-950">{t.planTitle}</div>
              <div className="mt-1 text-chico leading-[1.45] text-slate-500">{t.planText}</div>
              <Link href={agenda.planCta.href} className="mt-2.5 inline-flex h-10 w-full items-center justify-center rounded-[10px] bg-[#4070be] px-3.5 text-chico font-semibold text-white hover:bg-[#3361ac] lg:h-8 lg:w-auto">
                {t.planCta}
              </Link>
            </div>
          ) : null}
        </div>
        <div
          key={tab === 'examenes' ? 'examenes-activa' : 'examenes'}
          role="tabpanel"
          aria-hidden={tab !== 'examenes'}
          inert={tab !== 'examenes'}
          className={`[grid-area:1/1] ${tab === 'examenes' ? 'evaluo-enter' : 'invisible'}`}
        >
          {agenda.exams.length > 0 ? (
            <ul className="mt-3 space-y-2.5">
              {agenda.exams.map((exam) => (
                <li key={exam.materialId}>
                  <Link href={`/materiales/${exam.materialId}`}>
                    <ExamRow daysLeft={exam.daysLeft} title={exam.title} date={exam.examDate} locale={locale} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-3 text-ui text-slate-500">{t.noExams}</div>
          )}
          {tab === 'examenes' ? askRow : null}
        </div>
      </div>
    </section>
  );
}
