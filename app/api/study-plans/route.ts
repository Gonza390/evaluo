import { NextRequest, NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase-server';
import { completeStudySchedule, estimateTopicSessionMinutes, type PlanDay, type PlanTopic } from '@/lib/student-materials/study-plan-distribution';

type SavedPlan = {
  exam_date: string;
  daily_minutes: number;
  material_ids: string[];
  preferences: string[];
  schedule: PlanDay[];
  updated_at: string;
};
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const METHODS = new Set(['entender','memorizar','practicar','casos']);
const fail = (message: string, status = 400) => NextResponse.json({error: message}, {status});

async function userDb() {
  const supabase = await createClientServer();
  const {data:{user}} = await supabase.auth.getUser();
  return {supabase,user};
}
export async function GET() {
  const {supabase,user}=await userDb();
  if(!user)return fail('Iniciá sesión para consultar tu plan.',401);
  const {data,error}=await supabase.from('student_personal_study_plans' as never)
    .select('exam_date,daily_minutes,material_ids,preferences,schedule,updated_at')
    .eq('user_id',user.id).maybeSingle();
  if(error)return fail('No pudimos recuperar tu plan. Probá nuevamente.',503);
  const plan=data as SavedPlan|null;
  if(!plan)return NextResponse.json({plan:null,completedKeys:[]});
  const ids=Array.isArray(plan.material_ids)?plan.material_ids:[];
  if(!ids.length)return NextResponse.json({plan,completedKeys:[]});
  const result=await supabase.from('student_material_topic_activity_progress' as never)
    .select('material_id,topic_index').eq('user_id',user.id).eq('activity','reading').in('material_id',ids);
  if(result.error)return fail('No pudimos consultar el progreso de tu plan.',503);
  const entries=(result.data??[]) as Array<{material_id:string;topic_index:number}>;
  return NextResponse.json({
    plan,
    completedKeys:entries.map(row=>`${row.material_id}:${row.topic_index}`)
  });
}
export async function POST(request:NextRequest) {
  const {supabase,user}=await userDb();
  if(!user)return fail('Iniciá sesión para guardar el plan.',401);
  const body=await request.json().catch(()=>null) as Record<string,unknown>|null;
  if(!body||!DATE.test(String(body.examDate??'')))return fail('Elegí una fecha válida.');
  const examDate=String(body.examDate);
  const parsed=new Date(`${examDate}T12:00:00Z`);
  const now=new Date();
  const serverDay=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate(),12));
  if(!Number.isFinite(parsed.getTime())||parsed<=serverDay||parsed.getTime()-serverDay.getTime()>366*86400000)
    return fail('La fecha del examen debe ser futura y estar dentro del próximo año.');
  const minutes=Number(body.minutesPerDay);
  if(![15,30,45,60].includes(minutes))return fail('Elegí los minutos disponibles por día.');
  const ids=Array.isArray(body.materialIds)?body.materialIds:[];
  if(!ids.length||ids.length>20||ids.some(x=>typeof x!=='string'||!UUID.test(x))||new Set(ids).size!==ids.length)
    return fail('Elegí entre 1 y 20 materiales válidos.');
  const preferences=Array.isArray(body.preferences)?body.preferences:[];
  if(!preferences.length||preferences.length>4||preferences.some(x=>typeof x!=='string'||!METHODS.has(x)))
    return fail('Elegí al menos una modalidad de estudio.');
  const materialIds=ids as string[];
  const {data:materials,error:materialsError}=await supabase.from('student_materials')
    .select('id,title').eq('user_id',user.id).eq('processing_status','ready').in('id',materialIds);
  if(materialsError||!materials||materials.length!==materialIds.length)
    return fail('Uno o más materiales no están disponibles para esta cuenta.',403);
  const summaryResult=await supabase.from('student_material_summaries')
    .select('student_material_id,summary_sections').in('student_material_id',materialIds);
  if(summaryResult.error)return fail('No pudimos obtener los temas de tus archivos.',503);
  const byId=new Map((summaryResult.data??[]).map(s=>[s.student_material_id,s.summary_sections]));
  const topics:PlanTopic[]=materials.flatMap(material=>{
    const sections=byId.get(material.id);
    if(!Array.isArray(sections))return [];
    return sections.map((section,index)=>{
      const info=section as {title?:unknown;body?:unknown};
      const words=typeof info.body==='string'?info.body.trim().split(/\s+/u).filter(Boolean).length:0;
      return {materialId:material.id,materialTitle:material.title,topicIndex:index,
        title:typeof info.title==='string'&&info.title.trim()?info.title.trim():`Tema ${index+1}`,
        estimatedMinutes:estimateTopicSessionMinutes(Math.max(10,Math.ceil(words/180)+10),preferences as string[],minutes)};
    });
  }).slice(0,400);
  if(!topics.length)return fail('Los archivos seleccionados todavía no tienen temas disponibles.',422);
  const proposedDay=typeof body.startDate==='string'&&DATE.test(body.startDate)?body.startDate:'';
  const dateFromClient=new Date(`${proposedDay}T12:00:00Z`);
  const withinOneDay=Number.isFinite(dateFromClient.getTime())&&Math.abs(dateFromClient.getTime()-serverDay.getTime())<=86400000;
  const start=withinOneDay?dateFromClient:serverDay;
  const {days,overloadedTopics}=completeStudySchedule(topics,examDate,minutes,start);
  const schedule=days.filter(day=>day.topics.length>0);
  if(!schedule.length)return fail('No hay días para estudiar antes del examen.');
  const {error}=await supabase.from('student_personal_study_plans' as never).upsert({
    user_id:user.id,exam_date:examDate,daily_minutes:minutes,material_ids:materialIds,
    preferences,schedule,updated_at:new Date().toISOString()
  } as never,{onConflict:'user_id'});
  if(error)return fail('No pudimos guardar tu planificación. Intentá nuevamente.',503);
  return NextResponse.json({ok:true,unassigned:overloadedTopics});
}
export async function PATCH(request:NextRequest) {
  const {supabase,user}=await userDb();
  if(!user)return fail('Iniciá sesión para guardar el avance.',401);
  const body=await request.json().catch(()=>null) as {materialId?:unknown;topicIndex?:unknown}|null;
  const materialId=body?.materialId;
  const topicIndex=body?.topicIndex;
  if(typeof materialId!=='string'||!UUID.test(materialId)||!Number.isInteger(topicIndex)||Number(topicIndex)<0)
    return fail('La actividad no es válida.');
  const {data,error}=await supabase.from('student_personal_study_plans' as never)
    .select('schedule').eq('user_id',user.id).maybeSingle();
  if(error||!data)return fail('Primero creá un plan de estudio.',404);
  const schedule=(data as {schedule:PlanDay[]}).schedule;
  const authorized=Array.isArray(schedule)&&schedule.some(day=>Array.isArray(day.topics)&&
    day.topics.some(topic=>topic.materialId===materialId&&topic.topicIndex===topicIndex));
  if(!authorized)return fail('La actividad no forma parte de tu plan.',403);
  const saved=await supabase.from('student_material_topic_activity_progress' as never).upsert({
    user_id:user.id,material_id:materialId,topic_index:topicIndex as number,activity:'reading'
  } as never,{onConflict:'user_id,material_id,topic_index,activity',ignoreDuplicates:true});
  if(saved.error)return fail('No se pudo registrar la actividad.',503);
  return NextResponse.json({ok:true,key:`${materialId}:${topicIndex}`});
}
