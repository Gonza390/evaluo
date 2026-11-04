'use server';
import {unstable_cache as nextCache} from 'next/cache';
import {requireAdminAccess} from '@/lib/auth';
import {createAdminClient} from '@/lib/supabase-admin';
import type {CommunicationsSnapshot,CommunicationsFilters} from './communications-dashboard-types';

function todayArgentina(){
 return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Argentina/Buenos_Aires',
  year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
}
function validDate(s:string|undefined){
 if(!s||!/^\d{4}-\d{2}-\d{2}$/.test(s))return null;
 const dt=new Date(s+'T12:00:00Z');
 return Number.isFinite(dt.getTime())&&dt.toISOString().slice(0,10)===s?s:null;
}
function pick<T extends string>(v:string|undefined,options:readonly T[],otherwise:T){
 return options.includes(v as T)?v as T:otherwise;
}
const cachedSnapshot=nextCache(async(f:CommunicationsFilters)=>{
 const {data,error}=await createAdminClient().rpc('admin_communications_dashboard_v1',{
  p_days:f.period==='custom'?7:Number(f.period),
  p_from:f.from,p_to:f.to,p_type:f.type,p_template:f.template,
  p_status:f.status,p_campaign:f.campaign,
 });
 if(error||!data)throw error??new Error('No se pudo obtener la información de comunicaciones');
 return data as CommunicationsSnapshot;
},['admin-communications-dashboard-v1'],{revalidate:3600});

export async function obtenerDashboardComunicaciones(params:Record<string,string|undefined>){
 // Authentication before consulting or returning the globally shared cached aggregate.
 await requireAdminAccess();
 const today=todayArgentina(),day=new Date(today+'T12:00:00Z');
 day.setUTCDate(day.getUTCDate()-90);const earliest=day.toISOString().slice(0,10);
 const requestedPeriod=pick(params.commPeriod,['1','7','14','30','custom'] as const,'7');
 const from=validDate(params.commFrom),to=validDate(params.commTo);
 const validCustom=requestedPeriod==='custom'&&!!from&&!!to&&from<=to&&
   from>=earliest&&to<=today&&(Date.parse(to)-Date.parse(from))/86400000<=29;
 const filters:CommunicationsFilters={
  period:requestedPeriod==='custom'&&!validCustom?'7':requestedPeriod,
  from:validCustom?from:null,to:validCustom?to:null,
  type:pick(params.commType,['all','exam','ready','recovery','review','campaign','welcome'] as const,'all'),
  template:pick(params.commTemplate,['all','exam_7','exam_3','exam_1','ready','return_48h','return_d1','return_30d','flashcards','welcome','other'] as const,'all'),
  status:pick(params.commStatus,['all','sent','failed','pending','sending','cancelled'] as const,'all'),
  campaign:pick(params.commCampaign,['all','automatic','exam','recovery','manual'] as const,'all'),
 };
 const snapshot=await cachedSnapshot(filters);
 return {snapshot,filters,today,earliest};
}
