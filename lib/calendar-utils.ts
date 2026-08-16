export type CalendarEventType = 'exam' | 'assignment';
export type ExamInstance = '1' | '2' | 'integrador';

export type CalendarEventSourcePayload = {
  subjectName?: string;
  assignmentTitle?: string;
  examInstance?: ExamInstance | null;
  selectedMateriaId?: string | null;
  selectedFromSuggestions?: boolean;
  careerId?: string | null;
  careerName?: string | null;
};

export type StudyCalendarEvent = {
  id: string;
  type: CalendarEventType;
  title: string;
  date: string;
  notes: string;
  createdAt: string;
  materiaId: string | null;
  materiaNombre: string | null;
  carreraId: string | null;
  carreraNombre: string | null;
  examInstance: ExamInstance | null;
  sourcePayload: CalendarEventSourcePayload | null;
  reminderDays?: number[] | null;
};

export type CareerMateriaOption = {
  id: string;
  nombre: string;
};

export const DEFAULT_CALENDAR_FORM_STATE = {
  type: 'exam' as CalendarEventType,
  subjectName: '',
  selectedMateriaId: null as string | null,
  examInstance: '1' as ExamInstance,
  assignmentTitle: '',
  reminderDays: [] as number[],
};

/**
 * Devuelve la dayKey `YYYY-MM-DD` del día en la zona horaria de Argentina.
 * Es el helper canónico para rachas de estudio y calendarios locales.
 */
export function getArgentinaDayKey(dateInput: Date | string) {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value ?? '0000';
  const month = parts.find((part) => part.type === 'month')?.value ?? '00';
  const day = parts.find((part) => part.type === 'day')?.value ?? '00';

  return `${year}-${month}-${day}`;
}

/**
 * Desplaza una dayKey `YYYY-MM-DD` (interpretada en UTC) por `offset` días.
 */
export function shiftDayKey(dayKey: string, offset: number) {
  const [year, month, day] = dayKey.split('-').map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day));
  shifted.setUTCDate(shifted.getUTCDate() + offset);
  return shifted.toISOString().slice(0, 10);
}

/**
 * Índice de día de semana a partir de una dayKey (lunes = 0 ... domingo = 6).
 */
export function getWeekdayIndexFromDayKey(dayKey: string) {
  const [year, month, day] = dayKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const weekday = date.getUTCDay();
  return weekday === 0 ? 6 : weekday - 1;
}

export function formatStorageDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatLongDate(date: Date) {
  const formatted = new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function formatMonthLabel(date: Date) {
  const formatted = new Intl.DateTimeFormat('es-AR', {
    month: 'long',
    year: 'numeric',
  })
    .format(date)
    .replace(' de ', ' ');

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function getMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12);
}

export function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1, 12);
}

export function getCalendarGrid(month: Date) {
  const monthStart = getMonthStart(month);
  const startDay = (monthStart.getDay() + 6) % 7;
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - startDay);

  return Array.from({ length: 42 }, (_, index) => {
    const cellDate = new Date(gridStart);
    cellDate.setDate(gridStart.getDate() + index);
    return cellDate;
  });
}

export function isMissingCalendarTableError(error: { code?: string; message?: string } | null) {
  if (!error) {
    return false;
  }

  const message = String(error.message ?? '').toLowerCase();
  return error.code === '42P01' || message.includes('study_calendar_events');
}

export function eventTypeLabel(type: CalendarEventType) {
  return type === 'exam' ? 'Parcial' : 'Trabajo práctico';
}

export function examInstanceLabel(value: ExamInstance) {
  if (value === '1') return 'Parcial 1';
  if (value === '2') return 'Parcial 2';
  return 'Integrador';
}

export function buildEventPayload({
  formState,
  careerId,
  careerName,
  selectedMateria,
}: {
  formState: typeof DEFAULT_CALENDAR_FORM_STATE;
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
      reminderDays: formState.reminderDays,
      sourcePayload: {
        subjectName,
        examInstance: formState.examInstance,
        selectedMateriaId: selectedMateria?.id ?? formState.selectedMateriaId ?? null,
        selectedFromSuggestions: Boolean(selectedMateria),
        careerId,
        careerName,
      },
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
    reminderDays: [] as number[],
    sourcePayload: {
      assignmentTitle,
      careerId,
      careerName,
    },
  };
}
