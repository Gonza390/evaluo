'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, ChevronLeft, ChevronRight, PlayCircle, Sparkles, Target } from 'lucide-react';
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
 <div className="mt-4 border-t border-border pt-3">
 <div className="flex items-center justify-between px-1">
 <p className="text-[12px] font-semibold text-muted-foreground">{formatMonthLabel(visibleMonth)}</p>
 <div className="flex items-center gap-0.5">
 <button
 type="button"
 onClick={() => setVisibleMonth((current) => addMonths(current, -1))}
 aria-label="Mes anterior"
 className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md p-2.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
 >
 <ChevronLeft className="h-3.5 w-3.5" />
 </button>
 <button
 type="button"
 onClick={() => setVisibleMonth((current) => addMonths(current, 1))}
 aria-label="Mes siguiente"
 className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md p-2.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
 >
 <ChevronRight className="h-3.5 w-3.5" />
 </button>
 </div>
 </div>

 <Link
 href="/calendario"
 className="mt-2 block rounded-xl border border-border p-2 transition hover:border-primary/30 hover:bg-primary/5"
 aria-label="Abrir el calendario"
 >
 <div className="grid grid-cols-7 gap-y-0.5 text-center">
 {WEEKDAY_SHORT_LABELS.map((label, index) => (
 <span key={`${label}-${index}`} className="pb-1 text-[11px] font-semibold text-muted-foreground">
 {label}
 </span>
 ))}
 {loading
 ? Array.from({ length: 42 }).map((_, index) => (
 <span key={index} className="flex h-6 items-center justify-center">
 <span className="h-4 w-4 animate-pulse rounded-md bg-muted" />
 </span>
 ))
 : monthGrid.map((date, index) => {
 const dateKey = formatStorageDate(date);
 const isCurrentMonth = date.getMonth() === visibleMonth.getMonth();
 const isToday = dateKey === todayKey;
 const hasEvents = Boolean(eventsByDate[dateKey]?.length);

 return (
 <span key={`${dateKey}-${index}`} className="flex h-6 items-center justify-center">
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
 <span className="absolute mt-4 h-0.5 w-0.5 rounded-full bg-brand" />
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
 <div className="surface-card rounded-[var(--radius-card)] border-border bg-card/90 backdrop-blur">
 <div className="flex items-center justify-between px-5 pt-5">
 <div className="flex items-center gap-2">
 <CalendarDays className="h-4 w-4 text-brand" />
 <h3 className="text-xl font-semibold text-foreground">Tu plan de estudio</h3>
 </div>
 <Link
 href="/calendario"
 className="text-xs font-semibold text-brand transition hover:text-brand/80"
 >
 Calendario
 </Link>
 </div>
 <p className="mt-1 px-5 text-xs text-muted-foreground">
 Próximos parciales en tu calendario y qué te conviene practicar antes.
 </p>

 <div className="space-y-2.5 px-5 pb-5 pt-4">
 {loading ? (
 <div className="space-y-2.5">
 {Array.from({ length: 2 }).map((_, index) => (
 <div key={index} className="h-16 animate-pulse rounded-xl border border-border bg-muted" />
 ))}
 </div>
 ) : recommendations.length === 0 ? (
 <div className="rounded-xl border border-dashed border-border bg-muted px-4 py-6 text-center">
 <CalendarDays className="mx-auto h-7 w-7 text-muted-foreground" />
 <p className="mt-2 text-sm font-medium text-muted-foreground">
 No tenés parciales cargados en el calendario
 </p>
 <p className="mt-1 text-xs text-muted-foreground">
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
 ? 'border-primary/20 bg-gradient-to-r from-primary/10 to-card'
 : 'border-border bg-card'
 }`}
 >
 <div className="flex items-start justify-between gap-3">
 <div className="min-w-0">
 <div className="flex flex-wrap items-center gap-2">
 <span
 className={`rounded-full px-2 py-0.5 text-[12px] font-semibold ${
 needsAction
 ? 'border border-brand/25 bg-brand/10 text-brand'
 : 'border border-emerald-200 bg-emerald-50 text-emerald-700'
 }`}
 >
 {daysLabel(item.daysUntil)}
 </span>
 <span className="rounded-full bg-muted px-2 py-0.5 text-[12px] font-semibold text-muted-foreground">
 {examLabel(item.examInstance)}
 </span>
 </div>
 <p className="mt-1.5 truncate text-sm font-semibold text-foreground">
 {item.materiaNombre}
 </p>
 <p className="mt-0.5 text-xs text-muted-foreground">
 {formatEventDate(item.examDate)}
 </p>

 {needsAction ? (
 <p className="mt-2 text-[12px] leading-5 text-muted-foreground">
 {item.reason === 'falta-cobertura' ? (
 <>
 <Sparkles className="mr-1 inline h-3.5 w-3.5 text-brand" />
 Practicaste <strong>{item.preguntasRespondidasParcial.toLocaleString('es-AR')}</strong> de{' '}
 <strong>{item.totalPreguntasParcial.toLocaleString('es-AR')}</strong> preguntas del parcial (
 {item.coberturaPorcentaje}%). Te conviene cubrir los temas antes de rendir.
 </>
 ) : (
 <>
 <Target className="mr-1 inline h-3.5 w-3.5 text-amber-500" />
 Tu promedio de acierto es del {item.promedioAciertoPorcentaje.toFixed(0)}%. Repasá los temas que más fallás.
 </>
 )}
 </p>
 ) : (
 <p className="mt-2 text-[12px] leading-5 text-emerald-600">
 ✓ Buen ritmo: {item.probabilidadAprobar}% de aprobar. Seguí así.
 </p>
 )}
 </div>

 {needsAction ? (
 <Link
 href={item.simulatedHref}
 className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
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

 <div className="flex items-center gap-1.5 border-t border-border px-5 py-3 text-[12px] text-muted-foreground">
 <Sparkles className="h-3.5 w-3.5 text-brand" />
 Basado en tu progreso real por materia y parcial.
 </div>

 <div className="px-5 pb-5">
 <CalendarMini />
 </div>
 </div>
 );
}
