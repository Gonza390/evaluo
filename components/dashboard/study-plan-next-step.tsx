'use client';
import Link from 'next/link';
import { useOptionalAppLocale } from '@/components/i18n/app-locale-provider';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { getProgress, syncStudyPlanProgress, type Activity, type TopicActivities } from '@/lib/study-plan-progress';

const modes: Record<Activity, { label: string; tab: string; minutes: keyof TopicActivities; description: string }> = {
 reading: {label:'Leer',tab:'resumen',minutes:'readingMinutes',description:'Leé este tema para avanzar en tu plan.'},
 questions: {label:'Practicar',tab:'ejercicios',minutes:'questionsMinutes',description:'Comprobá lo que aprendiste con preguntas del tema.'},
 flashcards: {label:'Flashcards',tab:'tarjetas',minutes:'flashcardsMinutes',description:'Repasá los conceptos importantes con tarjetas.'},
 glossary: {label:'Glosario',tab:'glosario',minutes:'glossaryMinutes',description:'Revisá los conceptos clave antes de continuar.'},
};

export function StudyPlanNextStep({ materialId, topicActivities }: { materialId: string; topicActivities: TopicActivities[] }) {
 const english = useOptionalAppLocale() === 'en';
 const [progress,setProgress]=useState({percent:0,done:0,total:0,record:{} as Record<string,boolean>});
 const [animateProgress,setAnimateProgress]=useState(false);
 const frameRef=useRef<number | null>(null);
 useEffect(()=>{
  let active=true;
  // Restore the persisted percentage immediately; only animate later changes.
  setAnimateProgress(false);
  const update=()=>{if(active)setProgress(getProgress(materialId,topicActivities))};
  update();
  frameRef.current=window.requestAnimationFrame(()=>{
   frameRef.current=window.requestAnimationFrame(()=>{
    if(active)setAnimateProgress(true);
   });
  });
  void syncStudyPlanProgress(materialId).then(update);
  window.addEventListener('focus',update); window.addEventListener('pageshow',update);
  return ()=>{
   active=false;
   if(frameRef.current!==null)window.cancelAnimationFrame(frameRef.current);
   window.removeEventListener('focus',update);window.removeEventListener('pageshow',update);
  };
 },[materialId,topicActivities]);
 let next: { topic: number; activity: Activity } | null=null;
 for(let i=0;i<topicActivities.length && !next;i++){
  const t=topicActivities[i];
  for(const activity of ['reading','questions','flashcards','glossary'] as Activity[]){
   if(activity!=='reading' && !t[activity]) continue;
   if(!progress.record[i+':'+activity]){next={topic:i,activity};break}
  }
 }
 const selection=next as {topic:number;activity:Activity}|null;
 return <div className="space-y-2.5">
  {selection ? (()=>{
   const topic=topicActivities[selection.topic];
   const mode=modes[selection.activity];
   return <>
    <h3 className="text-cuerpo font-medium leading-snug tracking-titulo text-slate-900">{topic.title || (english ? 'Topic ' : 'Tema ')+(selection.topic+1)}</h3>
    <p className="text-etiqueta leading-4 text-slate-500">{english ? ({reading:'Read this topic to move forward in your plan.',questions:'Check what you have learned with practice questions.',flashcards:'Review key concepts with flashcards.',glossary:'Review key concepts before moving on.'} as Record<Activity,string>)[selection.activity] : mode.description}</p>
    <Link href={'/materiales/'+materialId+'?tab='+mode.tab+'&studyTopic='+selection.topic} className="inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-lg border border-[#D7E3FB] bg-[#EEF2FF] px-4 text-ui font-semibold text-[#315DAB] transition-colors hover:border-[#BBCDF4] hover:bg-[#E2EAFF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5D70C4]">
      {english ? (progress.done===0 ? 'Start studying' : 'Continue now') : (progress.done===0 ? 'Comenzar a estudiar' : 'Continuar ahora')} <ArrowRight className="size-4"/>
    </Link>
   </>;
  })() : topicActivities.length ? (
   <div className="flex items-center gap-2 text-ui font-medium text-slate-700"><CheckCircle2 className="size-5 text-emerald-600"/>{english ? 'You completed all activities for this PDF!' : '¡Completaste las actividades de este PDF!'}</div>
  ) : <p className="text-chico text-slate-500">{english ? 'No topics are available to study yet.' : 'Todavía no hay temas disponibles para estudiar.'}</p>}
  <div className="border-t border-slate-100 pt-2.5">
   <div className="mb-2 flex items-center justify-between text-etiqueta text-slate-500"><span>{english ? 'Your progress' : 'Tu progreso'}</span><span>{progress.percent}%</span></div>
   <div className="h-1.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={progress.percent} aria-valuemin={0} aria-valuemax={100} aria-label={english ? "Material progress" : "Avance del material"}><div className={`h-full rounded-full bg-slate-500 motion-reduce:transition-none ${animateProgress ? 'transition-[width] duration-500 ease-out' : ''}`} style={{width:progress.percent+'%'}}/></div>
   <p className="mt-2 text-etiqueta text-slate-500">{progress.done} {english ? 'of' : 'de'} {progress.total} {english ? 'activities completed' : 'actividades completadas'}</p>
  </div>
 </div>;
}
