'use client';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { getProgress, syncStudyPlanProgress, type TopicActivities } from '@/lib/study-plan-progress';

export function StudyPlanRoadmap({ materialId, topicActivities }: { materialId: string; topicActivities: TopicActivities[] }) {
 const [done,setDone]=useState<Record<string,boolean>>({});
 const scrollerRef=useRef<HTMLDivElement>(null);
 const [canScrollRight,setCanScrollRight]=useState(false);
 const [progressReady,setProgressReady]=useState(false);
 useEffect(()=>{
  let active=true;
  const update=()=>{if(active){setDone(getProgress(materialId,topicActivities).record);setProgressReady(true);}};
  update();void syncStudyPlanProgress(materialId).then(update);
  window.addEventListener('focus',update);window.addEventListener('pageshow',update);
  return ()=>{active=false;window.removeEventListener('focus',update);window.removeEventListener('pageshow',update)};
 },[materialId,topicActivities]);

 const finished=topicActivities.map((t,i)=>Boolean(done[i+':reading'])&&(!t.questions||Boolean(done[i+':questions']))&&(!t.flashcards||Boolean(done[i+':flashcards']))&&(!t.glossary||Boolean(done[i+':glossary'])));
 const current=finished.indexOf(false);
 const allComplete=topicActivities.length>0 && current===-1;
 const visibleCurrent=current<0?topicActivities.length-1:current;
 useEffect(()=>{
  const scroller=scrollerRef.current;
  if(!scroller)return;
  const refresh=()=>setCanScrollRight(scroller.scrollWidth-scroller.scrollLeft-scroller.clientWidth>3);
  refresh();
  scroller.addEventListener('scroll',refresh,{passive:true});
  window.addEventListener('resize',refresh);
  return ()=>{scroller.removeEventListener('scroll',refresh);window.removeEventListener('resize',refresh);};
 },[materialId,topicActivities.length]);
 useEffect(()=>{
  const scroller=scrollerRef.current;
  if(!scroller || !window.matchMedia('(max-width: 767px)').matches)return;
  if(!progressReady)return;
  const previous=Math.max(0,visibleCurrent-1);
  const previousItem=scroller.querySelector<HTMLElement>(`[data-roadmap-topic="${previous}"]`);
  if(!previousItem)return;
  // Keep the previous completed topic visible to make progress tangible.
  const target=Math.max(0,previousItem.offsetLeft-12);
  scroller.scrollTo({left:target,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
 },[materialId,visibleCurrent,progressReady,allComplete]);
 if(!topicActivities.length)return null;
 return <section aria-label="Tu recorrido de estudio" className="min-w-0 rounded-2xl border border-slate-200/90 bg-white px-3 py-2.5 sm:px-4 sm:py-3.5 shadow-[0_3px_14px_rgba(15,23,42,0.025)]">
  <div className="mb-2 flex items-center justify-between gap-2 sm:mb-3">
   <h2 className="text-[14px] font-normal">Tu recorrido</h2>
   <span className="text-[11px] text-slate-500">{allComplete ? "Recorrido completado" : `${finished.filter(Boolean).length} de ${finished.length} temas`}</span>
  </div>
  <div className="relative min-w-0">
  <div ref={scrollerRef} className="overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"><ol className="flex min-w-max items-start">
   {topicActivities.map((t,i)=>{
    const complete=finished[i];const actual=i===current;const state=complete?'Completado':actual?'Actual':'Pendiente';
    return <li key={i} data-roadmap-topic={i} className="relative w-[112px] shrink-0 text-center">
     {i>0?<span aria-hidden="true" className="absolute -left-1/2 top-[13px] h-px w-full bg-slate-200"/>:null}
     <Link href={'/materiales/'+materialId+'?tab=resumen&studyTopic='+i} aria-label={'Tema '+(i+1)+': '+(t.title||'Tema '+(i+1))+'. '+state} className="relative z-10 flex flex-col items-center gap-1.5 rounded-lg px-1 py-0.5 sm:gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
      <span className={'flex size-[27px] items-center justify-center rounded-full border-2 text-[11px] font-medium '+(complete?'border-[#35816A] bg-[#E9F5EE] text-[#35816A]':actual?'border-[#376CAD] bg-[#E8F2FF] text-[#376CAD]':'border-slate-200 bg-white text-slate-400')}>
       {complete?<Check className="size-4" aria-hidden="true"/>:i+1}
      </span>
      <span title={t.title} className={'line-clamp-2 min-h-[28px] max-w-[108px] text-[11px] leading-[14px] sm:min-h-8 sm:leading-4 font-medium '+(actual?'text-slate-900':'text-slate-600')}>{t.title||'Tema '+(i+1)}</span>
      {actual ? <span className="text-[10px] font-medium text-slate-500">Estás acá</span> : null}
     </Link>
    </li>;
   })}
  </ol></div>
  {canScrollRight ? <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-7 bg-gradient-to-l from-white via-white/85 to-transparent md:hidden" /> : null}
  </div>
 </section>;
}
