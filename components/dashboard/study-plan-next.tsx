'use client';
import Link from 'next/link';
import { useOptionalAppLocale } from '@/components/i18n/app-locale-provider';
import { useEffect, useState } from 'react';
import { ArrowRight, BookOpen, ListChecks, Layers3, BookText, CheckCircle2 } from 'lucide-react';
import { getProgress, syncStudyPlanProgress, type TopicActivities } from '@/lib/study-plan-progress';

type Step = { id: 'reading'|'questions'|'flashcards'|'glossary'; label: string; detail: string; href: string; minutes: number; icon: typeof BookOpen };
export function StudyPlanNext({ materialId, topicCount, topicActivities }: { materialId:string; topicCount:number; topicActivities:TopicActivities[] }) {
 const english = useOptionalAppLocale() === 'en';
 const [done,setDone]=useState<Record<string,boolean>>({});
 useEffect(()=>{
  const update=()=>setDone(getProgress(materialId,topicActivities).record);
  void syncStudyPlanProgress(materialId).then(update);
  update();window.addEventListener('focus',update);window.addEventListener('pageshow',update);
  return ()=>{window.removeEventListener('focus',update);window.removeEventListener('pageshow',update);};
 },[materialId,topicActivities]);
 if (!topicCount) return <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-500">{english ? 'There are no topics to study yet.' : 'Todavía no hay temas para estudiar.'}</div>;
 const isFinished=(index:number)=>{
  const resources=topicActivities[index];
  return !!done[`${index}:reading`] && (!resources?.questions || !!done[`${index}:questions`]) && (!resources?.flashcards || !!done[`${index}:flashcards`]) && (!resources?.glossary || !!done[`${index}:glossary`]);
 };
 let firstPending=0;
 while(firstPending<topicCount && isFinished(firstPending)) firstPending++;
 if(firstPending===topicCount) return <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-[13px] font-medium text-emerald-800"><CheckCircle2 className="size-5" /> {english ? 'You completed all PDF activities!' : '¡Completaste las actividades del PDF!'}</div>;
 const first=topicActivities[firstPending];
 // Empezar el siguiente tema es opcional cuando la lectura y las preguntas del actual ya están hechas.
 const canStartNext=!!done[`${firstPending}:reading`] && (!first.questions || !!done[`${firstPending}:questions`]) && firstPending+1<topicCount;
 const visibleTopics=canStartNext?[firstPending,firstPending+1]:[firstPending];
 const buildSteps=(index:number):Step[]=>{
  const t=topicActivities[index];
  const all:Step[]=[
   {id:'reading',label:`${english ? 'Read' : 'Leer'}: ${t.title || `${english ? 'Topic' : 'Tema'} ${index+1}`}`,detail:english ? 'Topic content' : 'Contenido del tema',href:`/materiales/${materialId}?tab=resumen&studyTopic=${index}`,minutes:t.readingMinutes??1,icon:BookOpen},
   {id:'questions',label:`${english ? 'Practice' : 'Practicar'}: ${t.title || `${english ? 'Topic' : 'Tema'} ${index+1}`}`,detail:english ? 'Topic questions' : 'Preguntas del tema',href:`/materiales/${materialId}?tab=ejercicios&studyTopic=${index}`,minutes:t.questionsMinutes??1,icon:ListChecks},
   {id:'flashcards',label:english ? 'Review flashcards' : 'Repasar flashcards',detail:`${english ? 'Flashcards for topic' : 'Tarjetas del tema'} ${index+1}`,href:`/materiales/${materialId}?tab=tarjetas&studyTopic=${index}`,minutes:t.flashcardsMinutes??1,icon:Layers3},
   {id:'glossary',label:english ? 'Review glossary' : 'Revisar glosario',detail:`${english ? 'Concepts from topic' : 'Conceptos del tema'} ${index+1}`,href:`/materiales/${materialId}?tab=glosario&studyTopic=${index}`,minutes:t.glossaryMinutes??1,icon:BookText}
  ];
  return all.filter(step=>step.id==='reading'||t[step.id]);
 };
 return <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white">
  {visibleTopics.map((topic,groupIndex)=>{
   const steps=buildSteps(topic);
      return <div key={topic}>
    <div className={`flex items-center justify-between px-3 py-1.5 text-[11px] font-normal text-slate-500 ${groupIndex?'border-t border-slate-200 bg-slate-50/70':'border-b border-slate-100'}`}>
     <span>{english ? 'Topic' : 'Tema'} {topic+1} {english ? 'of' : 'de'} {topicCount}</span>{groupIndex>0?<span>{english ? 'You can get ahead' : 'Podés ir adelantando'}</span>:null}
    </div>
    {steps.filter(step=>!done[`${topic}:${step.id}`]).map((step,i)=>{
     const Icon=step.icon;const completed=!!done[`${topic}:${step.id}`];
     const stepTone = step.id === 'reading' ? 'bg-[#E8F2FF] text-[#376CAD]' : step.id === 'questions' ? 'bg-[#E9F5EE] text-[#35816A]' : step.id === 'flashcards' ? 'bg-[#F0EBFC] text-[#745AB3]' : 'bg-[#E2F2F7] text-[#41839B]';
     const active=groupIndex===0 && i===0;
     return <Link key={step.id} href={step.href} className={`flex items-center gap-3 border-t border-slate-100 px-3.5 py-3 transition first:border-t-0 hover:bg-slate-50 ${active?'bg-slate-50/70':''}`}>
      <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${completed?'bg-emerald-50 text-emerald-700':stepTone}`}><Icon className="size-4"/></span>
      <span className="min-w-0 flex-1">
       <span className="block text-[12px] font-medium">{step.label}</span>
       <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500">
        <span>{step.detail}</span>
        {!completed?<span>≈ {step.minutes} min</span>:null}
       </span>
      </span>
      <ArrowRight className={`size-4 ${active?'text-blue-700':'text-slate-400'}`}/>
     </Link>;
    })}
   </div>;
  })}
 </div>;
}
