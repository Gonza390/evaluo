'use server';

import {unstable_cache as nextCache,updateTag,revalidatePath} from 'next/cache';
import {getAdminAccessContext} from '@/lib/access-control';
import {createAdminClient} from '@/lib/supabase-admin';
import type {GestionSnapshot} from './gestion-dashboard-types';
import {DAILY_FREE_LIMIT} from '@/lib/ai/daily-limit';
import {FREE_ERRORS_REVIEWS_PER_WEEK} from '@/lib/premium';

const SNAPSHOT_TAG='admin-gestion-snapshot-v1';
const validId=(x:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x);
async function actorId(){
 const access=await getAdminAccessContext();
 if(!access.ok)throw new Error('Se requiere acceso administrativo.');
 return access.user.id;
}
const readSnapshot=nextCache(async()=>{
 const {data,error}=await createAdminClient().rpc('admin_management_snapshot_v1',{});
 if(error||!data)throw error??new Error('Gestión no disponible');
 return data as GestionSnapshot;
},[SNAPSHOT_TAG],{revalidate:300,tags:[SNAPSHOT_TAG]});

export async function obtenerDashboardGestion(){
 const actor=await actorId();
 return {snapshot:await readSnapshot(),actor,limits:{dailyFreeAi:DAILY_FREE_LIMIT,freeErrorsPerWeek:FREE_ERRORS_REVIEWS_PER_WEEK}};
}
function refresh(){
 updateTag(SNAPSHOT_TAG);
 revalidatePath('/administrador');
 revalidatePath('/administrador/solicitudes');
 revalidatePath('/administrador/feedback');
}

export async function gestionActualizarFeedback(input:{
 source:'product'|'simulator'|'material';id:string;
 expected:'open'|'in_progress';next:'in_progress'|'resolved';
}):Promise<{success:boolean;message:string}>{
 try{
  const actor=await actorId();
  if(!validId(input.id)||!['product','simulator','material'].includes(input.source)||
   !((input.expected==='open'&&input.next==='in_progress')||
     (input.expected==='in_progress'&&input.next==='resolved')))
   return {success:false,message:'Transición de feedback inválida.'};
  const {error}=await createAdminClient().rpc('admin_management_update_feedback_v1',{
   p_actor:actor,p_source:input.source,p_feedback_id:input.id,p_expected:input.expected,p_next:input.next,
  });
  if(error)throw new Error(error.message);
  refresh();
  return {success:true,message:'Estado actualizado y registrado en la auditoría.'};
 }catch(e){
  return {success:false,message:e instanceof Error?e.message:'No pudimos actualizar el feedback.'};
 }
}

export async function gestionResolverCatalogo(input:{
 id:string;kind:'university'|'career'|'subject';decision:'approve'|'reject';
}):Promise<{success:boolean;message:string}>{
 try {
  const actor=await actorId();
  if(!validId(input.id)||!['university','career','subject'].includes(input.kind)||
     !['approve','reject'].includes(input.decision))
   return {success:false,message:'Solicitud inválida.'};

  // One PostgreSQL transaction: catalog decision + audit. Never report success
  // when an audit record is missing (the database rolls back both changes).
  const {data,error}=await createAdminClient().rpc('admin_management_resolve_catalog_v1',{
   p_actor:actor,p_kind:input.kind,p_id:input.id,p_decision:input.decision,
  });
  if(error)throw new Error(error.message);
  if(!data?.audited)throw new Error('La operación no confirmó su auditoría.');
  refresh();
  updateTag('explorar-catalog');
  updateTag('universidad-data');
  revalidatePath('/explorar');
  revalidatePath('/universidad/[id]','page');
  revalidatePath('/materias');
  revalidatePath('/empezar');
  revalidatePath('/dashboard/materiales');
  return {success:true,message:input.decision==='approve'?
   'Solicitud aprobada y cambio registrado.':'Solicitud rechazada y cambio registrado.'};
 }catch(e){
  return {success:false,message:e instanceof Error?e.message:'No pudimos resolver la solicitud.'};
 }
}
