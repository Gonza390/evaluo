import {
  completeStudySchedule,
  estimateTopicSessionMinutes,
  savePlanPracticeRecommendations,
  type PlanDay,
  type PlanTopic,
} from '@/lib/student-materials/study-plan-distribution';

/**
 * Armado del plan de estudio a partir de los temas de los materiales.
 * Lo usan el plan manual (`app/api/study-plans/route.ts`) y el plan automático
 * (`lib/student-materials/auto-study-plan.ts`), para que ambos repartan igual.
 */
export const MAX_PLAN_TOPICS = 400;

export function buildPlanTopics(
  materials: Array<{ id: string; title: string }>,
  summarySectionsByMaterialId: Map<string, unknown>,
  preferences: string[],
  minutesPerDay: number
): PlanTopic[] {
  return materials
    .flatMap((material) => {
      const sections = summarySectionsByMaterialId.get(material.id);
      if (!Array.isArray(sections)) return [];
      return sections.map((section, index) => {
        const info = section as { title?: unknown; body?: unknown };
        const words =
          typeof info.body === 'string' ? info.body.trim().split(/\s+/u).filter(Boolean).length : 0;
        return {
          materialId: material.id,
          materialTitle: material.title,
          topicIndex: index,
          title:
            typeof info.title === 'string' && info.title.trim() ? info.title.trim() : `Tema ${index + 1}`,
          estimatedMinutes: estimateTopicSessionMinutes(
            Math.max(10, Math.ceil(words / 180) + 10),
            preferences,
            minutesPerDay
          ),
        };
      });
    })
    .slice(0, MAX_PLAN_TOPICS);
}

export function buildPlanSchedule(
  topics: PlanTopic[],
  examDate: string,
  minutesPerDay: number,
  preferences: string[],
  start: Date
): { schedule: PlanDay[]; overloadedTopics: number } {
  const { days, overloadedTopics } = completeStudySchedule(topics, examDate, minutesPerDay, start);
  const schedule = savePlanPracticeRecommendations(
    days.filter((day) => day.topics.length > 0),
    preferences,
    minutesPerDay
  );
  return { schedule, overloadedTopics };
}
