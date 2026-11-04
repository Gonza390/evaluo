'use server';

import {unstable_cache as nextCache} from 'next/cache';
import {requireAdminAccess} from '@/lib/auth';
import {createAdminClient} from '@/lib/supabase-admin';
import type {StudyPlanAdminFilters,StudyPlanAdminSnapshot} from './study-plans-dashboard-types';

const validUuid=(v:string|undefined|null):v is string=>!!v&&
 /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
const date=(v:string|undefined|null)=>{
 if(!v||!/^\d{4}-\d{2}-\d{2}$/.test(v))return null;
 const parsed=new Date(v+'T12:00:00Z');
 return Number.isFinite(parsed.getTime())&&parsed.toISOString().slice(0,10)===v?v:null;
};
const argentinaToday=()=>new Intl.DateTimeFormat('en-CA',{
 timeZone:'America/Argentina/Buenos_Aires',year:'numeric',month:'2-digit',day:'2-digit',
}).format(new Date());
export async function obtenerDashboardPlanesEstudio(params:Record<string,string|undefined>){
 await requireAdminAccess();
 const today=argentinaToday();
 const startLimit=new Date(today+'T12:00:00Z');startLimit.setUTCDate(startLimit.getUTCDate()-90);
 const earliest=startLimit.toISOString().slice(0,10);
 const period=([1,7,14,30].includes(Number(params.planPeriod))?String(params.planPeriod)
   :params.planPeriod==='custom'?'custom':'7') as StudyPlanAdminFilters['period'];
 const from=date(params.planFrom),to=date(params.planTo);
 const isCustom=period==='custom'&&!!from&&!!to&&from<=to&&from>=earliest&&to<=today&&
   (new Date(to).getTime()-new Date(from).getTime())/86400000<=29;
 const duration=['upto7','8to14','15to30','over30'].includes(params.planDuration??'')
   ?params.planDuration as StudyPlanAdminFilters['duration']:'all';
 const state=['active','not_started','interrupted'].includes(params.planState??'')
   ?params.planState as StudyPlanAdminFilters['state']:'all';
 const filters:StudyPlanAdminFilters={
  period:period==='custom'&&!isCustom?'7':period,
  from:isCustom?from:null,to:isCustom?to:null,
  university:validUuid(params.planUniversity)?params.planUniversity:null,
  career:validUuid(params.planCareer)?params.planCareer:null,
  subject:validUuid(params.planSubject)?params.planSubject:null,
  duration,state,
 };
 const snapshot=await cachedSnapshot(filters);
 return {snapshot,filters,today,earliest};
}

const cachedSnapshot=nextCache(async(f:StudyPlanAdminFilters)=>{
 const {data,error}=await createAdminClient().rpc('admin_study_plans_dashboard_v1',{
  p_days:f.period==='custom'?7:Number(f.period),
  p_from:f.from,p_to:f.to,p_university:f.university,p_career:f.career,
  p_subject:f.subject,p_duration:f.duration,p_state:f.state,
 });
 if(error||!data)throw error??new Error('Sin datos de planes de estudio');
 return data as StudyPlanAdminSnapshot;
},['admin-study-plans-dashboard-v1'],{revalidate:3600});
