export type Activity = 'reading' | 'questions' | 'flashcards' | 'glossary';
export const progressKey = (id: string) => `evaluo_study_plan_progress_v1:${id}`;
export function markActivity(id: string, topic: number, activity: Activity) {
 if (typeof window === 'undefined' || topic < 0) return;
 try { const key=progressKey(id); const data=JSON.parse(localStorage.getItem(key)||'{}'); data[`${topic}:${activity}`]=true; localStorage.setItem(key,JSON.stringify(data)); } catch { /* storage disabled */ }
}
export type TopicActivities = { questions: boolean; flashcards: boolean; glossary: boolean; readingMinutes?: number; questionsMinutes?: number; flashcardsMinutes?: number; glossaryMinutes?: number };
export function getProgress(id: string, topics: TopicActivities[]) {
 const topicCount = topics.length;
 if (typeof window === 'undefined' || topicCount < 1) return {percent:0,done:0,total:0,read:0,record:{} as Record<string,boolean>};
 let record: Record<string, boolean>={}; let read=0;
 try {
  record=JSON.parse(localStorage.getItem(progressKey(id))||'{}');
  read=0;
 } catch { /* unavailable */ }
 let done=0; let total=0;
 for(let i=0;i<topicCount;i++) {
  total++; if(record[`${i}:reading`])done++;
  for(const activity of ['questions','flashcards','glossary'] as const) {
   if(!topics[i][activity]) continue;
   total++; if(record[`${i}:${activity}`])done++;
  }
 }
 return {done,total,read,record,percent:total?Math.round(100*done/total):0};
}
