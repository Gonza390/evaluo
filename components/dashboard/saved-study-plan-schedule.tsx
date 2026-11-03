'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, Check, Flag, Layers3, ListChecks, Network, PencilLine, Zap } from 'lucide-react';
import { recommendTopicActivities, type PlanDay, type RecommendedStudyActivity } from '@/lib/student-materials/study-plan-distribution';

type ActivityId = RecommendedStudyActivity['id'];
const activityIcons: Record<ActivityId, typeof BookOpen> = {
  resumen: BookOpen, flashcards: Layers3, unir: Network, completar: PencilLine,
  opciones: ListChecks, casos: BookOpen, mixto: Zap, simulacro: ListChecks,
};
const activityTones: Record<ActivityId, string> = {
  resumen:'bg-[#E8F2FF] text-[#376CAD]', flashcards:'bg-[#F0EBFC] text-[#745AB3]',
  unir:'bg-[#E0F2F0] text-[#27817A]', completar:'bg-[#FAE9DE] text-[#AE663F]',
  opciones:'bg-[#E9F5EE] text-[#35816A]', casos:'bg-[#F0EBFC] text-[#745AB3]',
  mixto:'bg-[#FCF2DF] text-[#9A712C]', simulacro:'bg-[#E9EAED] text-[#626B7A]',
};
const dateKey=(date:Date)=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const dateObj=(key:string)=>new Date(`${key}T12:00:00`);
const weekday=(key:string)=>new Intl.DateTimeFormat('es-AR',{weekday:'short'}).format(dateObj(key)).replace('.','').toUpperCase();
const fullDate=(key:string)=>new Intl.DateTimeFormat('es-AR',{weekday:'long',day:'numeric',month:'long'}).format(dateObj(key));
const examDateLabel=(key:string)=>new Intl.DateTimeFormat('es-AR',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(dateObj(key));

export function SavedStudyPlanSchedule({days,examDate,completedKeys,preferences,dailyMinutes}: {
  days:PlanDay[]; examDate:string; completedKeys:string[]; preferences:string[]; dailyMinutes:number;
}) {
  const scheduled=days.filter(day=>day.topics.length>0).sort((a,b)=>a.date.localeCompare(b.date));
  const today=dateKey(new Date());
  const initial=scheduled.find(day=>day.date===today)??scheduled.find(day=>day.date>today)??scheduled.find(day=>day.topics.some(topic=>!completedKeys.includes(`${topic.materialId}:${topic.topicIndex}`)))??scheduled[0];
  const [selectedDate,setSelectedDate]=useState<string|null>(initial?.date??null);
  const [showAll,setShowAll]=useState(() => scheduled.findIndex(day=>day.date===initial?.date)>=3);
  const completed=new Set(completedKeys);
  const shown=showAll?scheduled:scheduled.slice(0,3);
  const selected=scheduled.find(day=>day.date===selectedDate)??initial;

  if(!scheduled.length)return <section aria-label="Tu plan de estudios" className="rounded-2xl border border-[#E7EBF4] bg-white p-3.5 text-[12px] text-[#66758D]">Todavía no hay días de estudio asignados a este plan.</section>;

  return <section data-saved-study-plan-schedule aria-labelledby="saved-study-plan-schedule-title" className="min-w-0">
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 id="saved-study-plan-schedule-title" className="text-[15px] font-normal tracking-tight text-[#0F1B3D]">Tu plan de estudios</h2>
      <span className="text-[11px] text-[#7F8AA3]">{scheduled.length} {scheduled.length===1?'día planificado':'días planificados'}</span>
    </div>
    <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white">
      <div className="border-b border-slate-100 px-3 py-1.5 text-[11px] font-normal text-slate-500">Días hasta el examen</div>
      <div className="divide-y divide-slate-100">
        {shown.map(day=>{
          const allRead=day.topics.every(topic=>completed.has(`${topic.materialId}:${topic.topicIndex}`));
          const selectedDay=day.date===selected?.date;
          const dayTitle=day.date===today?'Hoy':fullDate(day.date);
          return <div key={day.date}>
            <button type="button" onClick={()=>setSelectedDate(day.date)} aria-pressed={selectedDay}
              className={`flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#2563EB] ${selectedDay?'bg-slate-50/70':''}`}>
              <span className={`flex size-11 shrink-0 flex-col items-center justify-center rounded-lg ${selectedDay?'bg-[#EEF2FF]':'bg-[#F5F7FB]'}`}>
                <span className="text-[9px] font-medium uppercase text-[#7F8AA3]">{weekday(day.date)}</span>
                <span className="text-[17px] font-semibold leading-5 text-[#0F1B3D]">{dateObj(day.date).getDate()}</span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12px] font-medium capitalize text-[#0F1B3D]">{dayTitle}</span>
                <span className="mt-0.5 block text-[11px] text-[#66758D]">{day.topics.length} {day.topics.length===1?'tema':'temas'} · {day.estimatedMinutes} min estimados</span>
              </span>
              {allRead?<Check className="size-4 shrink-0 text-[#35816A]" aria-label="Temas leídos"/>:<ArrowRight className={`size-4 shrink-0 ${selectedDay?'text-[#2563EB]':'text-[#9DA9BE]'}`}/>}
            </button>
            {selectedDay&&<div className="border-t border-[#EFF2F7] bg-white">
              {day.topics.map((topic,topicPosition)=>{
                const read=completed.has(`${topic.materialId}:${topic.topicIndex}`);
                const steps=recommendTopicActivities(topic,preferences,dailyMinutes);
                return <div key={`${topic.materialId}:${topic.topicIndex}`} className={topicPosition?'border-t border-[#EFF2F7]':''}>
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-[#FAFBFD] px-3.5 py-2 text-[11px] text-[#66758D]">
                    <span className="min-w-0 font-medium">{topic.title} <span className="font-normal">· {topic.materialTitle}</span></span>
                    <span className="shrink-0">{read?'Leído':`${topic.estimatedMinutes} min aprox.`}</span>
                  </div>
                  {steps.map((step,index)=>{
                    const Icon=activityIcons[step.id];
                    return <Link key={step.id} href={step.href} className="flex items-center gap-3 border-t border-[#F0F2F7] px-3.5 py-3 transition-colors hover:bg-[#F7F9FD]">
                      <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${activityTones[step.id]}`}><Icon className="size-4" aria-hidden="true"/></span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[12px] font-medium text-[#0F1B3D]">{step.label}</span>
                        <span className="mt-0.5 block text-[11px] text-[#66758D]">{index===0?'Contenido del tema':'Actividad recomendada'}</span>
                      </span>
                      <ArrowRight className="size-4 shrink-0 text-[#9DA9BE]" aria-hidden="true"/>
                    </Link>;
                  })}
                </div>;
              })}
            </div>}
          </div>;
        })}
        {scheduled.length>3&&<button type="button" onClick={()=>setShowAll(v=>{if(v && scheduled.slice(0,3).every(day=>day.date!==selectedDate))setSelectedDate(scheduled[0]?.date??null);return !v})} className="flex min-h-10 w-full items-center px-3.5 text-left text-[12px] font-medium text-[#2563EB] hover:bg-[#F7F9FD]">
          {showAll?'Ver menos':`+ ${scheduled.length-3} días más`}
        </button>}
        <div className="flex items-center gap-3 px-3.5 py-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-[#FFF3E3] text-[#B8792E]"><Flag className="size-4" aria-hidden="true"/></span>
          <span className="min-w-0 flex-1">
            <span className="block text-[12px] font-medium text-[#0F1B3D]">Examen</span>
            <span className="mt-0.5 block text-[11px] capitalize text-[#66758D]">{examDateLabel(examDate)}</span>
          </span>
        </div>
      </div>
    </div>
  </section>;
}
