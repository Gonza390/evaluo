'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  PlayCircle,
  Sparkles,
  Target,
} from 'lucide-react';
import { getStudyRecommendations } from '@/lib/actions/dashboard';
import type { StudyRecommendation } from '@/lib/actions/dashboard';
import { useUser } from '@/hooks/useUser';
import { supabase } from '@/lib/supabase-client';
import {
  addMonths,
  formatMonthLabel,
  formatStorageDate,
  getCalendarGrid,
  getMonthStart,
  type StudyCalendarEvent,
} from '@/lib/calendar-utils';
import { logError } from '@/lib/observability';

const WEEKDAY_SHORT_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

function CalendarMini() {
  const { user } = useUser();
  const [visibleMonth, setVisibleMonth] = useState<Date>(() => getMonthStart(new Date()));
  const [events, setEvents] = useState<StudyCalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!user) {
        if (active) {
          setEvents([]);
          setLoading(false);
        }
        return;
      }

      const monthStart = getMonthStart(visibleMonth);
      const monthEnd = addMonths(monthStart, 1);

      const { data, error } = await supabase
        .from('study_calendar_events')
        .select('id, event_type, title, event_date')
        .eq('user_id', user.id)
        .gte('event_date', formatStorageDate(monthStart))
        .lt('event_date', formatStorageDate(monthEnd));

      if (!active) return;

      if (error) {
        logError('studyPanel.calendarMini.loadEvents', error, { userId: user.id });
        setEvents([]);
        setLoading(false);
        return;
      }

      setEvents(
        (data ?? []).map((event) => ({
          id: event.id,
          type: event.event_type as StudyCalendarEvent['type'],
          title: event.title,
          date: event.event_date,
          notes: '',
          createdAt: '',
          materiaId: null,
          materiaNombre: null,
          carreraId: null,
          carreraNombre: null,
          examInstance: null,
          sourcePayload: null,
        }))
      );
      setLoading(false);
    }

    void load();
    return () => {
      active = false;
    };
  }, [user, visibleMonth]);

  const monthGrid = useMemo(() => getCalendarGrid(visibleMonth), [visibleMonth]);
  const todayKey = formatStorageDate(new Date());
  const eventsByDate = useMemo(() => {
    return events.reduce<Record<string, StudyCalendarEvent[]>>((accumulator, event) => {
      accumulator[event.date] ??= [];
      accumulator[event.date].push(event);
      return accumulator;
    }, {});
  }, [events]);

  return (
    <div className="border-border mt-4 min-w-0 border-t pt-3">
      <div className="flex items-center justify-between px-1">
        <p className="text-muted-foreground text-[12px] font-semibold">
          {formatMonthLabel(visibleMonth)}
        </p>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => setVisibleMonth((current) => addMonths(current, -1))}
            aria-label="Mes anterior"
            className="text-muted-foreground hover:text-foreground inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md p-2.5 transition hover:bg-white"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setVisibleMonth((current) => addMonths(current, 1))}
            aria-label="Mes siguiente"
            className="text-muted-foreground hover:text-foreground inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md p-2.5 transition hover:bg-white"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <Link
        href="/calendario"
        className="border-border hover:border-primary/30 hover:bg-primary/5 mt-2 block rounded-xl border p-2 transition"
        aria-label="Abrir el calendario"
      >
        <div className="grid grid-cols-7 gap-y-0.5 text-center">
          {WEEKDAY_SHORT_LABELS.map((label, index) => (
            <span
              key={`${label}-${index}`}
              className="text-muted-foreground pb-1 text-[11px] font-semibold"
            >
              {label}
            </span>
          ))}
          {loading
            ? Array.from({ length: 42 }).map((_, index) => (
                <span key={index} className="flex h-6 items-center justify-center">
                  <span className="h-4 w-4 animate-pulse rounded-md bg-white" />
                </span>
              ))
            : monthGrid.map((date, index) => {
                const dateKey = formatStorageDate(date);
                const isCurrentMonth = date.getMonth() === visibleMonth.getMonth();
                const isToday = dateKey === todayKey;
                const hasEvents = Boolean(eventsByDate[dateKey]?.length);

                return (
                  <span
                    key={`${dateKey}-${index}`}
                    className="relative flex h-6 items-center justify-center"
                  >
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-semibold ${
                        isToday
                          ? 'bg-primary text-primary-foreground'
                          : isCurrentMonth
                            ? hasEvents
                              ? 'bg-brand/10 text-brand'
                              : 'text-muted-foreground'
                            : 'text-muted-foreground/50'
                      }`}
                    >
                      {date.getDate()}
                    </span>
                    {hasEvents && isCurrentMonth ? (
                      <span className="bg-brand absolute mt-4 h-0.5 w-0.5 rounded-full" />
                    ) : null}
                  </span>
                );
              })}
        </div>
      </Link>
    </div>
  );
}

function formatEventDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short' }).format(date);
}

function daysLabel(days: number) {
  if (days <= 0) return 'Es hoy';
  if (days === 1) return 'Mañana';
  return `En ${days} días`;
}

function examLabel(instance: StudyRecommendation['examInstance']) {
  if (instance === '1') return 'Parcial 1';
  if (instance === '2') return 'Parcial 2';
  return 'Integrador';
}

export function StudyRecommendationsPanel() {
  const [recommendations, setRecommendations] = useState<StudyRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      const result = await getStudyRecommendations();
      if (active) {
        setRecommendations(result);
        setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="surface-card border-border bg-card/90 min-w-0 overflow-hidden rounded-[var(--radius-card)] backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-4 sm:px-5 sm:pt-5">
        <div className="flex items-center gap-2">
          <CalendarDays className="text-brand h-4 w-4" />
          <h3 className="text-foreground text-lg font-semibold sm:text-xl">Tu plan de estudio</h3>
        </div>
        <Link
          href="/calendario"
          className="text-brand hover:text-brand/80 text-xs font-semibold transition"
        >
          Calendario
        </Link>
      </div>
      <p className="text-muted-foreground mt-1 px-4 text-xs sm:px-5">
        Próximos parciales en tu calendario y qué te conviene practicar antes.
      </p>

      <div className="space-y-2.5 px-4 pt-4 pb-4 sm:px-5 sm:pb-5">
        {loading ? (
          <div className="space-y-2.5">
            {Array.from({ length: 2 }).map((_, index) => (
              <div
                key={index}
                className="border-border h-16 animate-pulse rounded-xl border bg-white"
              />
            ))}
          </div>
        ) : recommendations.length === 0 ? (
          <div className="border-border rounded-xl border border-dashed bg-white px-4 py-6 text-center">
            <CalendarDays className="text-muted-foreground mx-auto h-7 w-7" />
            <p className="text-muted-foreground mt-2 text-sm font-medium">
              No tenés parciales cargados en el calendario
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              Cargá la fecha de tus parciales y te decimos qué practicar.
            </p>
          </div>
        ) : (
          <>
            {recommendations.map((item) => {
              const needsAction = item.reason !== 'listo';
              return (
                <div
                  key={`${item.materiaId}-${item.examInstance}`}
                  className={`rounded-xl border p-3 ${
                    needsAction
                      ? 'border-primary/20 from-primary/10 to-card bg-gradient-to-r'
                      : 'border-border bg-card'
                  }`}
                >
                  <div className="flex min-w-0 flex-col items-stretch gap-3 min-[420px]:flex-row min-[420px]:items-start min-[420px]:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[12px] font-semibold ${
                            needsAction
                              ? 'border-brand/25 bg-brand/10 text-brand border'
                              : 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {daysLabel(item.daysUntil)}
                        </span>
                        <span className="text-muted-foreground rounded-full bg-white px-2 py-0.5 text-[12px] font-semibold">
                          {examLabel(item.examInstance)}
                        </span>
                      </div>
                      <p className="text-foreground mt-1.5 truncate text-sm font-semibold">
                        {item.materiaNombre}
                      </p>
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        {formatEventDate(item.examDate)}
                      </p>

                      {needsAction ? (
                        <p className="text-muted-foreground mt-2 text-[12px] leading-5">
                          {item.reason === 'falta-cobertura' ? (
                            <>
                              <Sparkles className="text-brand mr-1 inline h-3.5 w-3.5" />
                              Practicaste{' '}
                              <strong>
                                {item.preguntasRespondidasParcial.toLocaleString('es-AR')}
                              </strong>{' '}
                              de{' '}
                              <strong>{item.totalPreguntasParcial.toLocaleString('es-AR')}</strong>{' '}
                              preguntas del parcial ({item.coberturaPorcentaje}%). Te conviene
                              cubrir los temas antes de rendir.
                            </>
                          ) : (
                            <>
                              <Target className="mr-1 inline h-3.5 w-3.5 text-amber-500" />
                              Tu promedio de acierto es del{' '}
                              {item.promedioAciertoPorcentaje.toFixed(0)}%. Repasá los temas que más
                              fallás.
                            </>
                          )}
                        </p>
                      ) : (
                        <p className="mt-2 text-[12px] leading-5 text-emerald-600">
                          ? Buen ritmo: {item.probabilidadAprobar}% de aprobar. Seguí así.
                        </p>
                      )}
                    </div>

                    {needsAction ? (
                      <Link
                        href={item.simulatedHref}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition"
                      >
                        <PlayCircle className="h-3.5 w-3.5" />
                        Practicar
                      </Link>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      <div className="border-border text-muted-foreground flex items-start gap-1.5 border-t px-4 py-3 text-[12px] sm:px-5">
        <Sparkles className="text-brand h-3.5 w-3.5" />
        Basado en tu progreso real por materia y parcial.
      </div>

      <div className="px-4 pb-4 sm:px-5 sm:pb-5">
        <CalendarMini />
      </div>
    </div>
  );
}
