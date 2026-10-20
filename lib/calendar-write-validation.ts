import { isUuid } from '@/lib/uuid';
import type { ExamInstance, CalendarEventType } from '@/lib/calendar-utils';

type CalendarDraft = {
  eventType: unknown;
  eventDate: unknown;
  examInstance: unknown;
  materiaId: unknown;
  carreraId: unknown;
  materialId: unknown;
  reminderDays: unknown;
};

type ValidatedCalendarDraft = {
  eventType: CalendarEventType;
  eventDate: string;
  examInstance: ExamInstance | null;
  materiaId: string | null;
  carreraId: string | null;
  materialId: string | null;
  reminderDays: number[] | null;
};

export type CalendarWriteValidation =
  | { ok: true; value: ValidatedCalendarDraft }
  | { ok: false; message: string };

/**
 * Refleja las restricciones CHECK/FK de study_calendar_events en Supabase.
 * Un valor inválido nunca debe enviarse a PostgREST como un 400 inesperado.
 */
export function validateCalendarWrite(input: CalendarDraft): CalendarWriteValidation {
  if (input.eventType !== 'exam' && input.eventType !== 'assignment') {
    return { ok: false, message: 'Seleccioná parcial o trabajo práctico.' };
  }
  const date = input.eventDate;
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { ok: false, message: 'Elegí una fecha válida.' };
  }
  const [year, month, day] = date.split('-').map(Number);
  const parsedDate = new Date(Date.UTC(year, month - 1, day));
  if (parsedDate.toISOString().slice(0, 10) !== date) {
    return { ok: false, message: 'La fecha elegida no existe en el calendario.' };
  }

  const validExamInstances = ['1', '2', 'integrador'];
  const examInstance = input.eventType === 'assignment' ? null : input.examInstance;
  if (
    examInstance !== null && examInstance !== undefined &&
    !validExamInstances.includes(String(examInstance))
  ) {
    return { ok: false, message: 'Seleccioná Parcial 1, Parcial 2 o Integrador.' };
  }

  for (const value of [input.materiaId, input.carreraId, input.materialId]) {
    if (value !== null && value !== undefined && value !== '' &&
        (typeof value !== 'string' || !isUuid(value))) {
      return { ok: false, message: 'La materia seleccionada ya no es válida. Volvé a elegirla.' };
    }
  }

  const rawReminders = input.eventType === 'exam' ? input.reminderDays : null;
  if (rawReminders !== null && rawReminders !== undefined &&
      (!Array.isArray(rawReminders) ||
        rawReminders.some(value => !Number.isInteger(value) || value < 1 || value > 365))) {
    return { ok: false, message: 'Los recordatorios seleccionados no son válidos.' };
  }

  const normalizedReminders = Array.isArray(rawReminders) && rawReminders.length > 0
    ? Array.from(new Set(rawReminders as number[])).sort((a, b) => b - a)
    : null;

  return {
    ok: true,
    value: {
      eventType: input.eventType,
      eventDate: date,
      examInstance: examInstance == null ? null : examInstance as ExamInstance,
      materiaId: typeof input.materiaId === 'string' && input.materiaId ? input.materiaId : null,
      carreraId: typeof input.carreraId === 'string' && input.carreraId ? input.carreraId : null,
      materialId: typeof input.materialId === 'string' && input.materialId ? input.materialId : null,
      reminderDays: normalizedReminders,
    },
  };
}

/** Mensaje accionable para errores PostgREST, sin exponer IDs ni detalles internos. */
export function describeCalendarSaveError(error: { code?: string; message?: string } | null) {
  if (error?.code === '23514') {
    return 'Algún dato del parcial o trabajo práctico no coincide con las opciones admitidas. Revisalo e intentá nuevamente.';
  }
  if (error?.code === '23503') {
    return 'La materia o carrera ya no está disponible. Volvé a seleccionarla.';
  }
  if (error?.code === '42501') {
    return 'Tu sesión no tiene permiso para guardar ese evento. Volvé a iniciar sesión.';
  }
  return 'No pudimos guardar ese evento. Intentá nuevamente.';
}
