export type PlanTopic = { materialId:string; materialTitle:string; title:string; estimatedMinutes:number };
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
