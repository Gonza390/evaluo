import { NextRequest, NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { hasPremiumAccess } from '@/lib/premium';
import { isFreeStudyV2Active } from '@/lib/free-study-v2';
import { premiumUpgradeForLimit } from '@/lib/premium-flow';
import { type PlanDay } from '@/lib/student-materials/study-plan-distribution';
import { buildPlanSchedule, buildPlanTopics } from '@/lib/student-materials/study-plan-builder';
import { completedPlanTopics, planPreparationProgress, type PlanPracticeCompletion } from '@/lib/student-materials/study-plan-completion';
import { reorganizePlanSchedule } from '@/lib/student-materials/plan-reorganize';

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
export async function GET(request: NextRequest) {
  const {supabase,user}=await userDb();
  if(!user)return fail('Iniciá sesión para consultar tu plan.',401);
  const {data,error}=await supabase.from('student_personal_study_plans' as never)
    .select('exam_date,daily_minutes,material_ids,preferences,schedule,updated_at')
    .eq('user_id',user.id).maybeSingle();
  if(error)return fail('No pudimos recuperar tu plan. Probá nuevamente.',503);
  const plan=data as SavedPlan|null;
  // El calendario sólo necesita la planificación; evitar consultas adicionales de progreso.
  // Siempre se consulta la fila del usuario autenticado.
  if(request.nextUrl.searchParams.get('view')==='calendar') {
    return NextResponse.json({
      plan:plan
        ? {exam_date:plan.exam_date,schedule:plan.schedule,updated_at:plan.updated_at}
        : null,
    });
  }
  if(!plan)return NextResponse.json({plan:null,completedKeys:[],planCompletedKeys:[],preparationProgress:{completed:0,total:0,percent:0}});
  const ids=Array.isArray(plan.material_ids)?plan.material_ids:[];
  if(!ids.length)return NextResponse.json({plan,completedKeys:[],planCompletedKeys:[],preparationProgress:{completed:0,total:0,percent:0}});
  const [result,practiceResult]=await Promise.all([
    supabase.from('student_material_topic_activity_progress' as never)
      .select('material_id,topic_index').eq('user_id',user.id).eq('activity','reading').in('material_id',ids),
    supabase.from('student_personal_study_plan_practice_progress' as never)
      .select('material_id,topic_index,mode').eq('user_id',user.id).in('material_id',ids),
  ]);
  if(result.error)return fail('No pudimos consultar el progreso de tu plan.',503);
  // Graceful rollout: an uninstalled tracking table must never hide an existing plan.
  // Without practice evidence nothing is marked complete for practice-based plans.
  if(practiceResult.error && !['42P01','PGRST205'].includes(practiceResult.error.code??''))
    return fail('No pudimos consultar el progreso de las prácticas.',503);
  const entries=(result.data??[]) as Array<{material_id:string;topic_index:number}>;
  const completedKeys=entries.map(row=>`${row.material_id}:${row.topic_index}`);
  const practice=(practiceResult.data??[]) as PlanPracticeCompletion[];
  return NextResponse.json({
    plan,completedKeys,
    planCompletedKeys:completedPlanTopics(plan.schedule,plan.preferences,plan.daily_minutes,completedKeys,practice),
    preparationProgress:planPreparationProgress(plan.schedule,plan.preferences,plan.daily_minutes,completedKeys,practice),
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
  const topics=buildPlanTopics(materials,byId,preferences as string[],minutes);
  if(!topics.length)return fail('Los archivos seleccionados todavía no tienen temas disponibles.',422);
  const proposedDay=typeof body.startDate==='string'&&DATE.test(body.startDate)?body.startDate:'';
  const dateFromClient=new Date(`${proposedDay}T12:00:00Z`);
  const withinOneDay=Number.isFinite(dateFromClient.getTime())&&Math.abs(dateFromClient.getTime()-serverDay.getTime())<=86400000;
  const start=withinOneDay?dateFromClient:serverDay;
  const {schedule,overloadedTopics}=buildPlanSchedule(topics,examDate,minutes,preferences as string[],start);
  if(!schedule.length)return fail('No hay días para estudiar antes del examen.');
  if (isFreeStudyV2Active() && !(await hasPremiumAccess(user.id))) {
    // Free v2: creación y consumo irreversible en una sola transacción.
    // Se permite editar el plan existente; eliminarlo no otorga otro.
    const admin = createAdminClient();
    const { data, error } = await admin.rpc('save_free_study_v2_plan' as never, {
      p_user_id: user.id,
      p_exam_date: examDate,
      p_daily_minutes: minutes,
      p_material_ids: materialIds,
      p_preferences: preferences,
      p_schedule: schedule,
    } as never);
    if (error) return fail('No pudimos verificar tu cupo de planes. Intentá nuevamente.',503);
    if (data !== true) return NextResponse.json({
      error:'Ya utilizaste tu plan de estudio gratuito. Podés continuar con Premium.',
      upgrade:premiumUpgradeForLimit('study_plan'),
    },{status:403});
  } else {
    const {error}=await createAdminClient().from('student_personal_study_plans' as never).upsert({
      user_id:user.id,exam_date:examDate,daily_minutes:minutes,material_ids:materialIds,
      preferences,schedule,updated_at:new Date().toISOString()
    } as never,{onConflict:'user_id'});
    if(error)return fail('No pudimos guardar tu planificación. Intentá nuevamente.',503);
  }
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

/**
 * Reorganizar: repartir lo pendiente entre hoy y el examen. Solo lo pide el
 * alumno de forma explícita; conserva lo completado, la fecha y las preferencias,
 * y no consume el cupo de planes (no crea un plan nuevo).
 */
export async function PUT(request:NextRequest) {
  const {supabase,user}=await userDb();
  if(!user)return fail('Iniciá sesión para reorganizar el plan.',401);
  const body=await request.json().catch(()=>null) as {action?:unknown;startDate?:unknown}|null;
  if(body?.action!=='reorganize')return fail('La acción no es válida.');
  const {data,error}=await supabase.from('student_personal_study_plans' as never)
    .select('exam_date,daily_minutes,material_ids,preferences,schedule,updated_at').eq('user_id',user.id).maybeSingle();
  if(error)return fail('No pudimos recuperar tu plan. Probá nuevamente.',503);
  if(!data)return fail('Primero creá un plan de estudio.',404);
  const plan=data as SavedPlan;
  const ids=Array.isArray(plan.material_ids)?plan.material_ids:[];
  if(!Array.isArray(plan.schedule)||!ids.length)return fail('Tu plan no tiene actividades para reorganizar.',422);
  const [reading,practiceResult]=await Promise.all([
    supabase.from('student_material_topic_activity_progress' as never)
      .select('material_id,topic_index').eq('user_id',user.id).eq('activity','reading').in('material_id',ids),
    supabase.from('student_personal_study_plan_practice_progress' as never)
      .select('material_id,topic_index,mode').eq('user_id',user.id).in('material_id',ids),
  ]);
  if(reading.error)return fail('No pudimos consultar el progreso de tu plan.',503);
  if(practiceResult.error && !['42P01','PGRST205'].includes(practiceResult.error.code??''))
    return fail('No pudimos consultar el progreso de las prácticas.',503);
  const readingKeys=((reading.data??[]) as Array<{material_id:string;topic_index:number}>)
    .map(row=>`${row.material_id}:${row.topic_index}`);
  const completed=completedPlanTopics(plan.schedule,plan.preferences,plan.daily_minutes,readingKeys,
    (practiceResult.data??[]) as PlanPracticeCompletion[]);
  // Mismo criterio que al crear el plan: el día lo propone el cliente (zona del alumno)
  // pero nunca se aleja más de un día del servidor.
  const now=new Date();
  const serverDay=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate(),12));
  const proposed=typeof body.startDate==='string'&&DATE.test(body.startDate)?body.startDate:'';
  const fromClient=new Date(`${proposed}T12:00:00Z`);
  const start=Number.isFinite(fromClient.getTime())&&Math.abs(fromClient.getTime()-serverDay.getTime())<=86400000
    ?fromClient:serverDay;
  const result=reorganizePlanSchedule({days:plan.schedule,completedKeys:completed,examDate:plan.exam_date,
    dailyMinutes:plan.daily_minutes,preferences:plan.preferences,start});
  if(!result.ok) return fail(
    result.error==='exam_passed'?'La fecha del examen ya pasó. Creá un plan nuevo con otra fecha.'
    :result.error==='nothing_pending'?'No tenés actividades pendientes para reorganizar.'
    :'No hay días para estudiar antes del examen.',422);
  const {error:saveError}=await createAdminClient().from('student_personal_study_plans' as never)
    .update({schedule:result.schedule,updated_at:new Date().toISOString()} as never).eq('user_id',user.id);
  if(saveError)return fail('No pudimos guardar tu planificación. Intentá nuevamente.',503);
  return NextResponse.json({ok:true,moved:result.moved,unassigned:result.overloadedTopics});
}
