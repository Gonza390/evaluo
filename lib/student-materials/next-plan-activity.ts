import {
  additionalPlanPractice, recommendTopicActivities, type PlanDay,
} from '@/lib/student-materials/study-plan-distribution';
import {
  activityKey, topicKey, type PlanPracticeCompletion, type PlanPracticeMode,
} from '@/lib/student-materials/study-plan-completion';

export type NextPlanActivity = {
  href: string;
  /** Etiqueta de la actividad (clave de `studyUiText`). */
  label: string;
  topicTitle: string;
};

export const PLAN_HOME_HREF = '/dashboard/plan-de-estudio';

/**
 * Primera actividad pendiente del plan, en el orden del calendario, sin contar
 * la que el alumno acaba de terminar. No usa fechas: «siguiente» es la próxima
 * por hacer, esté vencida, sea de hoy o de mañana.
 */
export function nextPlanActivity(input: {
  days: PlanDay[]; preferences: string[]; dailyMinutes: number;
  readingKeys: Iterable<string>; practice: PlanPracticeCompletion[];
  /** Actividad que se está cerrando: se considera hecha aunque aún no se guarde. */
  current: { materialId: string; topicIndex: number; mode: PlanPracticeMode };
}): NextPlanActivity | null {
  const read = new Set(input.readingKeys);
  const done = new Set(input.practice.map(row => activityKey(row.material_id, row.topic_index, row.mode)));
  done.add(activityKey(input.current.materialId, input.current.topicIndex, input.current.mode));
  const extras = additionalPlanPractice(input.days, input.preferences, input.dailyMinutes);
  const seen = new Set<string>();
  for (const day of [...input.days].sort((a, b) => a.date.localeCompare(b.date))) {
    for (const topic of day.topics) {
      const key = topicKey(topic.materialId, topic.topicIndex);
      if (seen.has(key)) continue;
      seen.add(key);
      for (const step of recommendTopicActivities(topic, input.preferences, input.dailyMinutes, extras.get(key) ?? 0)) {
        if (step.id === 'resumen') {
          if (!read.has(key)) return { href: step.href, label: step.label, topicTitle: topic.title };
          continue;
        }
        if (!done.has(activityKey(topic.materialId, topic.topicIndex, step.id)))
          return { href: `${step.href}&planTopic=${topic.topicIndex}`, label: step.label, topicTitle: topic.title };
      }
    }
  }
  return null;
}
