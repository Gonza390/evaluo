'use client';

import { supabase } from '@/lib/supabase-client';

export type SimulatorExamIntent = {
  id: string;
  eventDate: string;
};

export function getSimulatorExamInstance(parcial: number) {
  return Number(parcial) === 3 ? 'integrador' : `parcial_${Number(parcial) === 2 ? 2 : 1}`;
}

export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function pendingKey(materiaId: string, parcial: number) {
  return `evaluo:preguntero_exam_date:${materiaId}:${parcial}`;
}

export function readPendingExamDate(materiaId: string, parcial: number) {
  try {
    const value = window.localStorage.getItem(pendingKey(materiaId, parcial));
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    if (value < getLocalDateKey()) {
      window.localStorage.removeItem(pendingKey(materiaId, parcial));
      return null;
    }
    return value;
  } catch {
    return null;
  }
}

export function writePendingExamDate(materiaId: string, parcial: number, eventDate: string) {
  try {
    if (!eventDate) {
      window.localStorage.removeItem(pendingKey(materiaId, parcial));
      return;
    }
    window.localStorage.setItem(pendingKey(materiaId, parcial), eventDate);
  } catch {
    // Si el navegador bloquea storage, el simulador sigue funcionando; la fecha se volverá a pedir.
  }
}

export function clearPendingExamDate(materiaId: string, parcial: number) {
  try {
    window.localStorage.removeItem(pendingKey(materiaId, parcial));
  } catch {
    // noop
  }
}

function normalizePayload(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

export async function findFutureSimulatorExamIntent(input: {
  userId: string;
  materiaId: string;
  parcial: number;
}): Promise<SimulatorExamIntent | null> {
  const { data, error } = await supabase
    .from('study_calendar_events')
    .select('id,event_date')
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
  };
}

export async function saveSimulatorExamIntent(input: {
  userId: string;
  materiaId: string;
  materiaNombre: string;
  parcial: number;
  eventDate: string;
  existingEventId?: string | null;
}): Promise<SimulatorExamIntent> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.eventDate) || input.eventDate < getLocalDateKey()) {
    throw new Error('La fecha del examen no es válida.');
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
    ...normalizePayload(existing?.source_payload),
    source: 'preguntero',
    exam_intent: true,
    parcial: input.parcial,
  };
  const title = `${input.materiaNombre || 'Examen'} · ${
    Number(input.parcial) === 3 ? 'Integrador' : `Parcial ${input.parcial}`
  }`;

  if (existing?.id) {
    const { data, error } = await supabase
      .from('study_calendar_events')
      .update({
        event_date: input.eventDate,
        title,
        materia_nombre: input.materiaNombre || null,
        source_payload: sourcePayload,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .eq('user_id', input.userId)
      .select('id,event_date')
      .single();

    if (error) throw error;
    return { id: data.id, eventDate: data.event_date };
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
    .select('id,event_date')
    .single();

  if (error) throw error;
  return { id: data.id, eventDate: data.event_date };
}
