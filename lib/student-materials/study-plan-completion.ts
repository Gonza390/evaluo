import { additionalPlanPractice, recommendTopicActivities, type PlanDay, type RecommendedStudyActivity } from '@/lib/student-materials/study-plan-distribution';

export type PlanPracticeMode = Exclude<RecommendedStudyActivity['id'], 'resumen'>;
export type PlanPracticeCompletion = { material_id: string; topic_index: number; mode: PlanPracticeMode };
export const topicKey = (materialId: string, topicIndex: number) => `${materialId}:${topicIndex}`;
export const activityKey = (materialId: string, topicIndex: number, mode: PlanPracticeMode) => `${materialId}:${topicIndex}:${mode}`;

/** A topic is complete only after its reading and every activity in its saved plan.
 * Missing practice records never count as done. */
export function completedPlanTopics(
  days: PlanDay[], preferences: string[], dailyMinutes: number,
  readingKeys: Iterable<string>, practice: PlanPracticeCompletion[],
): string[] {
  const extra=additionalPlanPractice(days,preferences,dailyMinutes);
  const read = new Set(readingKeys);
  const done = new Set(practice.map(row => activityKey(row.material_id,row.topic_index,row.mode)));
  return [...new Set(days.flatMap(day => day.topics.flatMap(topic => {
    const key = topicKey(topic.materialId,topic.topicIndex);
    if (!read.has(key)) return [];
    const required = recommendTopicActivities(topic,preferences,dailyMinutes,extra.get(key)??0)
      .filter((step): step is RecommendedStudyActivity & {id:PlanPracticeMode} => step.id !== 'resumen');
    return required.every(step => done.has(activityKey(topic.materialId,topic.topicIndex,step.id)))
      ? [key] : [];
  })))];
}
