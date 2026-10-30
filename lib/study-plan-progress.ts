import { supabase } from '@/lib/supabase-client';
export type Activity = 'reading' | 'questions' | 'flashcards' | 'glossary';
export const progressKey = (id: string) => `evaluo_study_plan_progress_v1:${id}`;
export function markActivity(id: string, topic: number, activity: Activity) {
 if (typeof window === 'undefined' || topic < 0) return;
 try { const key=progressKey(id); const data=JSON.parse(localStorage.getItem(key)||'{}'); data[`${topic}:${activity}`]=true; localStorage.setItem(key,JSON.stringify(data)); void persistActivity(id, topic, activity); } catch { /* storage disabled */ }
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

/** Progress is user-scoped in Supabase; browser storage is an offline cache. */
async function persistActivity(materialId: string, topicIndex: number, activity: Activity) {
 try {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('student_material_topic_activity_progress' as never).upsert({
   user_id: user.id, material_id: materialId, topic_index: topicIndex, activity
  } as never, { onConflict: 'user_id,material_id,topic_index,activity' });
 } catch { /* Keep local progress if disconnected. */ }
}
export async function syncStudyPlanProgress(materialId: string) {
 if (typeof window === 'undefined') return;
 try {
  const {data:{user}} = await supabase.auth.getUser();
  if (!user) return;
  const key=progressKey(materialId);
  const local=JSON.parse(localStorage.getItem(key)||'{}') as Record<string,boolean>;
  const {data,error}=await supabase.from('student_material_topic_activity_progress' as never)
    .select('topic_index,activity').eq('user_id',user.id).eq('material_id',materialId);
  if (error) return;
  for(const row of (data??[]) as Array<{topic_index:number;activity:Activity}>) {
   local[`${row.topic_index}:${row.activity}`]=true;
  }
  localStorage.setItem(key,JSON.stringify(local));
  // Backfill previously completed activities from this device.
  const missing=Object.keys(local).filter(k=>local[k] && /^\\d+:(reading|questions|flashcards|glossary)$/.test(k));
  for(const k of missing) {
   const [topic,activity]=k.split(':');
   await persistActivity(materialId,Number(topic),activity as Activity);
  }
 } catch { /* Offline mode remains available. */ }
}
