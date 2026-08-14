'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  FileText,
  GraduationCap,
  Plus,
  Trash2,
} from 'lucide-react';
import { checkProfileStatus } from '@/app/actions';
import { useUser } from '@/hooks/useUser';
import { usePremium } from '@/hooks/usePremium';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { StudyStatePanel } from '@/components/study-state-panel';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  addMonths,
  DEFAULT_CALENDAR_FORM_STATE,
  formatLongDate,
  formatMonthLabel,
  formatStorageDate,
  getCalendarGrid,
  getMonthStart,
  isMissingCalendarTableError,
  type CalendarEventType,
  type CalendarEventSourcePayload,
  type CareerMateriaOption,
  type ExamInstance,
  type StudyCalendarEvent,
} from '@/lib/calendar-utils';
import { logError } from '@/lib/observability';

type CalendarStorageMode = 'supabase' | 'local';

type CalendarTourStep = {
  id: 'month' | 'grid' | 'composer' | 'create';
  title: string;
  description: string;
};

const WEEKDAY_LABELS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const DEFAULT_FORM_STATE = DEFAULT_CALENDAR_FORM_STATE;

const CALENDAR_TOUR_STEPS: CalendarTourStep[] = [
  {
    id: 'month',
    title: 'Navega el mes',
    description: 'Usa estas flechas para cambiar de mes o vuelve a hoy cuando quieras ubicarte rápido.',
  },
  {
    id: 'grid',
    title: 'Elige un día',
    description: 'Toca cualquier día del calendario para ver su contenido o cargar una nueva fecha en ese momento.',
  },
  {
    id: 'composer',
    title: 'Completa la fecha',
    description: 'Aquí eliges la materia o el trabajo práctico, defines la instancia y dejas listo el evento para guardarlo.',
  },
  {
    id: 'create',
    title: 'Guarda el evento',
    description: 'Cuando ya tengas los datos listos, guarda el evento para verlo dentro del calendario y consultarlo después.',
  },
];

function getLocalCalendarStorageKey(userId: string) {
  return `evaluo_calendar_events_${userId}`;
}

function getCalendarTourStorageKey(userId: string) {
  return `evaluo_calendar_tour_seen:${userId}`;
}

function readLocalCalendarEvents(userId: string) {
  try {
    const stored = window.localStorage.getItem(getLocalCalendarStorageKey(userId));
    const parsed = stored ? (JSON.parse(stored) as StudyCalendarEvent[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    logError('calendario.readLocalEvents', error, { userId });
    return [];
  }
}

function writeLocalCalendarEvents(userId: string, events: StudyCalendarEvent[]) {
  try {
    window.localStorage.setItem(getLocalCalendarStorageKey(userId), JSON.stringify(events));
  } catch (error) {
    logError('calendario.writeLocalEvents', error, { userId, eventsCount: events.length });
  }
}

function eventTypeLabel(type: CalendarEventType) {
  return type === 'exam' ? 'Parcial' : 'Trabajo práctico';
}

function examInstanceLabel(value: ExamInstance) {
  if (value === '1') return 'Parcial 1';
  if (value === '2') return 'Parcial 2';
  return 'Integrador';
}

function buildEventPayload({
  formState,
  careerId,
  careerName,
  selectedMateria,
}: {
  formState: typeof DEFAULT_FORM_STATE;
  careerId: string | null;
  careerName: string | null;
  selectedMateria: CareerMateriaOption | null;
}) {
  if (formState.type === 'exam') {
    const subjectName = formState.subjectName.trim();
    if (!subjectName) {
      return null;
    }

    return {
      type: formState.type,
      title: `${subjectName} - ${examInstanceLabel(formState.examInstance)}`,
      notes: '',
      materiaId: selectedMateria?.id ?? null,
      materiaNombre: subjectName,
      carreraId: careerId,
      carreraNombre: careerName,
      examInstance: formState.examInstance,
      sourcePayload: {
        subjectName,
        examInstance: formState.examInstance,
        selectedMateriaId: selectedMateria?.id ?? null,
        selectedFromSuggestions: Boolean(selectedMateria),
        careerId,
        careerName,
      } satisfies CalendarEventSourcePayload,
    };
  }

  const assignmentTitle = formState.assignmentTitle.trim();
  if (!assignmentTitle) {
    return null;
  }

  return {
    type: formState.type,
    title: assignmentTitle,
    notes: '',
    materiaId: null,
    materiaNombre: null,
    carreraId: careerId,
    carreraNombre: careerName,
    examInstance: null,
    sourcePayload: {
      assignmentTitle,
      careerId,
      careerName,
    } satisfies CalendarEventSourcePayload,
  };
}

function CalendarTourCard({
  step,
  stepIndex,
  totalSteps,
  onNext,
  onPrevious,
  onClose,
  className,
}: {
  step: CalendarTourStep;
  stepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  onClose: () => void;
  className: string;
}) {
  return (
    <div
      className={`absolute z-[80] w-[320px] rounded-[26px] border border-[#DCE6FF] bg-[linear-gradient(180deg,#FFFFFF_0%,#F8FBFF_100%)] p-5 shadow-[0_24px_60px_rgba(15,23,42,0.18)] animate-saas-lift-in max-sm:fixed max-sm:inset-x-4 max-sm:bottom-[5.75rem] max-sm:top-auto max-sm:w-auto max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-[24px] max-sm:p-4 ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2563EB]">
            Paso {stepIndex + 1} de {totalSteps}
          </p>
          <h3 className="mt-2 text-base font-bold text-slate-950 max-sm:text-[0.98rem]">{step.title}</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 transition hover:border-slate-300 hover:text-slate-600 max-sm:h-8 max-sm:w-8"
          aria-label="Cerrar guía del calendario"
        >
          ×
        </button>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#E8EFFC]">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#2563EB_0%,#6366F1_100%)] transition-all duration-300"
          style={{ width: `${((stepIndex + 1) / totalSteps) * 100}%` }}
        />
      </div>

      <p className="mt-4 text-[0.95rem] leading-7 text-slate-600 max-sm:text-[0.9rem] max-sm:leading-6">{step.description}</p>

      <div className="mt-5 flex items-center justify-between gap-2 max-sm:flex-col max-sm:items-stretch">
        <div className="flex items-center gap-2 max-sm:grid max-sm:grid-cols-2">
          <button
            type="button"
            onClick={onPrevious}
            disabled={stepIndex === 0}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
          >
            Anterior
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Cerrar
          </button>
        </div>
        <button
          type="button"
          onClick={onNext}
          className="inline-flex h-10 items-center justify-center rounded-xl bg-gradient-to-r from-[#2563EB] to-[#6366F1] px-4 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(37,99,235,0.18)] transition hover:from-[#1D4ED8] hover:to-[#4F46E5] max-sm:w-full"
        >
          {stepIndex === totalSteps - 1 ? 'Entendido' : 'Siguiente'}
        </button>
      </div>
    </div>
  );
}

export default function CalendarioPage() {
  const { user, loading } = useUser();
  const { isPremium } = usePremium();
  const router = useRouter();
  const { toast } = useToast();
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);
  const [isSavingEvent, setIsSavingEvent] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [visibleMonth, setVisibleMonth] = useState<Date>(getMonthStart(new Date()));
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [formState, setFormState] = useState(DEFAULT_FORM_STATE);
  const [events, setEvents] = useState<StudyCalendarEvent[]>([]);
  const [hasLoadedEvents, setHasLoadedEvents] = useState(false);
  const [storageMode, setStorageMode] = useState<CalendarStorageMode>('supabase');
  const [careerMateriaOptions, setCareerMateriaOptions] = useState<CareerMateriaOption[]>([]);
  const [careerMateriaLoading, setCareerMateriaLoading] = useState(false);
  const [careerId, setCareerId] = useState<string | null>(null);
  const [careerName, setCareerName] = useState<string | null>(null);
  const [showCalendarTour, setShowCalendarTour] = useState(false);
  const [calendarTourStepIndex, setCalendarTourStepIndex] = useState(0);
  const monthTourRef = useRef<HTMLDivElement | null>(null);
  const gridTourRef = useRef<HTMLDivElement | null>(null);
  const composerTourRef = useRef<HTMLDivElement | null>(null);
  const createTourRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function syncProfileStatus() {
      if (loading) return;

      if (!user) {
        if (isMounted) setIsCheckingProfile(false);
        return;
      }

      const status = await checkProfileStatus(user.id);
      if (!isMounted) return;

      if (status.isComplete) {
        setIsCheckingProfile(false);
        return;
      }

      router.replace('/completar-perfil?next=%2Fcalendario');
    }

    void syncProfileStatus();
    return () => {
      isMounted = false;
    };
  }, [loading, router, user]);

  useEffect(() => {
    let active = true;

    async function loadEvents() {
      if (!user) {
        if (active) {
          setEvents([]);
          setHasLoadedEvents(true);
        }
        return;
      }

      setHasLoadedEvents(false);

      const { data, error } = await supabase
        .from('study_calendar_events')
        .select(
          'id, event_type, title, notes, event_date, created_at, materia_id, materia_nombre, carrera_id, carrera_nombre, exam_instance, source_payload'
        )
        .eq('user_id', user.id)
        .order('event_date', { ascending: true })
        .order('created_at', { ascending: true });

      if (!active) return;

      if (error) {
        if (isMissingCalendarTableError(error)) {
          setStorageMode('local');
          setEvents(readLocalCalendarEvents(user.id));
          setHasLoadedEvents(true);
          return;
        }

        logError('calendario.loadEvents', error, { userId: user.id });
        setEvents([]);
        setHasLoadedEvents(true);
        toast({
          description: 'No pudimos cargar tu calendario. Vuelve a intentarlo en unos segundos.',
          variant: 'destructive',
        });
        return;
      }

      setStorageMode('supabase');
      setEvents(
        (data ?? []).map((event) => ({
          id: event.id,
          type: event.event_type as CalendarEventType,
          title: event.title,
          date: event.event_date,
          notes: event.notes ?? '',
          createdAt: event.created_at,
          materiaId: event.materia_id ?? null,
          materiaNombre: event.materia_nombre ?? null,
          carreraId: event.carrera_id ?? null,
          carreraNombre: event.carrera_nombre ?? null,
          examInstance:
            event.exam_instance === '1' || event.exam_instance === '2' || event.exam_instance === 'integrador'
              ? event.exam_instance
              : null,
          sourcePayload:
            event.source_payload && typeof event.source_payload === 'object'
              ? (event.source_payload as CalendarEventSourcePayload)
              : null,
        }))
      );
      setHasLoadedEvents(true);
    }

    void loadEvents();
    return () => {
      active = false;
    };
  }, [toast, user]);

  useEffect(() => {
    let active = true;

    async function loadCareerMaterias() {
      if (!user) {
        if (active) {
          setCareerMateriaOptions([]);
          setCareerName(null);
        }
        return;
      }

      setCareerMateriaLoading(true);

      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('carrera_id')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) {
          throw profileError;
        }

        const carreraId = String(profile?.carrera_id ?? '').trim();
        if (!carreraId) {
          if (active) {
            setCareerMateriaOptions([]);
            setCareerId(null);
            setCareerName(null);
            setCareerMateriaLoading(false);
          }
          return;
        }

        const [careerResponse, relationResponse, directResponse] = await Promise.all([
          supabase.from('carreras').select('nombre').eq('id', carreraId).maybeSingle(),
          supabase.from('carrera_materias').select('materia_id').eq('carrera_id', carreraId),
          supabase.from('materias').select('id, nombre').eq('carrera_id', carreraId).order('nombre'),
        ]);

        if (careerResponse.error) {
          throw careerResponse.error;
        }

        if (relationResponse.error) {
          throw relationResponse.error;
        }

        if (directResponse.error) {
          throw directResponse.error;
        }

        const relationIds = Array.from(
          new Set(
            (relationResponse.data ?? [])
              .map((relation) => String(relation.materia_id ?? '').trim())
              .filter(Boolean)
          )
        );

        let resolvedMaterias = (directResponse.data ?? []).map((materia) => ({
          id: materia.id,
          nombre: materia.nombre,
        }));

        if (relationIds.length > 0) {
          const { data: relationMaterias, error: relationMateriasError } = await supabase
            .from('materias')
            .select('id, nombre')
            .in('id', relationIds)
            .order('nombre');

          if (relationMateriasError) {
            throw relationMateriasError;
          }

          resolvedMaterias = Array.from(
            new Map(
              [...resolvedMaterias, ...(relationMaterias ?? [])].map((materia) => [
                materia.id,
                {
                  id: materia.id,
                  nombre: materia.nombre,
                },
              ])
            ).values()
          ).sort((left, right) => left.nombre.localeCompare(right.nombre, 'es'));
        }

        if (active) {
          setCareerId(carreraId);
          setCareerName(careerResponse.data?.nombre ?? null);
          setCareerMateriaOptions(resolvedMaterias);
        }
      } catch (error) {
        logError('calendario.loadCareerMaterias', error, { userId: user.id });
        if (active) {
          setCareerMateriaOptions([]);
          setCareerId(null);
          setCareerName(null);
        }
      } finally {
        if (active) {
          setCareerMateriaLoading(false);
        }
      }
    }

    void loadCareerMaterias();

    return () => {
      active = false;
    };
  }, [user]);

  const selectedDateKey = formatStorageDate(selectedDate);
  const currentCalendarTourStep =
    CALENDAR_TOUR_STEPS[calendarTourStepIndex] ?? CALENDAR_TOUR_STEPS[0];

  const eventsByDate = useMemo(() => {
    return events.reduce<Record<string, StudyCalendarEvent[]>>((accumulator, event) => {
      accumulator[event.date] ??= [];
      accumulator[event.date].push(event);
      return accumulator;
    }, {});
  }, [events]);

  const monthGrid = useMemo(() => getCalendarGrid(visibleMonth), [visibleMonth]);

  const selectedDateEvents = useMemo(() => {
    return [...(eventsByDate[selectedDateKey] ?? [])].sort((left, right) =>
      left.createdAt.localeCompare(right.createdAt)
    );
  }, [eventsByDate, selectedDateKey]);

  const filteredCareerMateriaOptions = useMemo(() => {
    const normalizedQuery = formState.subjectName.trim().toLocaleLowerCase('es');

    if (!normalizedQuery) {
      return [];
    }

    return careerMateriaOptions
      .filter((materia) => materia.nombre.toLocaleLowerCase('es').includes(normalizedQuery))
      .slice(0, 3);
  }, [careerMateriaOptions, formState.subjectName]);

  const selectedCareerMateria = useMemo(() => {
    if (formState.selectedMateriaId) {
      return (
        careerMateriaOptions.find((materia) => materia.id === formState.selectedMateriaId) ?? null
      );
    }

    const normalizedSubjectName = formState.subjectName.trim().toLocaleLowerCase('es');
    if (!normalizedSubjectName) {
      return null;
    }

    return (
      careerMateriaOptions.find(
        (materia) => materia.nombre.trim().toLocaleLowerCase('es') === normalizedSubjectName
      ) ?? null
    );
  }, [careerMateriaOptions, formState.selectedMateriaId, formState.subjectName]);

  useEffect(() => {
    if (!user || !hasLoadedEvents || typeof window === 'undefined') return;
    if (events.length > 0) return;

    const alreadySeen = window.localStorage.getItem(getCalendarTourStorageKey(user.id)) === 'done';
    if (alreadySeen) return;

    setCalendarTourStepIndex(0);
    setShowCalendarTour(true);
  }, [events.length, hasLoadedEvents, user]);

  useEffect(() => {
    if (!showCalendarTour) return;

    const tourTargets: Record<CalendarTourStep['id'], HTMLElement | null> = {
      month: monthTourRef.current,
      grid: gridTourRef.current,
      composer: composerTourRef.current,
      create: createTourRef.current,
    };

    const target = tourTargets[currentCalendarTourStep.id];
    if (!target) return;

    const timeoutId = window.setTimeout(() => {
      target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    }, 50);

    return () => window.clearTimeout(timeoutId);
  }, [currentCalendarTourStep.id, showCalendarTour]);

  const closeCalendarTour = () => {
    setShowCalendarTour(false);
    if (typeof window !== 'undefined' && user) {
      window.localStorage.setItem(getCalendarTourStorageKey(user.id), 'done');
    }
  };

  const handleCalendarTourNext = () => {
    if (currentCalendarTourStep.id === 'grid') {
      openComposerForDate(selectedDate);
    }

    if (calendarTourStepIndex >= CALENDAR_TOUR_STEPS.length - 1) {
      closeCalendarTour();
      return;
    }

    setCalendarTourStepIndex((current) => current + 1);
  };

  const handleCalendarTourPrevious = () => {
    if (calendarTourStepIndex === 0) return;
    setCalendarTourStepIndex((current) => current - 1);
  };

  const resetForm = () => {
    setFormState((current) => ({
      type: current.type,
      subjectName: '',
      selectedMateriaId: null,
      examInstance: current.type === 'exam' ? current.examInstance : '1',
      assignmentTitle: '',
    }));
  };

  const openComposerForDate = (date: Date) => {
    setSelectedDate(date);
    setVisibleMonth(getMonthStart(date));
    resetForm();
    setIsComposerOpen(true);
  };

  const handleCreateEvent = async () => {
    const payload = buildEventPayload({
      formState,
      careerId,
      careerName,
      selectedMateria: selectedCareerMateria,
    });

    if (!payload) {
      toast({
        description:
          formState.type === 'exam'
            ? 'Escribe el nombre de la materia para guardar ese parcial.'
            : 'Escribe el nombre del trabajo práctico para guardarlo.',
        variant: 'destructive',
      });
      return;
    }

    if (!user) {
      toast({
        description: 'Inicia sesión para guardar fechas en tu calendario.',
        variant: 'destructive',
      });
      return;
    }

    const examEventCount = events.filter((event) => event.type === 'exam').length;
    if (payload.type === 'exam' && !isPremium && examEventCount >= 3) {
      toast({
        description:
          'Alcanzaste el límite de 3 parciales en el plan gratis. Sumate a Premium para agendar parciales ilimitados y recordatorios.',
        variant: 'destructive',
      });
      return;
    }

    if (storageMode === 'local') {
      const newEvent: StudyCalendarEvent = {
        id: `${selectedDateKey}-${Date.now()}`,
        type: payload.type,
        title: payload.title,
        date: selectedDateKey,
        notes: payload.notes,
        createdAt: new Date().toISOString(),
        materiaId: payload.materiaId,
        materiaNombre: payload.materiaNombre,
        carreraId: payload.carreraId,
        carreraNombre: payload.carreraNombre,
        examInstance: payload.examInstance,
        sourcePayload: payload.sourcePayload,
      };
      const nextEvents = [...events, newEvent];
      setEvents(nextEvents);
      writeLocalCalendarEvents(user.id, nextEvents);
      resetForm();
      setIsComposerOpen(false);
      toast({
        description:
          formState.type === 'exam'
            ? 'Parcial agregado al calendario.'
            : 'Trabajo práctico agregado al calendario.',
      });
      return;
    }

    setIsSavingEvent(true);

    const { data, error } = await supabase
      .from('study_calendar_events')
      .insert({
        user_id: user.id,
        event_type: payload.type,
        title: payload.title,
        notes: payload.notes || null,
        event_date: selectedDateKey,
        materia_id: payload.materiaId,
        materia_nombre: payload.materiaNombre,
        carrera_id: payload.carreraId,
        carrera_nombre: payload.carreraNombre,
        exam_instance: payload.examInstance,
        source_payload: payload.sourcePayload,
      })
      .select(
        'id, event_type, title, notes, event_date, created_at, materia_id, materia_nombre, carrera_id, carrera_nombre, exam_instance, source_payload'
      )
      .single();

    setIsSavingEvent(false);

    if (error || !data) {
      if (isMissingCalendarTableError(error)) {
        const newEvent: StudyCalendarEvent = {
          id: `${selectedDateKey}-${Date.now()}`,
          type: payload.type,
          title: payload.title,
          date: selectedDateKey,
          notes: payload.notes,
          createdAt: new Date().toISOString(),
          materiaId: payload.materiaId,
          materiaNombre: payload.materiaNombre,
          carreraId: payload.carreraId,
          carreraNombre: payload.carreraNombre,
          examInstance: payload.examInstance,
          sourcePayload: payload.sourcePayload,
        };
        const nextEvents = [...events, newEvent];
        setStorageMode('local');
        setEvents(nextEvents);
        writeLocalCalendarEvents(user.id, nextEvents);
        resetForm();
        setIsComposerOpen(false);
        toast({ description: 'Fecha guardada en tu calendario.' });
        return;
      }

      logError('calendario.createEvent', error, {
        userId: user.id,
        selectedDate: selectedDateKey,
        eventType: formState.type,
      });
      toast({
        description: 'No pudimos guardar ese evento. Inténtalo nuevamente.',
        variant: 'destructive',
      });
      return;
    }

    setEvents((currentEvents) => [
      ...currentEvents,
      {
        id: data.id,
        type: data.event_type as CalendarEventType,
        title: data.title,
        date: data.event_date,
        notes: data.notes ?? '',
        createdAt: data.created_at,
        materiaId: data.materia_id ?? null,
        materiaNombre: data.materia_nombre ?? null,
        carreraId: data.carrera_id ?? null,
        carreraNombre: data.carrera_nombre ?? null,
        examInstance:
          data.exam_instance === '1' || data.exam_instance === '2' || data.exam_instance === 'integrador'
            ? data.exam_instance
            : null,
        sourcePayload:
          data.source_payload && typeof data.source_payload === 'object'
            ? (data.source_payload as CalendarEventSourcePayload)
            : null,
      },
    ]);
    resetForm();
    setIsComposerOpen(false);
    toast({
      description:
        formState.type === 'exam'
          ? 'Parcial agregado al calendario.'
          : 'Trabajo práctico agregado al calendario.',
    });
  };

  const handleDeleteEvent = async (eventId: string) => {
    const previousEvents = events;
    const nextEvents = previousEvents.filter((event) => event.id !== eventId);
    setEvents(nextEvents);

    if (!user) return;

    if (storageMode === 'local') {
      writeLocalCalendarEvents(user.id, nextEvents);
      toast({ description: 'Fecha eliminada del calendario.' });
      return;
    }

    const { error } = await supabase.from('study_calendar_events').delete().eq('id', eventId);

    if (error) {
      if (isMissingCalendarTableError(error)) {
        setStorageMode('local');
        writeLocalCalendarEvents(user.id, nextEvents);
        toast({ description: 'Fecha eliminada del calendario.' });
        return;
      }

      logError('calendario.deleteEvent', error, { userId: user.id, eventId });
      setEvents(previousEvents);
      toast({
        description: 'No pudimos eliminar ese evento. Inténtalo nuevamente.',
        variant: 'destructive',
      });
      return;
    }

    toast({ description: 'Fecha eliminada del calendario.' });
  };

  if (loading || isCheckingProfile) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-[1080px] items-center justify-center px-4">
        <div className="w-full rounded-[32px] border border-slate-200/70 bg-[linear-gradient(135deg,#ffffff_0%,#f7faff_52%,#edf4ff_100%)] p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:p-8">
          <div className="h-5 w-36 animate-pulse rounded-full bg-slate-200/90" />
          <div className="mt-4 h-10 w-64 animate-pulse rounded-2xl bg-slate-200/80" />
          <div className="mt-3 h-4 w-full animate-pulse rounded-full bg-slate-200/70" />
          <div className="mt-2 h-4 w-5/6 animate-pulse rounded-full bg-slate-200/60" />
          <div className="mt-8 grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, index) => (
              <div key={index} className="h-16 animate-pulse rounded-2xl bg-white/80 shadow-sm" />
            ))}
          </div>
          <p className="mt-6 text-sm font-semibold text-slate-700">Estamos preparando tu calendario</p>
          <p className="mt-1 text-sm text-slate-500">
            Cargamos tus fechas, materias y recordatorios para mostrarte el mes listo para usar.
          </p>
          <p className="mt-3 text-xs text-slate-400">
            Si tarda demasiado, prueba recargando la página.
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center px-4">
        <StudyStatePanel
          icon={CalendarPlus}
          className="w-full"
          title="Tu calendario académico"
          description="Inicia sesión para cargar parciales, trabajos prácticos y recordatorios en tu calendario mensual."
          secondaryText="Cuando entres, podrás organizar tus fechas clave y seguirlas desde un solo lugar."
          primaryActionLabel="Iniciar sesión"
          onPrimaryAction={() => router.push('/login?next=%2Fcalendario')}
        />
      </div>
    );
  }

  if (!hasLoadedEvents) {
    return (
      <div className="rounded-[32px] border border-slate-200/70 bg-[linear-gradient(135deg,#ffffff_0%,#f7faff_52%,#edf4ff_100%)] p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:p-8">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="h-4 w-24 animate-pulse rounded-full bg-slate-200/90" />
              <div className="mt-3 h-8 w-48 animate-pulse rounded-2xl bg-slate-200/80" />
            </div>
            <div className="h-11 w-32 animate-pulse rounded-2xl bg-white/90" />
          </div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, index) => (
              <div key={index} className="h-20 animate-pulse rounded-2xl bg-white/85 shadow-sm" />
            ))}
          </div>
        </div>
        <p className="mt-6 text-sm font-semibold text-slate-700">Estamos trayendo tus fechas del mes</p>
        <p className="mt-1 text-sm text-slate-500">
          Cuando termine esta carga vas a poder agregar parciales y trabajos prácticos al instante.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto w-full max-w-[1080px] space-y-6">
        <section className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-[linear-gradient(135deg,#ffffff_0%,#f7faff_50%,#edf4ff_100%)] shadow-[0_30px_90px_rgba(15,23,42,0.10)]">
          <div className="relative px-3 py-3 sm:px-4 sm:py-4">
            {showCalendarTour ? (
              <div className="pointer-events-none absolute inset-0 z-[60] bg-white/18 backdrop-blur-[3px]" />
            ) : null}
            <div className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div
            ref={monthTourRef}
            className={`flex flex-col gap-2 border-b border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] px-4 py-3 sm:px-5 lg:flex-row lg:items-center lg:justify-between ${
              showCalendarTour && currentCalendarTourStep.id === 'month'
                ? 'relative z-[70] ring-1 ring-[#BFD4FF] shadow-[0_24px_70px_rgba(15,23,42,0.12)]'
                : ''
            }`}
          >
            <div className="relative flex items-center gap-2">
              <button
                type="button"
                onClick={() => setVisibleMonth((current) => addMonths(current, -1))}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-transparent text-slate-500 transition hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                aria-label="Mes anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <h1 className="text-[1.6rem] font-black tracking-[-0.04em] text-[#050B2C] sm:text-[1.8rem]">
                {formatMonthLabel(visibleMonth)}
              </h1>
              <button
                type="button"
                onClick={() => setVisibleMonth((current) => addMonths(current, 1))}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-transparent text-slate-500 transition hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                aria-label="Mes siguiente"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              {showCalendarTour && currentCalendarTourStep.id === 'month' ? (
                <CalendarTourCard
                  step={currentCalendarTourStep}
                  stepIndex={calendarTourStepIndex}
                  totalSteps={CALENDAR_TOUR_STEPS.length}
                  onNext={handleCalendarTourNext}
                  onPrevious={handleCalendarTourPrevious}
                  onClose={closeCalendarTour}
                  className="left-0 top-full mt-4 pointer-events-auto"
                />
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const today = new Date();
                  setSelectedDate(today);
                  setVisibleMonth(getMonthStart(today));
                }}
                className="h-8 rounded-xl border border-slate-200 bg-white px-3 text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900"
              >
                Hoy
              </Button>
              <Button
                type="button"
                onClick={() => openComposerForDate(selectedDate)}
                className="h-8 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#6366F1] px-4 text-white shadow-[0_12px_28px_rgba(37,99,235,0.24)] hover:opacity-95"
              >
                <CalendarPlus className="h-4 w-4" />
                Agregar nuevo evento
              </Button>
            </div>
          </div>

          <div
            className="border-b border-slate-200/80 bg-[linear-gradient(180deg,#f8fbff_0%,#f3f7ff_100%)]"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}
          >
            {WEEKDAY_LABELS.map((label) => (
              <div
                key={label}
                className="border-r border-slate-200/80 px-2 py-2 text-center text-[12px] font-bold text-slate-600 last:border-r-0 sm:px-3"
              >
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden text-xs">{label.slice(0, 3)}</span>
              </div>
            ))}
          </div>

          <div
            ref={gridTourRef}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
            }}
            className={
              showCalendarTour && currentCalendarTourStep.id === 'grid'
                ? 'relative z-[70] ring-1 ring-[#BFD4FF] shadow-[0_24px_70px_rgba(15,23,42,0.12)]'
                : ''
            }
          >
            {showCalendarTour && currentCalendarTourStep.id === 'grid' ? (
              <CalendarTourCard
                step={currentCalendarTourStep}
                stepIndex={calendarTourStepIndex}
                totalSteps={CALENDAR_TOUR_STEPS.length}
                onNext={handleCalendarTourNext}
                onPrevious={handleCalendarTourPrevious}
                onClose={closeCalendarTour}
                className="left-1/2 top-4 -translate-x-1/2 pointer-events-auto"
              />
            ) : null}
            {monthGrid.map((date) => {
              const dateKey = formatStorageDate(date);
              const cellEvents = eventsByDate[dateKey] ?? [];
              const isCurrentMonth = date.getMonth() === visibleMonth.getMonth();
              const isSelected = dateKey === selectedDateKey;
              const isToday = dateKey === formatStorageDate(new Date());

              return (
                <button
                  key={dateKey}
                  type="button"
                  onClick={() => openComposerForDate(date)}
                  className={`group flex min-h-[66px] flex-col gap-1.5 border-r border-b px-2 py-2 text-left transition hover:bg-[#f8fbff] last:border-r-0 sm:min-h-[74px] sm:px-2.5 lg:min-h-[86px] ${
                    !isCurrentMonth ? 'text-slate-300' : 'text-slate-900'
                  }`}
                  style={{
                    borderRightColor: '#e7ebf4',
                    borderBottomColor: '#e7ebf4',
                    backgroundColor: isSelected
                      ? '#eef3ff'
                      : isCurrentMonth
                        ? '#ffffff'
                        : '#f7f9fc',
                  }}
                >
                  <div className="flex items-start justify-between">
                    <span
                      className="inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[12px] font-semibold"
                      style={{
                        backgroundColor: isToday ? '#2563EB' : isSelected ? '#dce8ff' : 'transparent',
                        color: isToday ? '#ffffff' : isSelected ? '#2563EB' : undefined,
                      }}
                    >
                      {date.getDate()}
                    </span>
                  </div>

                  <div className="space-y-1.5 overflow-hidden">
                    {cellEvents.slice(0, 2).map((event) => (
                      <div
                        key={event.id}
                        className="truncate rounded-[8px] border px-2 py-0.5 text-[10px] font-semibold shadow-sm"
                        style={{
                          backgroundColor: event.type === 'exam' ? '#fff4df' : '#edf4ff',
                          borderColor: event.type === 'exam' ? '#f6ddb0' : '#d5e4ff',
                          color: event.type === 'exam' ? '#b7791f' : '#2563EB',
                        }}
                      >
                        {event.title}
                      </div>
                    ))}
                    {cellEvents.length > 2 ? (
                      <div className="text-[10px] font-medium text-slate-400">
                        +{cellEvents.length - 2} más
                      </div>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
            </div>
          </div>
        </section>
      </div>

      <Dialog open={isComposerOpen} onOpenChange={setIsComposerOpen}>
        <DialogContent className="h-[min(78vh,640px)] w-[min(calc(100vw-1rem),360px)] max-w-[360px] overflow-hidden rounded-[22px] border border-slate-200 bg-white p-0 text-slate-900 shadow-[0_24px_70px_rgba(15,23,42,0.14)] md:h-auto md:max-h-[76vh] md:w-[680px] md:max-w-[680px] lg:w-[760px] lg:max-w-[760px]">
          <div className="h-full overflow-y-auto px-3 py-3 sm:px-4 sm:py-4 md:max-h-[76vh]">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1.45fr)_240px] lg:items-start">
              <DialogHeader className="space-y-2 text-left">
                <DialogTitle className="text-[1.15rem] font-black tracking-[-0.05em] text-[#050B2C]">
                  Agregar fecha
                </DialogTitle>
                <DialogDescription className="text-[13px] leading-5 text-slate-500">
                  {formatLongDate(selectedDate)}
                </DialogDescription>
              </DialogHeader>

              <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-1">
                <div className="grid grid-cols-2 gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    className={`h-9 rounded-[12px] text-[13px] font-semibold ${
                      formState.type === 'exam'
                        ? 'bg-white text-[#2563EB] shadow-sm hover:bg-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                    onClick={() =>
                      setFormState((currentState) => ({
                        ...currentState,
                        type: 'exam',
                        assignmentTitle: '',
                      }))
                    }
                  >
                    <GraduationCap className="h-4 w-4" />
                    Parcial
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className={`h-9 rounded-[12px] text-[13px] font-semibold ${
                      formState.type === 'assignment'
                        ? 'bg-white text-[#2563EB] shadow-sm hover:bg-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                    onClick={() =>
                      setFormState((currentState) => ({
                        ...currentState,
                        type: 'assignment',
                        subjectName: '',
                      }))
                    }
                  >
                    <FileText className="h-4 w-4" />
                    Trabajo práctico
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1.45fr)_240px] lg:items-start">
              <div
                ref={composerTourRef}
                className={`h-[332px] overflow-hidden ${
                  showCalendarTour && currentCalendarTourStep.id === 'composer'
                    ? 'relative z-[80] rounded-[24px] ring-1 ring-[#BFD4FF] shadow-[0_24px_70px_rgba(15,23,42,0.12)]'
                    : ''
                }`}
              >
                {showCalendarTour && currentCalendarTourStep.id === 'composer' ? (
                  <CalendarTourCard
                    step={currentCalendarTourStep}
                    stepIndex={calendarTourStepIndex}
                    totalSteps={CALENDAR_TOUR_STEPS.length}
                    onNext={handleCalendarTourNext}
                    onPrevious={handleCalendarTourPrevious}
                    onClose={closeCalendarTour}
                    className="left-1/2 top-2 -translate-x-1/2 pointer-events-auto"
                  />
                ) : null}
                {formState.type === 'exam' ? (
                  <div className="grid h-full grid-rows-[auto_auto_minmax(112px,1fr)] gap-3">
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <label className="text-[13px] font-medium text-slate-700">
                          Seleccionar materia
                        </label>
                        <Input
                          value={formState.subjectName}
                          onChange={(event) =>
                            setFormState((currentState) => ({
                              ...currentState,
                              subjectName: event.target.value,
                              selectedMateriaId: null,
                            }))
                          }
                          placeholder="Ej: Derecho Constitucional"
                          className="h-10 rounded-[16px] border-slate-200 bg-white text-[13px] text-slate-900 placeholder:text-slate-400"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[13px] font-medium text-slate-700">Instancia</label>
                        <div className="grid grid-cols-3 gap-2">
                          {(['1', '2', 'integrador'] as ExamInstance[]).map((examInstance) => (
                            <Button
                              key={examInstance}
                              type="button"
                              variant="outline"
                              className={`h-9 rounded-xl px-2 text-[13px] ${
                                formState.examInstance === examInstance
                                  ? 'border-[#CFE0FF] bg-[#EEF4FF] text-[#2563EB] hover:bg-[#EEF4FF]'
                                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                              }`}
                              onClick={() =>
                                setFormState((currentState) => ({
                                  ...currentState,
                                  examInstance,
                                }))
                              }
                            >
                              {examInstanceLabel(examInstance)}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex min-h-[112px] flex-col space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] text-slate-500">
                          {careerName
                            ? `Materias de ${careerName}`
                            : 'Buscaremos materias de la carrera que tienes cargada.'}
                        </p>
                        {careerMateriaLoading ? (
                          <span className="text-[11px] font-medium text-slate-400">
                            Cargando...
                          </span>
                        ) : null}
                      </div>

                      {careerMateriaLoading ? (
                        <div className="flex min-h-[112px] items-center rounded-[16px] border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-[13px] text-slate-500">
                          Cargando materias de tu carrera...
                        </div>
                      ) : filteredCareerMateriaOptions.length > 0 ? (
                        <div className="max-h-[112px] min-h-[112px] overflow-y-auto rounded-[16px] border border-slate-200 bg-white p-1 shadow-sm">
                          {filteredCareerMateriaOptions.map((materia) => (
                            <button
                              key={materia.id}
                              type="button"
                              onClick={() =>
                                setFormState((currentState) => ({
                                  ...currentState,
                                  subjectName: materia.nombre,
                                  selectedMateriaId: materia.id,
                                }))
                              }
                              className="flex w-full items-center rounded-xl px-3 py-2 text-left text-[13px] text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
                            >
                              {materia.nombre}
                            </button>
                          ))}
                        </div>
                      ) : formState.subjectName.trim().length > 0 ? (
                        <div className="flex min-h-[112px] items-center rounded-[16px] border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-[13px] text-slate-500">
                          No encontramos una materia de tu carrera con ese nombre.
                        </div>
                      ) : careerMateriaOptions.length === 0 ? (
                        <div className="flex min-h-[112px] items-center rounded-[16px] border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-[13px] text-slate-500">
                          Cuando tu carrera tenga materias asociadas, aparecerán aquí para elegirlas.
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="grid h-full grid-rows-[auto_auto_minmax(112px,1fr)] gap-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Trabajo práctico</label>
                      <Input
                        value={formState.assignmentTitle}
                        onChange={(event) =>
                          setFormState((currentState) => ({
                            ...currentState,
                            assignmentTitle: event.target.value,
                          }))
                        }
                        placeholder="Ej: TP final de Derecho Privado"
                        className="h-10 rounded-[16px] border-slate-200 bg-white text-[13px] text-slate-900 placeholder:text-slate-400"
                      />
                    </div>
                    <div className="space-y-2 opacity-45">
                      <label className="text-[13px] font-medium text-slate-700">Instancia</label>
                      <div className="grid grid-cols-3 gap-2 pointer-events-none">
                        {(['1', '2', 'integrador'] as ExamInstance[]).map((examInstance) => (
                          <Button
                            key={`assignment-${examInstance}`}
                            type="button"
                            variant="outline"
                            className="h-9 rounded-xl border-slate-200 bg-white px-2 text-[13px] text-slate-400"
                            disabled
                          >
                            {examInstanceLabel(examInstance)}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div className="flex min-h-[112px] flex-col justify-between rounded-[16px] border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-[13px] text-slate-500">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                        Organizacion
                      </p>
                      <p>
                        Guarda la entrega con un nombre claro para ubicarla rápido en recordatorios,
                        calendario y seguimiento semanal.
                      </p>
                      <p className="text-[12px] text-slate-400">
                        Ejemplo: TP final de Derecho Privado.
                      </p>
                    </div>
                    <div className="hidden rounded-[16px] border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-[13px] text-slate-500">
                      Guarda la entrega con un nombre claro para poder usar esta información después
                      en recordatorios, analíticas o planificación.
                    </div>
                  </div>
                )}

              </div>

              <div className="space-y-3">
                <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-3 shadow-[0_12px_32px_rgba(15,23,42,0.05)]">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    Vista previa
                  </p>
                  <div className="mt-2 min-h-[84px] rounded-[16px] border border-slate-200 bg-white px-3 py-2.5 text-[13px] leading-5 text-slate-600">
                    {formState.type === 'exam' ? (
                      <span>
                        Se guardara como{' '}
                        <strong className="text-slate-900">
                          {formState.subjectName.trim() || 'tu materia'} -{' '}
                          {examInstanceLabel(formState.examInstance)}
                        </strong>
                        .
                      </span>
                    ) : (
                      <span>
                        Se guardara como{' '}
                        <strong className="text-slate-900">
                          {formState.assignmentTitle.trim() || 'tu trabajo práctico'}
                        </strong>
                        .
                      </span>
                    )}
                  </div>
                </div>

                {selectedDateEvents.length > 0 ? (
                  <div className="max-h-40 space-y-2 overflow-y-auto rounded-[16px] border border-slate-200 bg-slate-50 p-3">
                    <p className="text-[13px] font-semibold text-slate-900">
                      Ya tienes cargado para este dia
                    </p>
                    {selectedDateEvents.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-start justify-between gap-3 rounded-[16px] border border-slate-200 bg-white px-3 py-2.5"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge
                              className={
                                event.type === 'exam'
                                  ? 'border-amber-200 bg-amber-50 text-amber-700'
                                  : 'border-blue-200 bg-blue-50 text-blue-700'
                              }
                              variant="outline"
                            >
                              {eventTypeLabel(event.type)}
                            </Badge>
                          </div>
                          <p className="mt-1.5 text-[13px] font-medium text-slate-900">{event.title}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleDeleteEvent(event.id)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-rose-500"
                          aria-label="Eliminar fecha"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="min-h-[74px] rounded-[16px] border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-[13px] leading-5 text-slate-500">
                    Todavía no tienes fechas guardadas para este día.
                  </div>
                )}

                <div className="relative flex items-center justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 rounded-xl border-slate-200 bg-white px-3.5 text-[13px] text-slate-700 hover:bg-slate-50"
                    onClick={() => setIsComposerOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    ref={createTourRef}
                    className="h-9 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#6366F1] px-3.5 text-[13px] text-white hover:opacity-95"
                    onClick={handleCreateEvent}
                    disabled={isSavingEvent}
                  >
                    <Plus className="h-4 w-4" />
                    {isSavingEvent ? 'Guardando...' : 'Guardar'}
                  </Button>
                  {showCalendarTour && currentCalendarTourStep.id === 'create' ? (
                    <CalendarTourCard
                      step={currentCalendarTourStep}
                      stepIndex={calendarTourStepIndex}
                      totalSteps={CALENDAR_TOUR_STEPS.length}
                      onNext={handleCalendarTourNext}
                      onPrevious={handleCalendarTourPrevious}
                      onClose={closeCalendarTour}
                      className="right-0 bottom-full mb-3 pointer-events-auto"
                    />
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
