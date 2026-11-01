'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, ChevronDown, ChevronRight, History, Layers3, ListChecks, Network, Timer, Zap } from 'lucide-react';
import type { PracticeHistoryEntry } from '@/lib/student-materials/practice-history';

const modeLabels: Record<string, string> = {
  unir: 'Unir conceptos',
  completar: 'Completar',
  casos: 'Casos',
  mixto: 'Mixto',
  simulacro: 'Simulacro de examen',
  opciones: 'Opciones',
  flashcards: 'Flashcards',
};
const modeIcons = { unir: Network, completar: ListChecks, casos: BookOpen, mixto: Zap,
  simulacro: Timer, opciones: ListChecks, flashcards: Layers3 };

function formatDate(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Fecha no disponible';
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'UTC',
  }).format(date);
}

export function PracticeHistoryPanel({ history, materialId }: {
  history: PracticeHistoryEntry[];
  materialId: string;
}) {
  const [showAll, setShowAll] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const filtered = useMemo(() => history.filter((item) => item.materialId === materialId),
    [history, materialId]);
  const visible = showAll ? filtered : filtered.slice(0, 3);

  return (
    <section aria-labelledby="practice-history-title" className="min-w-0">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 id="practice-history-title" className="text-[22px] font-semibold tracking-[-0.045em] text-[#0F1B3D] sm:text-[25px]">Tus prácticas</h2>
          <p className="mt-1 text-[12px] text-slate-500">Tus actividades completadas con este material</p>
        </div>
        <History aria-hidden="true" className="size-[19px] text-slate-400" />
      </div>
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#DDE5F1] bg-[#F9FAFD] px-5 py-9 text-center">
          <span className="mx-auto flex size-11 items-center justify-center rounded-2xl bg-white text-[#4F5DFF] shadow-sm">
            <History className="size-5" aria-hidden="true" />
          </span>
          <p className="mt-3 text-[13px] font-semibold text-[#0F1B3D]">Todavía no tenés prácticas realizadas</p>
          <p className="mx-auto mt-1 max-w-[32ch] text-[12px] leading-5 text-slate-500">
            Cuando termines una actividad, vas a encontrar su resultado acá.
          </p>
        </div>
      ) : (
        <>
          <div className="divide-y divide-slate-100">
            {visible.map((item) => {
              const isOpen = expandedId === item.id;
              const Icon = modeIcons[item.mode as keyof typeof modeIcons] ?? History;
              const percent = Math.round(item.correct / item.total * 100);
              const isRecall = item.mode === 'flashcards';
              const title = modeLabels[item.mode] ?? item.mode;
              return (
                <article key={item.id} className="py-2.5 first:pt-0">
                  <button type="button" aria-expanded={isOpen}
                    onClick={() => setExpandedId(isOpen ? null : item.id)}
                    className="group flex min-h-[66px] w-full items-center gap-3 rounded-xl px-1 py-1 text-left outline-none transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#4F5DFF]">
                    <span className="relative flex size-11 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold tabular-nums text-[#0F1B3D]"
                      style={{ background: `conic-gradient(#4F5DFF ${percent}%, #E6EAF1 ${percent}% 100%)` }}>
                      <span className="flex size-[37px] items-center justify-center rounded-full bg-white">{percent}%</span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5 text-[13px] font-medium text-slate-900">
                        <Icon size={14} className="shrink-0 text-slate-500" aria-hidden="true" />
                        <span className="truncate">{title}</span>
                      </span>
                      <span className="mt-0.5 block text-[11px] text-slate-500">{formatDate(item.completedAt)}</span>
                      <span className="mt-0.5 block text-[11px] text-slate-500">
                        {item.correct} de {item.total} {isRecall ? 'recordadas' : 'correctas'}
                      </span>
                    </span>
                    {isOpen ? <ChevronDown className="size-4 shrink-0 text-slate-400" aria-hidden="true" /> :
                      <ChevronRight className="size-4 shrink-0 text-slate-400 group-hover:text-slate-700" aria-hidden="true" />}
                  </button>
                  {isOpen && (
                    <div className="ml-1 mt-1 rounded-xl border border-[#E5EAF4] bg-[#FAFBFE] p-3">
                      <p className="text-[12px] font-medium text-[#0F1B3D]">
                        {isRecall ? 'Tarjetas recordadas' : 'Resultado orientativo'}: {item.correct} de {item.total}
                      </p>
                      {item.answers?.length ? (
                        <div className="mt-3 max-h-[340px] space-y-2 overflow-y-auto pr-1">
                          {item.answers.map((answer, index) => (
                            <div key={index} className="rounded-lg border border-[#E7EBF4] bg-white p-3 text-[12px] leading-5">
                              <p className="font-medium text-slate-800">{index + 1}. {answer.prompt}</p>
                              <p className={`mt-1 font-medium ${answer.correct ? 'text-emerald-700' : 'text-rose-700'}`}>
                                {isRecall ? (answer.correct ? 'Lo sabía' : 'No lo sabía') : (answer.correct ? 'Correcta' : 'Para reforzar')}
                              </p>
                              {!isRecall && <p className="mt-0.5 text-slate-600">Tu respuesta: {answer.selectedAnswer || 'Sin responder'}</p>}
                              <p className="mt-0.5 text-slate-600">{isRecall ? 'Respuesta de la tarjeta' : 'Respuesta esperada'}: {answer.correctAnswer}</p>
                            </div>
                          ))}
                        </div>
                      ) : <p className="mt-2 text-[12px] leading-5 text-slate-500">
                        Esta práctica es anterior al historial detallado. Se conserva su resultado, pero no las respuestas individuales.
                      </p>}
                      <Link href={`/dashboard/practicar/${item.materialId}/${item.mode}`}
                        className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#2563EB] px-4 text-[12px] font-medium text-white hover:bg-[#1D4ED8]">
                        Practicar otra vez <ArrowRight className="size-3.5" aria-hidden="true"/>
                      </Link>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
          {filtered.length > 3 && <button type="button" onClick={() => setShowAll((value) => !value)}
            className="mt-3 inline-flex min-h-10 items-center gap-1 text-[12px] font-medium text-[#2563EB] hover:underline">
            {showAll ? 'Ver menos' : `Ver todas (${filtered.length})`}
            <ChevronRight className={`size-3.5 transition-transform ${showAll ? '-rotate-90' : ''}`} aria-hidden="true"/>
          </button>}
        </>
      )}
    </section>
  );
}
