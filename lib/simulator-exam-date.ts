'use client';

import { supabase } from '@/lib/supabase-client';

export type SimulatorExamEvent = {
  id: string;
  eventDate: string;
  sourcePayload: Record<string, unknown>;
  reminderDaysBefore: unknown;
};

export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getSimulatorExamInstance(parcial: number) {
  return Number(parcial) === 3 ? 'integrador' : `parcial_${Number(parcial) === 2 ? 2 : 1}`;
}

export function getSimulatorExamLabel(parcial: number) {
  return Number(parcial) === 3 ? 'Integrador' : `Parcial ${Number(parcial) === 2 ? 2 : 1}`;
}

export function formatSimulatorExamDate(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  if (!year || !month || !day) return dateKey;

  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
}

export function getDaysUntilExam(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  if (!year || !month || !day) return null;

  const target = Date.UTC(year, month - 1, day, 12);
  const todayKey = getLocalDateKey();
  const [todayYear, todayMonth, todayDay] = todayKey.split('-').map(Number);
  const today = Date.UTC(todayYear, todayMonth - 1, todayDay, 12);
  const diff = Math.ceil((target - today) / 86_400_000);
  return Number.isFinite(diff) ? diff : null;
}

function normalizeSourcePayload(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

export async function findSimulatorExamEvent(input: {
  userId: string;
  materiaId: string;
  parcial: number;
}) {
  const { data, error } = await supabase
    .from('study_calendar_events')
    .select('id,event_date,source_payload,reminder_days_before')
    .eq('user_id', input.userId)
    .eq('event_type', 'exam')
    .eq('materia_id', input.materiaId)
    .eq('exam_instance', getSimulatorExamInstance(input.parcial))
    .gte('event_date', getLocalDateKey())
    .order('event_date', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    eventDate: data.event_date,
    sourcePayload: normalizeSourcePayload(data.source_payload),
    reminderDaysBefore: data.reminder_days_before,
  } satisfies SimulatorExamEvent;
}

export async function saveSimulatorExamEvent(input: {
  userId: string;
  materiaId: string;
  materiaNombre: string;
  parcial: number;
  eventDate: string;
  source: 'simulator_intro' | 'simulator_result' | 'simulator_edit';
  existingEventId?: string | null;
}) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.eventDate)) {
    throw new Error('Elegí una fecha válida.');
  }
  if (input.eventDate < getLocalDateKey()) {
    throw new Error('La fecha del examen no puede estar en el pasado.');
  }

  let existing:
    | {
        id: string;
        source_payload: unknown;
      }
    | null = null;

  if (input.existingEventId) {
    const { data, error } = await supabase
      .from('study_calendar_events')
      .select('id,source_payload')
      .eq('id', input.existingEventId)
      .eq('user_id', input.userId)
      .maybeSingle();

    if (error) throw error;
    existing = data;
  }

  if (!existing) {
    const { data, error } = await supabase
      .from('study_calendar_events')
      .select('id,source_payload')
      .eq('user_id', input.userId)
      .eq('event_type', 'exam')
      .eq('materia_id', input.materiaId)
      .eq('exam_instance', getSimulatorExamInstance(input.parcial))
      .gte('event_date', getLocalDateKey())
      .order('event_date', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    existing = data;
  }

  const sourcePayload = {
    ...normalizeSourcePayload(existing?.source_payload),
    simulator_exam_context: true,
    simulator_exam_source: input.source,
    parcial: input.parcial,
  };
  const title = `${input.materiaNombre || 'Examen'} · ${getSimulatorExamLabel(input.parcial)}`;
  const now = new Date().toISOString();

  if (existing?.id) {
    const { data, error } = await supabase
      .from('study_calendar_events')
      .update({
        event_date: input.eventDate,
        title,
        materia_nombre: input.materiaNombre || null,
        source_payload: sourcePayload,
        updated_at: now,
      })
      .eq('id', existing.id)
      .eq('user_id', input.userId)
      .select('id,event_date,source_payload,reminder_days_before')
      .single();

    if (error) throw error;
    return {
      id: data.id,
      eventDate: data.event_date,
      sourcePayload: normalizeSourcePayload(data.source_payload),
      reminderDaysBefore: data.reminder_days_before,
    } satisfies SimulatorExamEvent;
  }

  const { data, error } = await supabase
    .from('study_calendar_events')
    .insert({
      user_id: input.userId,
      event_type: 'exam',
      title,
      notes: null,
      event_date: input.eventDate,
      materia_id: input.materiaId,
      materia_nombre: input.materiaNombre || null,
      exam_instance: getSimulatorExamInstance(input.parcial),
      source_payload: sourcePayload,
      reminder_days_before: null,
    })
    .select('id,event_date,source_payload,reminder_days_before')
    .single();

  if (error) throw error;
  return {
    id: data.id,
    eventDate: data.event_date,
    sourcePayload: normalizeSourcePayload(data.source_payload),
    reminderDaysBefore: data.reminder_days_before,
  } satisfies SimulatorExamEvent;
}

function getPendingExamDateStorageKey(materiaId: string, parcial: number) {
  return `evaluo:simulator_exam_date_pending:${materiaId}:${parcial}`;
}

export function readPendingSimulatorExamDate(materiaId: string, parcial: number) {
  try {
    const value = window.localStorage.getItem(getPendingExamDateStorageKey(materiaId, parcial));
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    if (value < getLocalDateKey()) {
      window.localStorage.removeItem(getPendingExamDateStorageKey(materiaId, parcial));
      return null;
    }
    return value;
  } catch {
    return null;
  }
}

export function writePendingSimulatorExamDate(
  materiaId: string,
  parcial: number,
  eventDate: string
) {
  try {
    if (!eventDate) {
      window.localStorage.removeItem(getPendingExamDateStorageKey(materiaId, parcial));
      return;
    }
    window.localStorage.setItem(getPendingExamDateStorageKey(materiaId, parcial), eventDate);
  } catch {
    // La fecha es contexto opcional; nunca bloquea el simulador.
  }
}

export function clearPendingSimulatorExamDate(materiaId: string, parcial: number) {
  try {
    window.localStorage.removeItem(getPendingExamDateStorageKey(materiaId, parcial));
  } catch {
    // noop
  }
}
