'use client';
import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getProgress, syncStudyPlanProgress, type Activity, type TopicActivities } from '@/lib/study-plan-progress';

const modes: Record<Activity, { label: string; tab: string; minutes: keyof TopicActivities; description: string }> = {
 reading: {label:'Leer',tab:'resumen',minutes:'readingMinutes',description:'Leé este tema para avanzar en tu plan.'},
 questions: {label:'Practicar',tab:'ejercicios',minutes:'questionsMinutes',description:'Comprobá lo que aprendiste con preguntas del tema.'},
 flashcards: {label:'Flashcards',tab:'tarjetas',minutes:'flashcardsMinutes',description:'Repasá los conceptos importantes con tarjetas.'},
 glossary: {label:'Glosario',tab:'glosario',minutes:'glossaryMinutes',description:'Revisá los conceptos clave antes de continuar.'},
};

export function StudyPlanNextStep({ materialId, topicActivities }: { materialId: string; topicActivities: TopicActivities[] }) {
 const [progress,setProgress]=useState({percent:0,done:0,total:0,record:{} as Record<string,boolean>});
 useEffect(()=>{
  let active=true;
  const update=()=>{if(active)setProgress(getProgress(materialId,topicActivities))};
  update(); void syncStudyPlanProgress(materialId).then(update);
  window.addEventListener('focus',update); window.addEventListener('pageshow',update);
  return ()=>{active=false;window.removeEventListener('focus',update);window.removeEventListener('pageshow',update)};
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
   const minutes=topic[mode.minutes];
   return <>
    {typeof minutes==='number'?<p className="text-right text-[11px] text-slate-400">≈ {minutes} min</p>:null}
    <h3 className="text-[14px] font-medium leading-snug tracking-tight text-slate-900">{topic.title || 'Tema '+(selection.topic+1)}</h3>
    <p className="text-[11px] leading-4 text-slate-500">{mode.description}</p>
    <Link href={'/materiales/'+materialId+'?tab='+mode.tab+'&studyTopic='+selection.topic} className="inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-[13px] font-medium text-white transition hover:bg-blue-700">
      {progress.done===0?'Comenzar a estudiar':'Continuar ahora'} <ArrowRight className="size-4"/>
    </Link>
   </>;
  })() : topicActivities.length ? (
   <div className="flex items-center gap-2 text-[13px] font-medium text-slate-700"><CheckCircle2 className="size-5 text-emerald-600"/>¡Completaste las actividades de este PDF!</div>
  ) : <p className="text-[12px] text-slate-500">Todavía no hay temas disponibles para estudiar.</p>}
  <div className="border-t border-slate-100 pt-2.5">
   <div className="mb-2 flex items-center justify-between text-[11px] text-slate-500"><span>Tu progreso</span><span>{progress.percent}%</span></div>
   <div className="h-1.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={progress.percent} aria-valuemin={0} aria-valuemax={100} aria-label="Avance del material"><div className="h-full rounded-full bg-slate-500 transition-[width]" style={{width:progress.percent+'%'}}/></div>
   <p className="mt-2 text-[11px] text-slate-500">{progress.done} de {progress.total} actividades completadas</p>
  </div>
 </div>;
}
