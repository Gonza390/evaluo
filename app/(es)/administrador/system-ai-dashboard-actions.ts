'use server';
import {unstable_cache as nextCache} from 'next/cache';
import {requireAdminAccess} from '@/lib/auth';
import {createAdminClient} from '@/lib/supabase-admin';
import type {SystemAiSnapshot} from './system-ai-dashboard-types';

const cachedSystem=nextCache(async(days:1|7|14|30)=>{
 const {data,error}=await createAdminClient().rpc('admin_system_ai_dashboard_v1',{p_days:days});
 if(error||!data)throw error??new Error('No hay mediciones disponibles de Sistema e IA.');
 return data as SystemAiSnapshot;
},['admin-system-ai-v1'],{revalidate:900});

export async function obtenerDashboardSistemaIA(params:Record<string,string|undefined>){
 await requireAdminAccess(); 
 const days=([1,7,14,30].includes(Number(params.systemPeriod))?Number(params.systemPeriod):1) as 1|7|14|30;
 const snapshot=await cachedSystem(days);
 return {days,snapshot};
}