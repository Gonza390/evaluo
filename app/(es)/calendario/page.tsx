'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BellRing,
  BookOpenText,
  ArrowRight,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  FileText,
  GraduationCap,
  Loader2,
  Plus,
  Trash2,
} from 'lucide-react';
import { checkProfileStatus } from '@/lib/actions/perfil';
import { useUser } from '@/hooks/useUser';
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
import { validateCalendarWrite, describeCalendarSaveError } from '@/lib/calendar-write-validation';
import { trackMarketingEvent } from '@/lib/marketing-analytics';
import { PremiumUpsell } from '@/components/premium/premium-upsell';
import { AppPageHeader } from '@/components/ui/app-page-header';
import type { PlanDay } from '@/lib/student-materials/study-plan-distribution';

type CalendarStorageMode = 'supabase' | 'local';
type CalendarStudyPlan = { exam_date: string; schedule: PlanDay[]; updated_at: string };
type OwnerStudyPlan = { userId: string; plan: CalendarStudyPlan | null };

function normalizeCalendarStudyPlan(value: unknown): CalendarStudyPlan | null {
  if (!value || typeof value !== 'object') return null;
  const plan = value as Partial<CalendarStudyPlan>;
  if (typeof plan.exam_date !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(plan.exam_date) ||
      !Array.isArray(plan.schedule)) return null;

  // Un plan antiguo o parcialmente corrupto no debe romper el calendario.
  const schedule: PlanDay[] = [];
  for (const day of plan.schedule) {
    if (!day || typeof day.date !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(day.date) ||
        !Array.isArray(day.topics)) continue;
    const topics = day.topics.filter(topic =>
      topic && typeof topic.materialId === 'string' &&
      typeof topic.title === 'string' && Number.isInteger(topic.topicIndex)
    );
    if (!topics.length) continue;
    const minutes = Number.isFinite(day.estimatedMinutes)
      ? Math.max(0, day.estimatedMinutes)
      : topics.reduce((sum, topic) =>
          sum + (Number.isFinite(topic.estimatedMinutes) ? Math.max(0, topic.estimatedMinutes) : 0), 0);
    schedule.push({ ...day, topics, estimatedMinutes: minutes });
  }
  return {
    exam_date: plan.exam_date,
    updated_at: typeof plan.updated_at === 'string' ? plan.updated_at : '',
    schedule,
  };
}

const WEEKDAY_LABELS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const DEFAULT_FORM_STATE = DEFAULT_CALENDAR_FORM_STATE;

function getLocalCalendarStorageKey(userId: string) {
  return `evaluo_calendar_events_${userId}`;
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
      materialId: null,
      materiaId: selectedMateria?.id ?? null,
      materiaNombre: subjectName,
      carreraId: careerId,
      carreraNombre: careerName,
      examInstance: formState.examInstance,
      reminderDays: [7, 3, 1],
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
    materialId: null,
    materiaId: null,
    materiaNombre: null,
    carreraId: careerId,
    carreraNombre: careerName,
    examInstance: null,
    reminderDays: [] as number[],
    sourcePayload: {
      assignmentTitle,
      careerId,
      careerName,
    } satisfies CalendarEventSourcePayload,
  };
}

export default function CalendarioPage() {
  const { user, loading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);
  const [isSavingEvent, setIsSavingEvent] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [visibleMonth, setVisibleMonth] = useState<Date>(getMonthStart(new Date()));
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [formState, setFormState] = useState(DEFAULT_FORM_STATE);
  const [events, setEvents] = useState<StudyCalendarEvent[]>([]);
  const [ownerStudyPlan, setOwnerStudyPlan] = useState<OwnerStudyPlan | null>(null);
  const [studyPlanLoadError, setStudyPlanLoadError] = useState(false);
  const [hasLoadedEvents, setHasLoadedEvents] = useState(false);
  const [storageMode, setStorageMode] = useState<CalendarStorageMode>('supabase');
  const [careerMateriaOptions, setCareerMateriaOptions] = useState<CareerMateriaOption[]>([]);
  const [careerMateriaLoading, setCareerMateriaLoading] = useState(false);
  const [careerId, setCareerId] = useState<string | null>(null);
  const [careerName, setCareerName] = useState<string | null>(null);
  const [showPremiumUpsell, setShowPremiumUpsell] = useState(false);

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
          'id, event_type, title, notes, event_date, created_at, material_id, materia_id, materia_nombre, carrera_id, carrera_nombre, exam_instance, source_payload, reminder_days_before'
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
          description: 'No pudimos cargar tu calendario. Volvé a intentarlo en unos segundos.',
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
          materialId: event.material_id ?? null,
          materiaId: event.materia_id ?? null,
          materiaNombre: event.materia_nombre ?? null,
          carreraId: event.carrera_id ?? null,
          carreraNombre: event.carrera_nombre ?? null,
          examInstance:
            event.exam_instance === '1' ||
            event.exam_instance === '2' ||
            event.exam_instance === 'integrador'
              ? event.exam_instance
              : null,
          sourcePayload:
            event.source_payload && typeof event.source_payload === 'object'
              ? (event.source_payload as CalendarEventSourcePayload)
              : null,
          reminderDays: Array.isArray(event.reminder_days_before)
            ? (event.reminder_days_before as number[]).map(Number)
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
          supabase
            .from('materias')
            .select('id, nombre')
            .eq('carrera_id', carreraId)
            .order('nombre'),
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

  // Fechas calculadas desde el plan persistido: no se agregan eventos de calendario.
  useEffect(() => {
    const userId = user?.id;
    if (!userId) return;
    const controller = new AbortController();
    const loadStudyPlan = async () => {
      try {
        const response = await fetch('/api/study-plans?view=calendar', {
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('No pudimos recuperar la planificación del calendario.');
        const data = (await response.json()) as { plan?: unknown };
        if (controller.signal.aborted) return;
        setOwnerStudyPlan({ userId, plan: normalizeCalendarStudyPlan(data?.plan) });
        setStudyPlanLoadError(false);
      } catch (error) {
        if (controller.signal.aborted) return;
        logError('calendario.loadStudyPlan', error, { userId });
        setOwnerStudyPlan({ userId, plan: null });
        setStudyPlanLoadError(true);
      }
    };
    void loadStudyPlan();
    return () => controller.abort();
  }, [user?.id]);

  const activeStudyPlan = ownerStudyPlan && user && ownerStudyPlan.userId === user.id
    ? ownerStudyPlan.plan : null;
  const studyPlanDaysByDate = useMemo(() => {
    const result = new Map<string, PlanDay>();
    for (const day of activeStudyPlan?.schedule ?? []) {
      if (!day || typeof day.date !== 'string' || !Array.isArray(day.topics) || day.topics.length === 0) continue;
      result.set(day.date, day);
    }
    return result;
  }, [activeStudyPlan]);

  const selectedDateKey = formatStorageDate(selectedDate);
  const selectedStudyPlanDay = studyPlanDaysByDate.get(selectedDateKey);
  const selectedPlanExam = activeStudyPlan?.exam_date === selectedDateKey;
  const selectionInVisibleMonth =
    selectedDate.getFullYear() === visibleMonth.getFullYear() &&
    selectedDate.getMonth() === visibleMonth.getMonth();

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

  const resetForm = () => {
    setFormState((current) => ({
      type: current.type,
      subjectName: '',
      selectedMateriaId: null,
      examInstance: current.type === 'exam' ? current.examInstance : '1',
      assignmentTitle: '',
      reminderDays: current.type === 'exam' ? [7, 3, 1] : [],
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
            ? 'Escribí el nombre de la materia para guardar ese parcial.'
            : 'Escribí el nombre del trabajo práctico para guardarlo.',
        variant: 'destructive',
      });
      return;
    }

    if (!user) {
      toast({
        description: 'Iniciá sesión para guardar fechas en tu calendario.',
        variant: 'destructive',
      });
      return;
    }

    // Guardar únicamente los valores admitidos por las restricciones de Postgres.
    const checked = validateCalendarWrite({
      eventType: payload.type,
      eventDate: selectedDateKey,
      examInstance: payload.examInstance,
      materiaId: payload.materiaId,
      carreraId: payload.carreraId,
      materialId: payload.materialId,
      reminderDays: payload.reminderDays,
    });
    if (!checked.ok) {
      toast({ description: checked.message, variant: 'destructive' });
      return;
    }
    const validEvent = checked.value;

    // El calendario no limita la cantidad de parciales según el plan del usuario.

    if (storageMode === 'local') {
      const newEvent: StudyCalendarEvent = {
        id: `${selectedDateKey}-${Date.now()}`,
        type: payload.type,
        title: payload.title,
        date: selectedDateKey,
        notes: payload.notes,
        createdAt: new Date().toISOString(),
        materialId: payload.materialId,
        materiaId: payload.materiaId,
        materiaNombre: payload.materiaNombre,
        carreraId: payload.carreraId,
        carreraNombre: payload.carreraNombre,
        examInstance: payload.examInstance,
        sourcePayload: payload.sourcePayload,
        reminderDays: payload.reminderDays,
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
        event_type: validEvent.eventType,
        title: payload.title,
        notes: payload.notes || null,
        event_date: validEvent.eventDate,
        material_id: validEvent.materialId,
        materia_id: validEvent.materiaId,
        materia_nombre: payload.materiaNombre,
        carrera_id: validEvent.carreraId,
        carrera_nombre: payload.carreraNombre,
        exam_instance: validEvent.examInstance,
        source_payload: payload.sourcePayload,
        reminder_days_before: validEvent.reminderDays,
      })
      .select(
        'id, event_type, title, notes, event_date, created_at, material_id, materia_id, materia_nombre, carrera_id, carrera_nombre, exam_instance, source_payload, reminder_days_before'
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
          materialId: payload.materialId,
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
        postgresCode: error?.code ?? null,
      });
      toast({
        description: describeCalendarSaveError(error),
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
        materialId: data.material_id ?? null,
        materiaId: data.materia_id ?? null,
        materiaNombre: data.materia_nombre ?? null,
        carreraId: data.carrera_id ?? null,
        carreraNombre: data.carrera_nombre ?? null,
        examInstance:
          data.exam_instance === '1' ||
          data.exam_instance === '2' ||
          data.exam_instance === 'integrador'
            ? data.exam_instance
            : null,
        sourcePayload:
          data.source_payload && typeof data.source_payload === 'object'
            ? (data.source_payload as CalendarEventSourcePayload)
            : null,
        reminderDays: Array.isArray(data.reminder_days_before)
          ? (data.reminder_days_before as number[]).map(Number)
          : null,
      },
    ]);
    resetForm();
    setIsComposerOpen(false);
    if (payload.type === 'exam') {
      trackMarketingEvent('reminder_created', {
        event_id: data.id,
        days_before: '7,3,1',
        materia_id: payload.materiaId ?? undefined,
      });
    }
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
      <div className="mx-auto flex min-h-[60vh] w-full max-w-[720px] items-center justify-center px-4">
        <StudyStatePanel
          icon={Loader2}
          iconSpin
          tone="loading"
          eyebrow="Calendario"
          title="Estamos preparando tu calendario"
          description="Cargamos tus fechas, materias y recordatorios para mostrarte el mes listo para usar."
          secondaryText="Si tarda demasiado, probá recargando la página."
          className="w-full"
        />
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
          description="Iniciá sesión para cargar parciales, trabajos prácticos y recordatorios en tu calendario mensual."
          secondaryText="Cuando entres, podrás organizar tus fechas clave y seguirlas desde un solo lugar."
          primaryActionLabel="Iniciar sesión"
          onPrimaryAction={() => router.push('/login?next=%2Fcalendario')}
        />
      </div>
    );
  }

  if (!hasLoadedEvents) {
    return (
      <div className="mx-auto w-full max-w-[720px]">
        <StudyStatePanel
          icon={Loader2}
          iconSpin
          tone="loading"
          eyebrow="Calendario"
          title="Estamos trayendo tus fechas del mes"
          description="Cuando termine esta carga vas a poder agregar parciales y trabajos prácticos al instante."
          className="w-full"
        />
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto w-full max-w-[1240px] min-w-0 space-y-2.5 overflow-x-clip px-3 py-2 sm:space-y-3 sm:px-4 sm:py-3 lg:px-6 lg:py-3">
        <AppPageHeader
          size="compact"
          title="Calendario"
          description="Organizá parciales, trabajos prácticos y recordatorios en un solo lugar."
        />
        <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_3px_14px_rgba(15,23,42,0.025)]">
          <div className="relative p-1 min-[380px]:p-1.5 sm:p-2">
            <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/90 bg-white">
              <div
                className="flex min-w-0 flex-nowrap items-center justify-between gap-1 border-b border-slate-200/80 bg-white px-1.5 py-1.5 min-[380px]:px-3 sm:gap-2 sm:px-4 sm:py-2"
              >
                <div className="flex min-w-0 shrink items-center gap-0 sm:gap-1">
                  <button
                    type="button"
                    onClick={() => setVisibleMonth((current) => addMonths(current, -1))}
                    className="inline-flex h-8 w-6 shrink-0 items-center justify-center rounded-xl border border-transparent text-slate-500 transition hover:border-slate-200 hover:bg-white hover:text-slate-900 sm:h-9 sm:w-9"
                    aria-label="Mes anterior"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <h2 className="text-foreground min-w-0 whitespace-nowrap text-[13px] font-medium tracking-[-0.04em] min-[380px]:text-[15px] sm:text-[20px]">
                    {formatMonthLabel(visibleMonth)}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setVisibleMonth((current) => addMonths(current, 1))}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-transparent text-slate-500 transition hover:border-slate-200 hover:bg-white hover:text-slate-900"
                    aria-label="Mes siguiente"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex shrink-0 flex-nowrap items-center gap-1 sm:gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const today = new Date();
                      setSelectedDate(today);
                      setVisibleMonth(getMonthStart(today));
                    }}
                    className="h-8 rounded-xl border border-slate-200 bg-white px-2 text-[12px] text-slate-700 shadow-sm hover:bg-white hover:text-slate-900 sm:px-3 sm:text-sm"
                  >
                    Hoy
                  </Button>
                  <Button
                    type="button"
                    onClick={() => openComposerForDate(selectedDate)}
                    aria-label="Agregar evento"
                    className="h-8 min-w-8 rounded-xl bg-primary px-2 text-white shadow-sm hover:opacity-95 sm:px-4"
                  >
                    <CalendarPlus className="h-4 w-4" />
                    <span className="hidden whitespace-nowrap sm:inline">Agregar evento</span>
                  </Button>
                </div>
              </div>

              <div
                className="border-b border-slate-200/80 bg-slate-50/60"
                style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}
              >
                {WEEKDAY_LABELS.map((label) => (
                  <div
                    key={label}
                    className="min-w-0 border-r border-slate-200/80 px-0.5 py-1 text-center text-[11px] font-medium text-slate-600 last:border-r-0 sm:px-3 sm:py-1.5 sm:text-[12px]"
                  >
                    <span className="hidden sm:inline">{label}</span>
                    <span className="text-xs sm:hidden">{label.slice(0, 3)}</span>
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                }}
              >
                {monthGrid.map((date) => {
                  const dateKey = formatStorageDate(date);
                  const cellEvents = eventsByDate[dateKey] ?? [];
                  const planDay = studyPlanDaysByDate.get(dateKey);
                  const isPlanExamDay = activeStudyPlan?.exam_date === dateKey;
                  const isCurrentMonth = date.getMonth() === visibleMonth.getMonth();
                  const isSelected = dateKey === selectedDateKey;
                  const isToday = dateKey === formatStorageDate(new Date());

                  return (
                    <button
                      key={dateKey}
                      type="button"
                      onClick={() => {
                        // Si ya hay eventos manuales, conservar el acceso al editor habitual.
                        if (cellEvents.length > 0 || (!planDay && !isPlanExamDay)) {
                          openComposerForDate(date);
                        } else {
                          setSelectedDate(date);
                          setVisibleMonth(getMonthStart(date));
                        }
                      }}
                      aria-label={`${formatLongDate(date)}${cellEvents.length ? `, ${cellEvents.length} ${cellEvents.length === 1 ? 'evento' : 'eventos'}` : ''}${planDay ? `, ${planDay.topics.length} temas del plan` : ''}${isPlanExamDay ? ', examen del plan' : ''}`}
                      className={`group relative flex h-[48px] min-w-0 flex-col gap-0.5 overflow-hidden border-r border-b px-1 py-1 text-left transition last:border-r-0 hover:bg-white min-[380px]:h-[52px] min-[380px]:px-1.5 sm:h-[56px] sm:gap-1 sm:px-2 sm:py-1.5 ${
                        !isCurrentMonth ? 'text-slate-500' : 'text-slate-900'
                      }`}
                      style={{
                        borderRightColor: 'var(--border)',
                        borderBottomColor: 'var(--border)',
                        backgroundColor: isSelected
                          ? 'var(--calendar-selected-bg)'
                          : isCurrentMonth
                            ? 'var(--background)'
                            : 'color-mix(in oklch, var(--muted) 55%, var(--background))',
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <span
                          className="inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[12px] font-medium"
                          style={{
                            backgroundColor: isToday
                              ? 'var(--brand)'
                              : isPlanExamDay
                                ? '#FFF2E6'
                              : isSelected
                                ? 'var(--calendar-selected-bg)'
                                : 'transparent',
                            color: isToday
                              ? 'var(--primary-foreground)'
                              : isPlanExamDay
                                ? '#AD713D'
                              : isSelected
                                ? 'var(--calendar-selected-text)'
                                : undefined,
                          }}
                        >
                          {date.getDate()}
                        </span>
                      </div>

                      {/* Marcas independientes: no generan eventos ni aumentan la altura de la semana. */}
                      {(planDay || isPlanExamDay || cellEvents.length > 0) ? (
                        <div className="mt-auto flex min-w-0 items-center gap-1 overflow-hidden">
                          {planDay ? (
                            <span aria-hidden="true" data-calendar-plan-day className="size-1.5 shrink-0 rounded-full bg-brand" />
                          ) : null}
                          {isPlanExamDay ? (
                            <span aria-hidden="true" data-calendar-plan-exam className="size-1.5 shrink-0 rounded-full bg-[#D97706]" />
                          ) : null}
                          {cellEvents.length > 0 ? (
                            <div className="min-w-0 flex-1 overflow-hidden">
                              <span
                                aria-hidden="true"
                                className={`block size-1.5 rounded-full min-[480px]:hidden ${cellEvents[0]?.type === 'exam' ? 'bg-[#AD713D]' : 'bg-[#376CAD]'}`}
                              />
                              <div
                                className="hidden truncate rounded-md border px-1 py-0.5 text-[10px] leading-3 font-medium min-[480px]:block sm:text-[11px]"
                                style={{
                                  backgroundColor: cellEvents[0]?.type === 'exam' ? '#FFF2E6' : '#E8F2FF',
                                  borderColor: cellEvents[0]?.type === 'exam' ? '#F1DFC8' : '#D5E6FA',
                                  color: cellEvents[0]?.type === 'exam' ? '#AD713D' : '#376CAD',
                                }}
                              >
                                {cellEvents[0]?.title}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                      {cellEvents.length > 1 ? (
                        <span className="absolute right-1 top-1 text-[10px] leading-4 font-medium text-slate-500">
                          +{cellEvents.length - 1}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
        {activeStudyPlan ? (
          <section data-calendar-study-plan className="min-w-0 rounded-2xl border border-[#E7EBF4] bg-white px-3 py-2.5 sm:px-4">
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
              <div className="flex min-w-0 items-start gap-2">
                <BookOpenText className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold leading-4 text-heading sm:text-[13px]">
                    {selectionInVisibleMonth && selectedStudyPlanDay
                      ? `${selectedStudyPlanDay.topics.length} ${selectedStudyPlanDay.topics.length === 1 ? 'tema' : 'temas'} · ${selectedStudyPlanDay.estimatedMinutes} min previstos`
                      : selectionInVisibleMonth && selectedPlanExam
                        ? 'Examen de tu plan de estudio'
                        : 'Tu plan de estudio'}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-4 text-[#66758D]">
                    {selectionInVisibleMonth && (selectedStudyPlanDay || selectedPlanExam)
                      ? formatLongDate(selectedDate)
                      : `${studyPlanDaysByDate.size} días programados · Examen ${new Date(`${activeStudyPlan.exam_date}T12:00:00`).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}`}
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard/plan-de-estudio"
                className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-lg px-2 text-[12px] font-semibold text-brand transition-colors hover:bg-[#EEF2FF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                Ver mi plan <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </div>
            {selectionInVisibleMonth && selectedStudyPlanDay ? (
              <div data-calendar-selected-plan-day className="mt-2 flex min-w-0 flex-wrap gap-1.5 border-t border-[#EEF1F6] pt-2">
                {selectedStudyPlanDay.topics.slice(0, 2).map((topic, index) => (
                  <span key={`${topic.materialId}:${topic.topicIndex}:${index}`} className="max-w-full truncate rounded-md bg-[#EEF2FF] px-2 py-1 text-[11px] font-medium text-[#254C98]">
                    {topic.title}
                  </span>
                ))}
                {selectedStudyPlanDay.topics.length > 2 ? (
                  <span className="px-1 py-1 text-[11px] font-medium text-[#66758D]">
                    +{selectedStudyPlanDay.topics.length - 2} temas más
                  </span>
                ) : null}
              </div>
            ) : null}
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-[#66758D]">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-brand" aria-hidden="true" /> Día de estudio
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-[#D97706]" aria-hidden="true" /> Examen del plan
              </span>
            </div>
          </section>
        ) : studyPlanLoadError && user ? (
          <p role="status" className="px-1 text-[11px] text-[#66758D]">
            No pudimos mostrar tu plan en el calendario. Podés consultarlo desde{' '}
            <Link className="font-semibold text-brand underline underline-offset-2" href="/dashboard/plan-de-estudio">Plan de estudio</Link>.
          </p>
        ) : null}
      </div>

      <Dialog open={isComposerOpen} onOpenChange={setIsComposerOpen}>
        <DialogContent className="h-[min(78vh,640px)] w-[min(calc(100vw-1rem),360px)] max-w-[360px] overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-0 text-slate-900 shadow-[0_18px_56px_rgba(15,23,42,0.12)] md:h-auto md:max-h-[76vh] md:w-[680px] md:max-w-[680px] lg:w-[760px] lg:max-w-[760px]">
          <div className="relative h-full overflow-y-auto px-3.5 py-3.5 sm:px-5 sm:py-5 md:max-h-[76vh]">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_240px] lg:items-start">
              <DialogHeader className="space-y-2 text-left">
                <DialogTitle className="text-[18px] font-medium tracking-[-0.035em] text-heading">
                  Agregar fecha
                </DialogTitle>
                <DialogDescription className="text-[13px] leading-5 text-slate-500">
                  {formatLongDate(selectedDate)}
                </DialogDescription>
              </DialogHeader>

              <div className="rounded-2xl bg-slate-50/60 p-1">
                <div className="grid grid-cols-2 gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    className={`h-9 rounded-xl text-[13px] font-medium ${
                      formState.type === 'exam'
                        ? 'bg-white text-brand shadow-sm hover:bg-white'
                        : 'text-slate-600 hover:bg-white'
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
                    className={`h-9 rounded-xl text-[13px] font-medium ${
                      formState.type === 'assignment'
                        ? 'bg-white text-brand shadow-sm hover:bg-white'
                        : 'text-slate-600 hover:bg-white'
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

            <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_240px] lg:items-start">
              <div className="relative">
                <div
                  className="h-[332px] overflow-hidden"
                >
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
                            className="h-10 rounded-xl border-slate-200 bg-white text-[13px] text-slate-900 placeholder:text-slate-500"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[13px] font-medium text-slate-700">
                            Instancia
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {(['1', '2', 'integrador'] as ExamInstance[]).map((examInstance) => (
                              <Button
                                key={examInstance}
                                type="button"
                                variant="outline"
                                className={`h-9 rounded-xl px-2 text-[13px] ${
                                  formState.examInstance === examInstance
                                    ? 'border-brand/25 bg-brand/10 text-brand hover:bg-brand/10'
                                    : 'border-slate-200 bg-white text-slate-700 hover:bg-white'
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
                          <p className="text-[12px] text-slate-500">
                            {careerName
                              ? `Materias de ${careerName}`
                              : 'Buscaremos materias de la carrera que tenés cargada.'}
                          </p>
                          {careerMateriaLoading ? (
                            <span className="text-[12px] font-medium text-slate-500">
                              Cargando...
                            </span>
                          ) : null}
                        </div>

                        {careerMateriaLoading ? (
                          <div className="flex min-h-[112px] items-center rounded-xl border border-dashed border-slate-200 bg-white px-3 py-3 text-[13px] text-slate-500">
                            Cargando materias de tu carrera...
                          </div>
                        ) : filteredCareerMateriaOptions.length > 0 ? (
                          <div className="max-h-[112px] min-h-[112px] overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
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
                                className="flex w-full items-center rounded-xl px-3 py-2 text-left text-[13px] text-slate-700 transition hover:bg-white hover:text-slate-950"
                              >
                                {materia.nombre}
                              </button>
                            ))}
                          </div>
                        ) : formState.subjectName.trim().length > 0 ? (
                          <div className="flex min-h-[112px] items-center rounded-xl border border-dashed border-slate-200 bg-white px-3 py-3 text-[13px] text-slate-500">
                            No encontramos una materia de tu carrera con ese nombre.
                          </div>
                        ) : careerMateriaOptions.length === 0 ? (
                          <div className="flex min-h-[112px] items-center rounded-xl border border-dashed border-slate-200 bg-white px-3 py-3 text-[13px] text-slate-500">
                            Cuando tu carrera tenga materias asociadas, aparecerán aquí para
                            elegirlas.
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <div className="grid h-full grid-rows-[auto_auto_minmax(112px,1fr)] gap-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">
                          Trabajo práctico
                        </label>
                        <Input
                          value={formState.assignmentTitle}
                          onChange={(event) =>
                            setFormState((currentState) => ({
                              ...currentState,
                              assignmentTitle: event.target.value,
                            }))
                          }
                          placeholder="Ej: TP final de Derecho Privado"
                          className="h-10 rounded-xl border-slate-200 bg-white text-[13px] text-slate-900 placeholder:text-slate-500"
                        />
                      </div>
                      <div className="space-y-2 opacity-45">
                        <label className="text-[13px] font-medium text-slate-700">Instancia</label>
                        <div className="pointer-events-none grid grid-cols-3 gap-2">
                          {(['1', '2', 'integrador'] as ExamInstance[]).map((examInstance) => (
                            <Button
                              key={`assignment-${examInstance}`}
                              type="button"
                              variant="outline"
                              className="h-9 rounded-xl border-slate-200 bg-white px-2 text-[13px] text-slate-500"
                              disabled
                            >
                              {examInstanceLabel(examInstance)}
                            </Button>
                          ))}
                        </div>
                      </div>
                      <div className="flex min-h-[112px] flex-col justify-between rounded-xl border border-dashed border-slate-200 bg-white px-3 py-3 text-[13px] text-slate-500">
                        <p className="text-[12px] font-medium tracking-[0.14em] text-slate-500 uppercase">
                          Organizacion
                        </p>
                        <p>
                          Guardá la entrega con un nombre claro para ubicarla rápido en
                          recordatorios, calendario y seguimiento semanal.
                        </p>
                        <p className="text-[12px] text-slate-500">
                          Ejemplo: TP final de Derecho Privado.
                        </p>
                      </div>
                      <div className="hidden rounded-xl border border-dashed border-slate-200 bg-white px-3 py-3 text-[13px] text-slate-500">
                        Guardá la entrega con un nombre claro para poder usar esta información
                        después en recordatorios, analíticas o planificación.
                      </div>
                    </div>
                  )}
                </div>

              </div>

              <div className="space-y-3">
                <div className="rounded-2xl bg-slate-50/40 p-3">
                  <p className="text-[12px] font-medium tracking-[0.18em] text-slate-500 uppercase">
                    Vista previa
                  </p>
                  <div className="mt-2 min-h-[84px] rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[13px] leading-5 text-slate-600">
                    {formState.type === 'exam' ? (
                      <span>
                        Se guardará como{' '}
                        <strong className="text-slate-900">
                          {formState.subjectName.trim() || 'tu materia'} -{' '}
                          {examInstanceLabel(formState.examInstance)}
                        </strong>
                        .
                      </span>
                    ) : (
                      <span>
                        Se guardará como{' '}
                        <strong className="text-slate-900">
                          {formState.assignmentTitle.trim() || 'tu trabajo práctico'}
                        </strong>
                        .
                      </span>
                    )}
                  </div>
                </div>

                {formState.type === 'exam' ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_5px_24px_rgba(15,23,42,0.03)]">
                    <div className="flex items-center gap-2">
                      <BellRing className="h-4 w-4 text-blue-500" />
                      <p className="text-[12px] font-medium text-slate-800">Recordatorios</p>
                    </div>
                    <p className="mt-1.5 text-[12px] leading-5 text-slate-500">
                      Te vamos a avisar automáticamente por email 7, 3 y 1 día antes del examen.
                    </p>
                  </div>
                ) : null}

                {(selectedStudyPlanDay || selectedPlanExam) ? (
                  <div className="rounded-xl border border-[#D9E6FF] bg-[#F4F8FF] p-3">
                    <p className="text-[12px] font-semibold text-heading">
                      {selectedStudyPlanDay
                        ? `Tu plan: ${selectedStudyPlanDay.topics.length} ${selectedStudyPlanDay.topics.length === 1 ? 'tema' : 'temas'} · ${selectedStudyPlanDay.estimatedMinutes} min`
                        : 'Examen del plan de estudio'}
                    </p>
                    {selectedStudyPlanDay ? (
                      <div className="mt-1.5 flex min-w-0 flex-wrap gap-1">
                        {selectedStudyPlanDay.topics.slice(0, 2).map((topic, index) => (
                          <span key={`calendar-editor:${topic.materialId}:${topic.topicIndex}:${index}`} className="max-w-full truncate rounded-md bg-white px-2 py-1 text-[11px] text-[#42506A]">
                            {topic.title}
                          </span>
                        ))}
                        {selectedStudyPlanDay.topics.length > 2 ? (
                          <span className="px-1 py-1 text-[11px] text-[#66758D]">
                            +{selectedStudyPlanDay.topics.length - 2} más
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                    <Link href="/dashboard/plan-de-estudio" className="mt-1 inline-flex min-h-8 items-center gap-1 text-[11px] font-semibold text-brand">
                      Ver mi plan <ArrowRight className="size-3" aria-hidden="true" />
                    </Link>
                  </div>
                ) : null}
                {selectedDateEvents.length > 0 ? (
                  <div className="max-h-40 space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3">
                    <p className="text-[13px] font-medium text-slate-900">
                      Fechas de este día
                    </p>
                    {selectedDateEvents.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge
                              className={
                                event.type === 'exam'
                                  ? 'border-[#F1DFC8] bg-[#FFF2E6] text-[#AD713D]'
                                  : 'border-[#D5E6FA] bg-[#E8F2FF] text-[#376CAD]'
                              }
                              variant="outline"
                            >
                              {eventTypeLabel(event.type)}
                            </Badge>
                          </div>
                          <p className="mt-1.5 text-[13px] font-medium text-slate-900">
                            {event.title}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleDeleteEvent(event.id)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-white hover:text-rose-500"
                          aria-label="Eliminar fecha"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="min-h-[74px] rounded-xl border border-dashed border-slate-200 bg-white px-3 py-3 text-[13px] leading-5 text-slate-500">
                    No hay fechas para este día.
                  </div>
                )}

                <div className="relative flex items-center justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 rounded-xl border-slate-200 bg-white px-3.5 text-[13px] text-slate-700 hover:bg-white"
                    onClick={() => setIsComposerOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="h-9 rounded-xl bg-blue-600 px-3.5 text-[13px] font-medium text-white transition hover:bg-blue-700"
                    onClick={handleCreateEvent}
                    disabled={isSavingEvent}
                  >
                    <Plus className="h-4 w-4" />
                    {isSavingEvent ? 'Guardando...' : 'Guardar'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPremiumUpsell} onOpenChange={setShowPremiumUpsell}>
        <DialogContent className="w-[min(calc(100vw-1.5rem),420px)] rounded-2xl border border-slate-200/90 bg-white p-0 text-slate-900 shadow-[0_18px_56px_rgba(15,23,42,0.12)]">
          <div className="px-4 py-4 sm:px-5 sm:py-5">
            <PremiumUpsell
              title="Armá el plan para tu próximo parcial"
              description="Ya usaste los 3 exámenes del plan gratuito. Con Premium organizá toda la cursada y recibí recordatorios antes de cada fecha."
              source="calendario_exam_limit"
              features={[
                'Parciales ilimitados',
                'Organización completa de tus parciales',
                'Calendario completo para toda la cursada',
              ]}
              ctaLabel="Organizar mis parciales con Premium"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
