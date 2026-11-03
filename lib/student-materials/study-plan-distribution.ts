export type PlanTopic = { materialId:string; materialTitle:string; topicIndex:number; title:string; estimatedMinutes:number };
export type PlanDay = { date:string; topics:PlanTopic[]; estimatedMinutes:number };
const dateKey=(date:Date)=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
export function distributeStudyTopics(topics:PlanTopic[], examDate:string, minutesPerDay:number, startDate:Date):{days:PlanDay[];unassigned:PlanTopic[]} {
  if (!Number.isFinite(minutesPerDay)||minutesPerDay<=0||!/^\d{4}-\d{2}-\d{2}$/.test(examDate)) return {days:[],unassigned:topics};
  const cursor=new Date(startDate.getFullYear(),startDate.getMonth(),startDate.getDate(),12);
  const deadline=new Date(`${examDate}T12:00:00`);
  const days:PlanDay[]=[];
  while(cursor<deadline && days.length<365) {
    days.push({date:dateKey(cursor),topics:[],estimatedMinutes:0});
    cursor.setDate(cursor.getDate()+1);
  }
  let index=0;
  // No dividir artificialmente temas; si un tema supera el tiempo, reservarle un día.
  for(const topic of topics) {
    if(index>=days.length) break;
    const cost=Math.max(1,topic.estimatedMinutes);
    if(days[index].topics.length>0 && days[index].estimatedMinutes+cost>minutesPerDay) index++;
    if(index>=days.length) break;
    days[index].topics.push(topic);
    days[index].estimatedMinutes+=cost;
    if(days[index].estimatedMinutes>=minutesPerDay) index++;
  }
  const assigned=days.reduce((sum,day)=>sum+day.topics.length,0);
  return {days,unassigned:topics.slice(assigned)};
}


/** Keep the full calendar visible even when the available minutes are insufficient.
 * Overflow is distributed over existing study dates; the UI warns about overload. */
export function completeStudySchedule(
  topics:PlanTopic[], examDate:string, minutesPerDay:number, startDate:Date,
): {days:PlanDay[];overloadedTopics:number} {
  const initial=distributeStudyTopics(topics,examDate,minutesPerDay,startDate);
  const days=initial.days.map(day=>({...day,topics:[...day.topics]}));
  if(!days.length)return {days,overloadedTopics:initial.unassigned.length};
  for(const topic of initial.unassigned) {
    const day=days.reduce((least,current)=>current.estimatedMinutes<least.estimatedMinutes?current:least,days[0]!);
    day.topics.push(topic);
    day.estimatedMinutes+=Math.max(1,topic.estimatedMinutes);
  }
  return {days,overloadedTopics:initial.unassigned.length};
}

export type RecommendedStudyActivity = {
  id:'resumen'|'flashcards'|'unir'|'completar'|'opciones'|'casos'|'mixto'|'simulacro';
  label:string;href:string;
};

/** Stable activity rotation per topic; preferences are priorities, not a fixed recipe.
 * This recommendation layer does not generate AI content or change material progress. */
export function recommendTopicActivities(
  topic:Pick<PlanTopic,'materialId'|'topicIndex'>,preferences:string[],minutesPerDay:number,extraPractice=0,
): RecommendedStudyActivity[] {
  const root=`/dashboard/practicar/${encodeURIComponent(topic.materialId)}`;
  const summary=`/materiales/${encodeURIComponent(topic.materialId)}?tab=resumen&studyTopic=${topic.topicIndex}`;
  const bank:Array<RecommendedStudyActivity['id']>=[];
  if(preferences.includes('memorizar'))bank.push('flashcards','unir','completar');
  if(preferences.includes('practicar')) {
    bank.push('opciones','mixto','completar','unir');
    if(minutesPerDay>=45)bank.push('simulacro');
  }
  if(preferences.includes('casos'))bank.push('casos','opciones','mixto');
  const unique=[...new Set(bank)];
  const labels:Record<RecommendedStudyActivity['id'],string>={
    resumen:'Leer el resumen',flashcards:'Repasar flashcards',unir:'Unir conceptos',
    completar:'Completar conceptos',opciones:'Verdadero o falso',casos:'Resolver casos',
    mixto:'Práctica mixta',simulacro:'Simulacro de examen',
  };
  const activities:RecommendedStudyActivity[]=[{id:'resumen',label:labels.resumen,href:summary}];
  if(!unique.length)return activities;
  // Include one practice at 15–30 min, and two different practices at 45–60 min.
  const count=(minutesPerDay>=45?2:1)+Math.max(0,Math.min(1,Math.floor(extraPractice)));
  const offset=(topic.topicIndex+topic.materialId.length)%unique.length;
  for(let i=0;i<Math.min(count,unique.length);i++) {
    const id=unique[(offset+i)%unique.length]!;
    activities.push({id,label:labels[id],href:`${root}/${id}?repaso=rapido`});
  }
  return activities;
}

/** Account for the recommended practice in the daily budget, not just reading. */
export function estimateTopicSessionMinutes(
  readingMinutes:number, preferences:string[], minutesPerDay:number,
): number {
  const hasPractice=preferences.some(value=>['memorizar','practicar','casos'].includes(value));
  const practiceMinutes=hasPractice?(minutesPerDay>=45?12:6):0;
  return Math.max(1,Math.ceil(readingMinutes))+practiceMinutes;
}

/** Use genuinely free time on planned days to suggest one more activity per topic.
 * Never add work to an already overloaded plan, and never add an unavailable
 * mode. Derived from the persisted schedule so reloads and progress agree. */
export function additionalPlanPractice(
  days: readonly PlanDay[],preferences:string[],dailyMinutes:number,
): Map<string,number> {
  const extras=new Map<string,number>();
  if(!Number.isFinite(dailyMinutes)||dailyMinutes<=0 ||
      days.some(day=>day.estimatedMinutes>dailyMinutes)) return extras;
  for(const day of days) {
    let remaining=dailyMinutes-day.estimatedMinutes;
    for(const topic of day.topics) {
      if(remaining<8)break;
      const current=recommendTopicActivities(topic,preferences,dailyMinutes);
      const expanded=recommendTopicActivities(topic,preferences,dailyMinutes,1);
      if(expanded.length<=current.length)continue;
      extras.set(`${topic.materialId}:${topic.topicIndex}`,1);
      remaining-=8;
    }
  }
  return extras;
}
