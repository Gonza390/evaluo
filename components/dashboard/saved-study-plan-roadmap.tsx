'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useOptionalAppLocale } from '@/components/i18n/app-locale-provider';
import { studyUiText } from '@/lib/i18n/study-ui-copy';
import { Check, Flag } from 'lucide-react';
import type { PlanDay, PlanTopic } from '@/lib/student-materials/study-plan-distribution';

type Topic = PlanTopic & { key: string };

function examLabel(date: string, locale: 'es' | 'en') {
  const parsed = new Date(`${date}T12:00:00`);
  return Number.isNaN(parsed.getTime())
    ? (locale === 'en' ? 'Date pending' : 'Fecha pendiente')
    : new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'es-AR', { weekday: 'short', day: 'numeric', month: 'short' }).format(parsed);
}

/** Visible only for a previously saved personal plan. No new progress state is created. */
export function SavedStudyPlanRoadmap({
  days, examDate, completedKeys,
}: {
  days: PlanDay[];
  examDate: string;
  completedKeys: string[];
}) {
  const locale = useOptionalAppLocale();
  const english = locale === 'en';
  const t = (v: string) => studyUiText(locale, v);
  const topics: Topic[] = days.flatMap(day =>
    day.topics.map(topic => ({ ...topic, key: `${topic.materialId}:${topic.topicIndex}` }))
  );
  const completed = new Set(completedKeys);
  const finished = topics.filter(topic => completed.has(topic.key)).length;
  const current = topics.findIndex(topic => !completed.has(topic.key));
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller || current < 0) return;
    const currentNode = scroller.querySelector<HTMLElement>(`[data-saved-roadmap-topic="${current}"]`);
    if (currentNode) scroller.scrollLeft = Math.max(0, currentNode.offsetLeft - scroller.offsetLeft - scroller.clientWidth / 4);
  }, [current]);

  if (!topics.length) return null;

  return (
    <section data-saved-study-plan-roadmap aria-label={english ? "Your journey to exam day" : "Tu recorrido hasta el examen"}
      className="min-w-0 rounded-2xl border border-slate-200/90 bg-white px-3 py-2.5 sm:px-4 sm:py-3.5 shadow-[0_3px_14px_rgba(15,23,42,0.025)]">
      <div className="mb-2 flex items-center justify-between gap-3 sm:mb-3">
        <h2 className="text-[14px] font-normal text-[#0F1B3D]">{english ? "Your journey" : "Tu recorrido"}</h2>
        <span className="text-[11px] text-[#7F8AA3]">{finished} {english ? "of" : "de"} {topics.length} {english ? "topics" : "temas"}</span>
      </div>
      <div className="flex min-w-0 items-start">
        <div ref={scrollRef} data-saved-roadmap-scroll tabIndex={0} role="region" aria-label={english ? "Topics: scroll horizontally" : "Temas del recorrido: desplazate horizontalmente"} className="min-w-0 flex-1 overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-max items-start">
        {topics.map((topic, index) => {
          const done = completed.has(topic.key);
          const isCurrent = index === current;
          return (
            <div key={topic.key} data-saved-roadmap-topic={index} className="relative w-[112px] shrink-0 text-center">
              {index > 0 && <span aria-hidden="true" className="absolute right-1/2 top-[13px] h-px w-full bg-[#E7EBF4]"/>}
              <Link href={`/materiales/${topic.materialId}?tab=resumen&studyTopic=${topic.topicIndex}`}
                aria-label={`${t('Tema')} ${index + 1}: ${topic.title}. ${english ? (done ? 'Read' : isCurrent ? 'You are here' : 'Pending') : (done ? 'Leído' : isCurrent ? 'Estás acá' : 'Pendiente')}`}
                className="relative z-10 flex min-w-0 flex-col items-center gap-2 rounded-lg px-0.5 py-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]">
                <span className={`flex size-[27px] shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-medium ${done ? 'border-[#35816A] bg-[#E7F5EC] text-[#35816A]' : isCurrent ? 'border-[#2563EB] bg-[#EEF2FF] text-[#2563EB]' : 'border-[#E7EBF4] bg-white text-[#7F8AA3]'}`}>
                  {done ? <Check className="size-4" aria-hidden="true"/> : index + 1}
                </span>
                <span title={topic.title} className={`line-clamp-2 min-h-8 w-full break-words text-[10px] leading-4 sm:text-[11px] ${isCurrent ? 'font-semibold text-[#0F1B3D]' : 'font-medium text-[#42506A]'}`}>{topic.title}</span>
                {isCurrent && <span className="text-[10px] font-medium text-[#2563EB]">{english ? "You are here" : "Estás acá"}</span>}
              </Link>
            </div>
          );
        })}
          </div>
        </div>
        <div className="relative w-[96px] shrink-0 text-center sm:w-[112px]">
          <span aria-hidden="true" className="absolute right-1/2 top-[13px] h-px w-full bg-[#E7EBF4]"/>
          <div className="relative z-10 flex min-w-0 flex-col items-center gap-2 px-0.5 py-0.5">
            <span className="flex size-[27px] shrink-0 items-center justify-center rounded-full border-2 border-[#E3B46C] bg-[#FFF3E3] text-[#B8792E]">
              <Flag className="size-4" aria-hidden="true"/>
            </span>
            <span className="text-[11px] font-semibold text-[#0F1B3D]">{t("Examen")}</span>
            <span className="text-[10px] capitalize text-[#7F8AA3]">{examLabel(examDate, locale)}</span>
          </div>
        </div>
      </div>

    </section>
  );
}
