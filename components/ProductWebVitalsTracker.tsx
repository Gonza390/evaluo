'use client';

import {useReportWebVitals} from 'next/web-vitals';
import {trackClientAnalyticsEvent} from '@/lib/analytics-client';

const SAMPLE_PROBABILITY=0.2;
const SAMPLE_STORAGE_KEY='evaluo_product_vitals_sample_v1';
const alreadyReported=new Set<string>();

/** Only aggregate, static route identifiers. No material/user identifiers or query strings. */
function normalizedProductPath(pathname:string):string|null{
 if(pathname==='/dashboard')return '/dashboard';
 if(pathname==='/dashboard/materiales/subir'||pathname==='/dashboard/materiales/nuevo')
   return '/dashboard/materiales/subir';
 if(pathname==='/dashboard/materiales')return '/dashboard/materiales';
 if(pathname==='/dashboard/plan-de-estudio'||pathname.startsWith('/dashboard/plan-de-estudio/'))
   return '/dashboard/plan-de-estudio';
 if(pathname==='/dashboard/practicar'||pathname.startsWith('/dashboard/practicar/'))
   return '/dashboard/practicar';
 if(/^\/materiales\/[0-9a-f-]{36}(\/.*)?$/i.test(pathname))return '/materiales/[id]';
 return null;
}

function selectedSession(){
 try{
  const existing=window.sessionStorage.getItem(SAMPLE_STORAGE_KEY);
  if(existing==='1')return true;
  if(existing==='0')return false;
  const sample=Math.random()<SAMPLE_PROBABILITY;
  window.sessionStorage.setItem(SAMPLE_STORAGE_KEY,sample?'1':'0');
  return sample;
 }catch{return Math.random()<SAMPLE_PROBABILITY;}
}

/** Sample official Next.js Web Vitals without a new request per metric.
 * TTFB and LCP are initial document/navigation metrics, not SPA transition latency.
 */
export function ProductWebVitalsTracker(){
 useReportWebVitals(metric=>{
  if(metric.name!=='LCP'&&metric.name!=='TTFB')return;
  if(!Number.isFinite(metric.value)||metric.value<0||metric.value>120000)return;
  // Preview traffic must not contaminate production's student performance data.
  if(/\.vercel\.app$/.test(window.location.hostname)||window.location.hostname==='localhost')return;
  const path=normalizedProductPath(window.location.pathname);
  if(!path||!selectedSession())return;
  const unique=metric.name+':'+metric.id;
  if(alreadyReported.has(unique))return;
  alreadyReported.add(unique);
  void trackClientAnalyticsEvent({
   eventName:'product_web_vital',
   path,
   metadata:{
    metric:metric.name,
    value_ms:Math.round(metric.value),
    sample_rate:SAMPLE_PROBABILITY,
    measurement_version:1,
   },
  });
 });
 return null;
}
