'use client';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getProgress, syncStudyPlanProgress, type TopicActivities } from '@/lib/study-plan-progress';

export function StudyPlanRoadmap({ materialId, topicActivities }: { materialId: string; topicActivities: TopicActivities[] }) {
 const [done,setDone]=useState<Record<string,boolean>>({});
 useEffect(()=>{
  let active=true;
  const update=()=>{if(active)setDone(getProgress(materialId,topicActivities).record)};
  update();void syncStudyPlanProgress(materialId).then(update);
  window.addEventListener('focus',update);window.addEventListener('pageshow',update);
  return ()=>{active=false;window.removeEventListener('focus',update);window.removeEventListener('pageshow',update)};
 },[materialId,topicActivities]);
 if(!topicActivities.length)return null;
 const finished=topicActivities.map((t,i)=>Boolean(done[i+':reading'])&&(!t.questions||Boolean(done[i+':questions']))&&(!t.flashcards||Boolean(done[i+':flashcards']))&&(!t.glossary||Boolean(done[i+':glossary'])));
 const current=finished.indexOf(false);
 return <section aria-label="Tu recorrido de estudio" className="hidden rounded-2xl border border-slate-200 bg-white px-4 py-3.5 md:block">
  <div className="mb-3 flex items-center justify-between gap-2">
   <h2 className="text-[14px] font-bold">Tu recorrido</h2>
   <span className="text-[11px] text-slate-500">{finished.filter(Boolean).length} de {finished.length} temas</span>
  </div>
  <div className="overflow-x-auto pb-1"><ol className="flex min-w-max items-start">
   {topicActivities.map((t,i)=>{
    const complete=finished[i];const actual=i===current;const state=complete?'Completado':actual?'Actual':'Pendiente';
    return <li key={i} className="relative w-[112px] shrink-0 text-center">
     {i>0?<span aria-hidden="true" className={'absolute -left-1/2 top-[13px] h-[2px] w-full '+(complete?'bg-blue-500':'bg-slate-200')}/>:null}
     <Link href={'/materiales/'+materialId+'?tab=resumen&studyTopic='+i} aria-label={'Tema '+(i+1)+': '+(t.title||'Tema '+(i+1))+'. '+state} className="relative z-10 flex flex-col items-center gap-1.5 rounded-lg px-1 py-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
      <span className={'flex size-[27px] items-center justify-center rounded-full border-2 text-[11px] font-bold '+(complete?'border-blue-600 bg-blue-600 text-white':actual?'border-blue-600 bg-white text-blue-700':'border-slate-200 bg-slate-50 text-slate-400')}>
       {complete?<Check className="size-4" aria-hidden="true"/>:i+1}
      </span>
      <span title={t.title} className={'line-clamp-2 min-h-8 max-w-[108px] text-[11px] leading-4 font-medium '+(actual?'text-blue-800':'text-slate-700')}>{t.title||'Tema '+(i+1)}</span>
      <span className={'text-[10px] '+(actual?'font-semibold text-blue-700':'text-slate-400')}>{state}</span>
     </Link>
    </li>;
   })}
  </ol></div>
 </section>;
}
