'use server';

import { unstable_cache as nextCache } from 'next/cache';
import { requireAdminAccess } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-admin';
import type {LearningFilters,LearningSnapshot} from './learning-dashboard-types';

const isUuid=(s:string|null|undefined):s is string=>!!s&&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
const safeDate=(v:string|null|undefined):string|null=>{
  if(!v||!/^\d{4}-\d{2}-\d{2}$/.test(v))return null;
  const d=new Date(v+'T12:00:00Z');
  return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===v?v:null;
};
function todayArgentina(){
  const p=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Argentina/Buenos_Aires',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  return p;
}
function normalize(f:Record<string,string|undefined>):LearningFilters {
  const period:LearningFilters['period']=(['1','7','14','30','custom'].includes(f.academicPeriod??'')
    ?f.academicPeriod:'7') as LearningFilters['period'];
  const day=todayArgentina();
  const from=safeDate(f.academicFrom);
  const to=safeDate(f.academicTo);
  const earliest=new Date(day+'T12:00:00Z');earliest.setUTCDate(earliest.getUTCDate()-90);
  const good=period==='custom'&&!!from&&!!to&&from<=to&&to<=day&&from>=earliest.toISOString().slice(0,10)
    &&(new Date(to).getTime()-new Date(from).getTime())/86400000<=29;
  return {
    period:good?'custom':period==='custom'?'7':period,
    from:good?from:null,to:good?to:null,
    university:isUuid(f.academicUniversity)?f.academicUniversity:null,
    career:isUuid(f.academicCareer)?f.academicCareer:null,
    subject:isUuid(f.academicSubject)?f.academicSubject:null,
    plan:(['free','premium'].includes(f.academicPlan??'')?f.academicPlan:'all') as LearningFilters['plan'],
  };
}

const cachedSnapshot=nextCache(async(f:LearningFilters)=>{
  const {data,error}=await createAdminClient().rpc('admin_learning_dashboard_v2',{
    p_days:f.period==='custom'?7:Number(f.period),
    p_from:f.from,p_to:f.to,p_university:f.university,
    p_career:f.career,p_subject:f.subject,p_plan:f.plan,
  });
  if(error||!data)throw error??new Error('No hay datos académicos');
  return data as LearningSnapshot;
},['admin-learning-snapshot-v2'],{revalidate:3600});

export async function obtenerAprendizajePracticas(query:Record<string,string|undefined>){
  // Auth runs outside the shared cache for every request.
  await requireAdminAccess();
  const filters=normalize(query);
  const data=await cachedSnapshot(filters);
  const today=todayArgentina();
  const earliest=new Date(today+'T12:00:00Z');earliest.setUTCDate(earliest.getUTCDate()-90);
  return {data,filters,earliest:earliest.toISOString().slice(0,10),today};
}
