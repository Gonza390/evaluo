'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check, Flag } from 'lucide-react';
import type { PlanDay, PlanTopic } from '@/lib/student-materials/study-plan-distribution';

const WINDOW_SIZE = 4;
type Topic = PlanTopic & { key: string };

function examLabel(date: string) {
  const parsed = new Date(`${date}T12:00:00`);
  return Number.isNaN(parsed.getTime())
    ? 'Fecha pendiente'
    : new Intl.DateTimeFormat('es-AR', { weekday: 'short', day: 'numeric', month: 'short' }).format(parsed);
}

/** Visible only for a previously saved personal plan. No new progress state is created. */
export function SavedStudyPlanRoadmap({
  days, examDate, completedKeys,
}: {
  days: PlanDay[];
  examDate: string;
  completedKeys: string[];
}) {
  const topics: Topic[] = days.flatMap(day =>
    day.topics.map(topic => ({ ...topic, key: `${topic.materialId}:${topic.topicIndex}` }))
  );
  const completed = new Set(completedKeys);
  const finished = topics.filter(topic => completed.has(topic.key)).length;
  const current = topics.findIndex(topic => !completed.has(topic.key));
  const active = current < 0 ? Math.max(0, topics.length - 1) : current;
  const maxStart = Math.max(0, topics.length - WINDOW_SIZE);
  const [windowStart, setWindowStart] = useState(() => Math.min(Math.max(0, active - 1), maxStart));
  const start = Math.min(windowStart, maxStart);
  const visible = topics.slice(start, start + WINDOW_SIZE);
  const hasPrevious = start > 0;
  const hasNext = start + WINDOW_SIZE < topics.length;

  if (!topics.length) return null;

  return (
    <section data-saved-study-plan-roadmap aria-label="Tu recorrido hasta el examen"
      className="min-w-0 rounded-2xl border border-[#E7EBF4] bg-white p-4 shadow-[0_3px_14px_rgba(15,23,42,0.025)] sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-semibold tracking-tight text-[#0F1B3D]">Tu recorrido</h2>
        <span className="text-[11px] text-[#7F8AA3]">{finished} de {topics.length} temas</span>
      </div>
      <div className="grid grid-cols-5 items-start gap-1 sm:gap-2">
        {visible.map((topic, offset) => {
          const index = start + offset;
          const done = completed.has(topic.key);
          const isCurrent = index === current;
          return (
            <div key={topic.key} className="relative min-w-0 text-center">
              {offset > 0 && <span aria-hidden="true" className="absolute right-1/2 top-[17px] -z-0 h-px w-full bg-[#E7EBF4]"/>}
              <Link href={`/materiales/${topic.materialId}?tab=resumen&studyTopic=${topic.topicIndex}`}
                aria-label={`Tema ${index + 1}: ${topic.title}. ${done ? 'Leído' : isCurrent ? 'Estás acá' : 'Pendiente'}`}
                className="relative z-10 flex min-w-0 flex-col items-center gap-2 rounded-lg px-0.5 py-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]">
                <span className={`flex size-9 shrink-0 items-center justify-center rounded-full border-2 text-[12px] font-semibold ${done ? 'border-[#35816A] bg-[#E7F5EC] text-[#35816A]' : isCurrent ? 'border-[#2563EB] bg-[#EEF2FF] text-[#2563EB]' : 'border-[#E7EBF4] bg-white text-[#7F8AA3]'}`}>
                  {done ? <Check className="size-4" aria-hidden="true"/> : index + 1}
                </span>
                <span title={topic.title} className={`line-clamp-2 min-h-8 w-full break-words text-[10px] leading-4 sm:text-[11px] ${isCurrent ? 'font-semibold text-[#0F1B3D]' : 'font-medium text-[#42506A]'}`}>{topic.title}</span>
                {isCurrent && <span className="text-[10px] font-medium text-[#2563EB]">Estás acá</span>}
              </Link>
            </div>
          );
        })}
        <div className="relative min-w-0 text-center">
          <span aria-hidden="true" className="absolute right-1/2 top-[17px] h-px w-full bg-[#E7EBF4]"/>
          <div className="relative z-10 flex min-w-0 flex-col items-center gap-2 px-0.5 py-0.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-[#E3B46C] bg-[#FFF3E3] text-[#B8792E]">
              <Flag className="size-4" aria-hidden="true"/>
            </span>
            <span className="text-[11px] font-semibold text-[#0F1B3D]">Examen</span>
            <span className="text-[10px] capitalize text-[#7F8AA3]">{examLabel(examDate)}</span>
          </div>
        </div>
      </div>
      {topics.length > WINDOW_SIZE && (
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#E7EBF4] pt-3">
          <button type="button" disabled={!hasPrevious} onClick={() => setWindowStart(value => Math.max(0, value - 1))}
            className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-[11px] font-medium text-[#42506A] hover:bg-[#F5F7FB] disabled:opacity-35">
            <ArrowLeft className="size-3.5" aria-hidden="true"/> Anterior
          </button>
          <span className="text-center text-[11px] tabular-nums text-[#7F8AA3]">Temas {start + 1}–{start + visible.length} de {topics.length}</span>
          <button type="button" disabled={!hasNext} onClick={() => setWindowStart(value => Math.min(maxStart, value + 1))}
            className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-[11px] font-medium text-[#42506A] hover:bg-[#F5F7FB] disabled:opacity-35">
            Siguiente <ArrowRight className="size-3.5" aria-hidden="true"/>
          </button>
        </div>
      )}
    </section>
  );
}
