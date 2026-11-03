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

/** Activity-level plan completion, including partial work on unfinished topics.
 * Counts each required summary and recommended practice once; optional reviews
 * from previous days are intentionally not required. */
export function planPreparationProgress(
  days:PlanDay[], preferences:string[], dailyMinutes:number,
  readingKeys:Iterable<string>, practice:PlanPracticeCompletion[],
): {completed:number;total:number;percent:number} {
  const read=new Set(readingKeys);
  const finished=new Set(practice.map(row=>activityKey(row.material_id,row.topic_index,row.mode)));
  const extras=additionalPlanPractice(days,preferences,dailyMinutes);
  const seen=new Set<string>();
  let completed=0;
  let total=0;
  for(const day of days)for(const topic of day.topics) {
    const key=topicKey(topic.materialId,topic.topicIndex);
    if(seen.has(key))continue;
    seen.add(key);
    total++;
    if(read.has(key))completed++;
    const required=recommendTopicActivities(topic,preferences,dailyMinutes,extras.get(key)??0);
    for(const step of required) {
      if(step.id==='resumen')continue;
      total++;
      if(finished.has(activityKey(topic.materialId,topic.topicIndex,step.id)))completed++;
    }
  }
  const rounded=total?Math.round(completed*100/total):0;
  return {completed,total,percent:completed===total?rounded:Math.min(99,rounded)};
}
