'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, BookOpen, ListChecks, Layers3, BookText, CheckCircle2, Clock3 } from 'lucide-react';
import { getProgress, syncStudyPlanProgress, type TopicActivities } from '@/lib/study-plan-progress';

type Step = { id: 'reading'|'questions'|'flashcards'|'glossary'; label: string; detail: string; href: string; minutes: number; icon: typeof BookOpen };
export function StudyPlanNext({ materialId, topicCount, topicActivities }: { materialId:string; topicCount:number; topicActivities:TopicActivities[] }) {
 const [done,setDone]=useState<Record<string,boolean>>({});
 useEffect(()=>{
  const update=()=>setDone(getProgress(materialId,topicActivities).record);
  void syncStudyPlanProgress(materialId).then(update);
  update();window.addEventListener('focus',update);window.addEventListener('pageshow',update);
  return ()=>{window.removeEventListener('focus',update);window.removeEventListener('pageshow',update);};
 },[materialId,topicActivities]);
 if (!topicCount) return <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-500">Todavía no hay temas disponibles para planificar.</div>;
 const isFinished=(index:number)=>{
  const resources=topicActivities[index];
  return !!done[`${index}:reading`] && (!resources?.questions || !!done[`${index}:questions`]) && (!resources?.flashcards || !!done[`${index}:flashcards`]) && (!resources?.glossary || !!done[`${index}:glossary`]);
 };
 let firstPending=0;
 while(firstPending<topicCount && isFinished(firstPending)) firstPending++;
 if(firstPending===topicCount) return <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-[13px] font-semibold text-emerald-800"><CheckCircle2 className="size-5" /> ¡Completaste las actividades del PDF!</div>;
 const first=topicActivities[firstPending];
 // Empezar el siguiente tema es opcional cuando la lectura y las preguntas del actual ya están hechas.
 const canStartNext=!!done[`${firstPending}:reading`] && (!first.questions || !!done[`${firstPending}:questions`]) && firstPending+1<topicCount;
 const visibleTopics=canStartNext?[firstPending,firstPending+1]:[firstPending];
 const buildSteps=(index:number):Step[]=>{
  const t=topicActivities[index];
  const all:Step[]=[
   {id:'reading',label:`Leer: ${t.title || `Tema ${index+1}`}`,detail:'Contenido del tema',href:`/materiales/${materialId}?tab=resumen&studyTopic=${index}`,minutes:t.readingMinutes??1,icon:BookOpen},
   {id:'questions',label:`Practicar: ${t.title || `Tema ${index+1}`}`,detail:'Preguntas del tema',href:`/materiales/${materialId}?tab=ejercicios&studyTopic=${index}`,minutes:t.questionsMinutes??1,icon:ListChecks},
   {id:'flashcards',label:'Repasar flashcards',detail:`Tarjetas del tema ${index+1}`,href:`/materiales/${materialId}?tab=tarjetas&studyTopic=${index}`,minutes:t.flashcardsMinutes??1,icon:Layers3},
   {id:'glossary',label:'Revisar glosario',detail:`Conceptos del tema ${index+1}`,href:`/materiales/${materialId}?tab=glosario&studyTopic=${index}`,minutes:t.glossaryMinutes??1,icon:BookText}
  ];
  return all.filter(step=>step.id==='reading'||t[step.id]);
 };
 const sessionMinutes=visibleTopics.reduce((total,index)=>total+buildSteps(index).filter(step=>!done[`${index}:${step.id}`]).reduce((minutes,step)=>minutes+step.minutes,0),0);
 return <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
  {visibleTopics.map((topic,groupIndex)=>{
   const steps=buildSteps(topic);
      return <div key={topic}>
    <div className={`flex items-center justify-between px-3 py-1.5 text-[11px] font-semibold text-slate-500 ${groupIndex?'border-t border-slate-200 bg-slate-50/70':'border-b border-slate-100'}`}>
     <span>Tema {topic+1} de {topicCount}</span>{groupIndex>0?<span>Podés ir adelantando</span>:groupIndex===0?<span className="inline-flex items-center gap-1"><Clock3 className="size-3" />≈ {sessionMinutes} min en total</span>:null}
    </div>
    {steps.filter(step=>!done[`${topic}:${step.id}`]).map((step,i)=>{
     const Icon=step.icon;const completed=!!done[`${topic}:${step.id}`];
     const stepTone = step.id === 'reading' ? 'bg-blue-50 text-blue-700' : step.id === 'questions' ? 'bg-indigo-50 text-indigo-700' : step.id === 'flashcards' ? 'bg-violet-50 text-violet-700' : 'bg-amber-50 text-amber-700';
     const active=groupIndex===0 && i===0;
     return <Link key={step.id} href={step.href} className={`flex items-center gap-3 border-t border-slate-100 px-3 py-2.5 transition first:border-t-0 hover:bg-slate-50 ${active?'bg-blue-50/70':''}`}>
      <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${completed?'bg-emerald-50 text-emerald-700':stepTone}`}><Icon className="size-4"/></span>
      <span className="min-w-0 flex-1">
       <span className="block text-[12px] font-semibold">{step.label}</span>
       <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500">
        <span>{step.detail}</span>
       </span>
      </span>
      <ArrowRight className={`size-4 ${active?'text-blue-700':'text-slate-400'}`}/>
     </Link>;
    })}
   </div>;
  })}
 </div>;
}
