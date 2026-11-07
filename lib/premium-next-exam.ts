import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { logError } from '@/lib/observability';

/** Próximo examen del alumno para la línea de "Mejorar mi plan". */
export type UpgradeNextExam = {
  /** Materia o título del examen; null si no hay un nombre confiable. */
  subject: string | null;
  /** Días que faltan (0 = hoy), en hora de Argentina. */
  daysLeft: number;
};

const MAX_DAYS_AHEAD = 120;

function argentinaToday(now: Date): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const get = (type: string) => parts.find(part => part.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function daysBetween(today: string, date: string): number {
  return Math.round((Date.parse(`${date}T12:00:00Z`) - Date.parse(`${today}T12:00:00Z`)) / 86_400_000);
}

const cleanSubject = (value: unknown) =>
  typeof value === 'string' && value.trim().length >= 2 ? value.trim().slice(0, 80) : null;

/**
 * Busca el examen más cercano entre el calendario (event_type = 'exam') y la
 * fecha de examen cargada en los apuntes. Nunca falla: sin datos, devuelve null
 * y la pantalla muestra solo el título.
 */
export async function getUpgradeNextExam(
  supabase: SupabaseClient,
  userId: string,
  now = new Date(),
): Promise<UpgradeNextExam | null> {
  const today = argentinaToday(now);
  try {
    // exam_date existe en producción pero aún no en el tipo generado.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const [calendar, materials] = await Promise.all([
      db.from('study_calendar_events')
        .select('event_date, materia_nombre, title')
        .eq('user_id', userId).eq('event_type', 'exam')
        .gte('event_date', today)
        .order('event_date', { ascending: true }).limit(1),
      db.from('student_materials')
        .select('exam_date, title')
        .eq('user_id', userId).not('exam_date', 'is', null)
        .gte('exam_date', today)
        .order('exam_date', { ascending: true }).limit(1),
    ]);
    const candidates: { date: string; subject: string | null }[] = [];
    const event = calendar?.data?.[0];
    if (event?.event_date) {
      candidates.push({ date: event.event_date, subject: cleanSubject(event.materia_nombre) ?? cleanSubject(event.title) });
    }
    const material = materials?.data?.[0];
    if (material?.exam_date) {
      candidates.push({ date: material.exam_date, subject: cleanSubject(material.title) });
    }
    const next = candidates
      .filter(item => /^\d{4}-\d{2}-\d{2}$/.test(item.date))
      .sort((a, b) => a.date.localeCompare(b.date))[0];
    if (!next) return null;
    const daysLeft = daysBetween(today, next.date);
    if (daysLeft < 0 || daysLeft > MAX_DAYS_AHEAD) return null;
    return { subject: next.subject, daysLeft };
  } catch (error) {
    logError('premium.upgrade.nextExam', error, { userId });
    return null;
  }
}
