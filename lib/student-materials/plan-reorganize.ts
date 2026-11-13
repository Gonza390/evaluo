import { buildPlanSchedule } from '@/lib/student-materials/study-plan-builder';
import type { PlanDay, PlanTopic } from '@/lib/student-materials/study-plan-distribution';

const pad = (n: number) => String(n).padStart(2, '0');
export const planDateKey = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const keyOf = (topic: Pick<PlanTopic, 'materialId' | 'topicIndex'>) => `${topic.materialId}:${topic.topicIndex}`;

/** Temas de días anteriores a hoy que todavía no están completos. */
export function overduePlanTopics(
  days: readonly PlanDay[], completedKeys: Iterable<string>, today: string,
): { topics: PlanTopic[]; firstDate: string | null } {
  const done = new Set(completedKeys);
  const topics: PlanTopic[] = [];
  const seen = new Set<string>();
  let firstDate: string | null = null;
  for (const day of [...days].sort((a, b) => a.date.localeCompare(b.date))) {
    if (day.date >= today) break;
    for (const topic of day.topics) {
      const key = keyOf(topic);
      if (done.has(key) || seen.has(key)) continue;
      seen.add(key);
      topics.push(topic);
      firstDate ??= day.date;
    }
  }
  return { topics, firstDate };
}

export type ReorganizeResult =
  | { ok: true; schedule: PlanDay[]; overloadedTopics: number; moved: number }
  | { ok: false; error: 'exam_passed' | 'nothing_pending' | 'no_days' };

/**
 * Reparte solo lo pendiente entre hoy y el examen. Lo ya completado conserva su
 * lugar (el progreso no cambia) y la fecha del examen y las preferencias no se
 * tocan. Es una acción explícita del alumno: nunca se aplica en silencio.
 */
export function reorganizePlanSchedule(input: {
  days: readonly PlanDay[]; completedKeys: Iterable<string>; examDate: string;
  dailyMinutes: number; preferences: string[]; start: Date;
}): ReorganizeResult {
  const done = new Set(input.completedKeys);
  const startKey = planDateKey(input.start);
  if (input.examDate <= startKey) return { ok: false, error: 'exam_passed' };
  const ordered = [...input.days].sort((a, b) => a.date.localeCompare(b.date));
  const pending: PlanTopic[] = [];
  const seen = new Set<string>();
  const kept: PlanDay[] = [];
  for (const day of ordered) {
    const completed = day.topics.filter(topic => done.has(keyOf(topic)));
    for (const topic of day.topics) {
      const key = keyOf(topic);
      if (done.has(key) || seen.has(key)) continue;
      seen.add(key);
      // Se descartan las marcas congeladas: el reparto nuevo las recalcula.
      pending.push({
        materialId: topic.materialId, materialTitle: topic.materialTitle,
        topicIndex: topic.topicIndex, title: topic.title, estimatedMinutes: topic.estimatedMinutes,
      });
    }
    if (completed.length)
      kept.push({
        date: day.date, topics: completed,
        estimatedMinutes: completed.reduce((sum, topic) => sum + Math.max(1, topic.estimatedMinutes), 0),
      });
  }
  if (!pending.length) return { ok: false, error: 'nothing_pending' };
  const { schedule, overloadedTopics } = buildPlanSchedule(
    pending, input.examDate, input.dailyMinutes, input.preferences, input.start,
  );
  if (!schedule.length) return { ok: false, error: 'no_days' };
  const byDate = new Map<string, PlanDay>();
  for (const day of [...kept, ...schedule]) {
    const existing = byDate.get(day.date);
    byDate.set(day.date, existing
      ? { ...existing, topics: [...existing.topics, ...day.topics],
        estimatedMinutes: existing.estimatedMinutes + day.estimatedMinutes }
      : day);
  }
  return {
    ok: true, overloadedTopics, moved: pending.length,
    schedule: [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date)),
  };
}
