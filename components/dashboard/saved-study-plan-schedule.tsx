'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useOptionalAppLocale } from '@/components/i18n/app-locale-provider';
import { studyUiText } from '@/lib/i18n/study-ui-copy';
import { ArrowRight, BookOpen, Check, ChevronDown, Flag, Layers3, ListChecks, Network, PencilLine, Zap } from 'lucide-react';
import { additionalPlanPractice, optionalPreviousTopicReviews, recommendTopicActivities, type PlanDay, type RecommendedStudyActivity } from '@/lib/student-materials/study-plan-distribution';

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
const weekday=(key:string,locale:'es'|'en')=>new Intl.DateTimeFormat(locale==='en'?'en-US':'es-AR',{weekday:'short'}).format(dateObj(key)).replace('.','').toUpperCase();
const fullDate=(key:string,locale:'es'|'en')=>new Intl.DateTimeFormat(locale==='en'?'en-US':'es-AR',{weekday:'long',day:'numeric',month:'long'}).format(dateObj(key));
const examDateLabel=(key:string,locale:'es'|'en')=>new Intl.DateTimeFormat(locale==='en'?'en-US':'es-AR',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(dateObj(key));

export function SavedStudyPlanSchedule({days,examDate,completedKeys,planCompletedKeys=[],preferences,dailyMinutes}: {
  days:PlanDay[]; examDate:string; completedKeys:string[]; planCompletedKeys?:string[]; preferences:string[]; dailyMinutes:number;
}) {
  const locale = useOptionalAppLocale();
  const english = locale === 'en';
  const t = (v: string) => studyUiText(locale, v);
  const scheduled=days.filter(day=>day.topics.length>0).sort((a,b)=>a.date.localeCompare(b.date));
  const today=dateKey(new Date());
  const initial=scheduled.find(day=>day.date===today)??scheduled.find(day=>day.date>today)??scheduled.find(day=>day.topics.some(topic=>!completedKeys.includes(`${topic.materialId}:${topic.topicIndex}`)))??scheduled[0];
  const [selectedDate,setSelectedDate]=useState<string|null>(initial?.date??null);
  const [showAll,setShowAll]=useState(() => scheduled.findIndex(day=>day.date===initial?.date)>=3);
  const [expandedTopic,setExpandedTopic]=useState<{date:string;key:string}|null>(null);
  const bonusActivities=additionalPlanPractice(days,preferences,dailyMinutes);
  const optionalReviews=optionalPreviousTopicReviews(days,preferences,dailyMinutes);
  const completed=new Set(completedKeys);
  const fullyCompleted=new Set(planCompletedKeys);
  const shown=showAll?scheduled:scheduled.slice(0,3);
  const selected=scheduled.find(day=>day.date===selectedDate)??initial;
  const nextTopic=selected?.topics.find(topic=>!fullyCompleted.has(`${topic.materialId}:${topic.topicIndex}`))??selected?.topics[0];
  const activeTopicKey=expandedTopic?.date===selected?.date?expandedTopic.key:(nextTopic?`${nextTopic.materialId}:${nextTopic.topicIndex}`:null);

  if(!scheduled.length)return <section aria-label={english ? "Your study plan" : "Tu plan de estudios"} className="rounded-2xl border border-[#E7EBF4] bg-white p-3.5 text-[12px] text-[#66758D]">{english ? "No study days have been scheduled yet." : "Todavía no hay días de estudio asignados a este plan."}</section>;

  return <section data-saved-study-plan-schedule aria-labelledby="saved-study-plan-schedule-title" className="min-w-0">
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 id="saved-study-plan-schedule-title" className="text-[15px] font-normal tracking-tight text-[#0F1B3D]">{english ? "Your study plan" : "Tu plan de estudios"}</h2>
      <span className="text-[11px] text-[#7F8AA3]">{scheduled.length} {scheduled.length===1 ? (english ? 'scheduled day' : 'día planificado') : (english ? 'scheduled days' : 'días planificados')}</span>
    </div>
    <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white">
      <div className="border-b border-slate-100 px-3 py-1.5 text-[11px] font-normal text-slate-500">{english ? "Days until the exam" : "Días hasta el examen"}</div>
      <div className="divide-y divide-slate-100">
        {shown.map(day=>{
          const allRead=day.topics.every(topic=>fullyCompleted.has(`${topic.materialId}:${topic.topicIndex}`));
          const selectedDay=day.date===selected?.date;
          const dayTitle=day.date===today ? t('Hoy') : fullDate(day.date, locale);
          return <div key={day.date}>
            <button type="button" onClick={()=>setSelectedDate(day.date)} aria-pressed={selectedDay}
              className={`flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#2563EB] ${selectedDay?'bg-slate-50/70':''}`}>
              <span className={`flex size-11 shrink-0 flex-col items-center justify-center rounded-lg ${selectedDay?'bg-[#EEF2FF]':'bg-[#F5F7FB]'}`}>
                <span className="text-[9px] font-medium uppercase text-[#7F8AA3]">{weekday(day.date, locale)}</span>
                <span className="text-[17px] font-semibold leading-5 text-[#0F1B3D]">{dateObj(day.date).getDate()}</span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12px] font-medium capitalize text-[#0F1B3D]">{dayTitle}</span>
                <span className="mt-0.5 block text-[11px] text-[#66758D]">{day.topics.length} {day.topics.length===1 ? (english ? 'topic' : 'tema') : (english ? 'topics' : 'temas')} · {day.estimatedMinutes+day.topics.filter(topic=>bonusActivities.has(`${topic.materialId}:${topic.topicIndex}`)).length*8+(optionalReviews.has(day.date)?8:0)} {english ? 'estimated min' : 'min estimados'}</span>
              </span>
              {allRead?<Check className="size-4 shrink-0 text-[#35816A]" aria-label={english ? "Topics read" : "Temas leídos"}/>:<ArrowRight className={`size-4 shrink-0 ${selectedDay?'text-[#2563EB]':'text-[#9DA9BE]'}`}/>}
            </button>
            {selectedDay&&<div className="border-t border-[#EFF2F7] bg-white">
              {day.topics.map((topic,topicPosition)=>{
                const topicKey=`${topic.materialId}:${topic.topicIndex}`;
                const read=completed.has(topicKey);
                const fullyDone=fullyCompleted.has(topicKey);
                const isExpanded=activeTopicKey===topicKey;
                const panelId=`saved-plan-topic-${day.date}-${topic.materialId}-${topic.topicIndex}`;
                return <div key={topicKey} className={topicPosition?'border-t border-[#EFF2F7]':''}>
                  <button type="button" data-saved-plan-topic-toggle aria-expanded={isExpanded} aria-controls={panelId}
                    onClick={()=>setExpandedTopic({date:day.date,key:topicKey})}
                    className={`flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#2563EB] ${isExpanded?'bg-[#FAFBFD]':''}`}>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[12px] font-medium leading-5 text-[#0F1B3D]">{topic.title}</span>
                      {isExpanded&&<span className="mt-0.5 block truncate text-[11px] text-[#66758D]">{topic.materialTitle} · {fullyDone ? (english ? 'Completed' : 'Completado') : read ? (english ? 'Read' : 'Lectura hecha') : `${topic.estimatedMinutes} ${english ? 'min approx.' : 'min aprox.'}`}</span>}
                    </span>
                    {fullyDone&&<Check className="size-4 shrink-0 text-[#35816A]" aria-label={english ? "Topic completed" : "Tema completado"}/>}
                    <ChevronDown className={`size-4 shrink-0 text-[#9DA9BE] transition-transform ${isExpanded?'rotate-180 text-[#2563EB]':''}`} aria-hidden="true"/>
                  </button>
                  {isExpanded&&<div id={panelId} data-saved-plan-topic-details className="border-t border-[#EFF2F7] bg-white">
                    {recommendTopicActivities(topic,preferences,dailyMinutes,bonusActivities.get(topicKey)??0).map((step,index)=>{
                      const Icon=activityIcons[step.id];
                      return <Link key={step.id} href={step.id==='resumen'?step.href:`${step.href}&planTopic=${topic.topicIndex}`} className="flex items-center gap-3 border-t border-[#F0F2F7] px-3.5 py-3 transition-colors first:border-t-0 hover:bg-[#F7F9FD]">
                        <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${activityTones[step.id]}`}><Icon className="size-4" aria-hidden="true"/></span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[12px] font-medium text-[#0F1B3D]">{t(step.label)}</span>
                          <span className="mt-0.5 block text-[11px] text-[#66758D]">{index===0 ? (english ? 'Topic content' : 'Contenido del tema') : (english ? 'Recommended activity' : 'Actividad recomendada')}</span>
                        </span>
                        <ArrowRight className="size-4 shrink-0 text-[#9DA9BE]" aria-hidden="true"/>
                      </Link>;
                    })}
                    {topicPosition===0 && optionalReviews.has(day.date) && (()=>{
                      const review=optionalReviews.get(day.date)!;
                      const Icon=activityIcons[review.activity.id];
                      return <Link href={`${review.activity.href}&planTopic=${review.topic.topicIndex}`} className="flex items-center gap-3 border-t border-[#F0F2F7] px-3.5 py-3 transition-colors hover:bg-[#F7F9FD]">
                        <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${activityTones[review.activity.id]}`}><Icon className="size-4" aria-hidden="true"/></span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[12px] font-medium text-[#0F1B3D]">{english ? "Review" : "Repasar"}: {review.topic.title}</span>
                          <span className="mt-0.5 block text-[11px] text-[#66758D]">{english ? "Optional review" : "Repaso opcional"} · {t(review.activity.label)}</span>
                        </span>
                        <ArrowRight className="size-4 shrink-0 text-[#9DA9BE]" aria-hidden="true"/>
                      </Link>;
                    })()}
                  </div>}
                </div>;
              })}
            </div>}
          </div>;
        })}
        {scheduled.length>3&&<button type="button" onClick={()=>setShowAll(v=>{if(v && scheduled.slice(0,3).every(day=>day.date!==selectedDate))setSelectedDate(scheduled[0]?.date??null);return !v})} className="flex min-h-10 w-full items-center px-3.5 text-left text-[12px] font-medium text-[#2563EB] hover:bg-[#F7F9FD]">
          {showAll ? t('Ver menos') : `+ ${scheduled.length-3} ${english ? 'more days' : 'días más'}`}
        </button>}
        <div className="flex items-center gap-3 px-3.5 py-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-[#FFF3E3] text-[#B8792E]"><Flag className="size-4" aria-hidden="true"/></span>
          <span className="min-w-0 flex-1">
            <span className="block text-[12px] font-medium text-[#0F1B3D]">{t("Examen")}</span>
            <span className="mt-0.5 block text-[11px] capitalize text-[#66758D]">{examDateLabel(examDate, locale)}</span>
          </span>
        </div>
      </div>
    </div>
  </section>;
}
