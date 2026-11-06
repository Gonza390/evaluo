'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, BookOpen, ChartNoAxesColumnIncreasing, Check, CheckCircle2, ChevronRight, CircleAlert, History, Layers3, ListChecks, Network, RotateCcw, Timer, Zap } from 'lucide-react';
import type { PracticeHistoryEntry } from '@/lib/student-materials/practice-history';
import scrollbarStyles from './practice-history-scrollbar.module.css';
import { useOptionalAppLocale } from '@/components/i18n/app-locale-provider';

const modeLabels: Record<string, string> = {
  unir: 'Unir conceptos', completar: 'Completar', casos: 'Casos',
  mixto: 'Mixto', simulacro: 'Simulacro de examen', opciones: 'Opciones', flashcards: 'Flashcards',
};
const modeLabelsEn: Record<string,string> = {unir:'Match concepts',completar:'Fill in the blanks',casos:'Case studies',mixto:'Mixed practice',simulacro:'Mock exam',opciones:'Multiple choice',flashcards:'Flashcards'};
const modeIcons = { unir: Network, completar: ListChecks, casos: BookOpen,
  mixto: Zap, simulacro: Timer, opciones: Check, flashcards: Layers3 };
const modePalette: Record<string, string> = {
  unir: 'bg-[#E0F2F0] text-[#27817A]', completar: 'bg-[#FAE9DE] text-[#AE663F]',
  casos: 'bg-[#EBE4FA] text-[#6C52A8]', mixto: 'bg-[#FCF2DF] text-[#9A712C]',
  simulacro: 'bg-[#E9EAED] text-[#626B7A]', opciones: 'bg-[#E3F2E5] text-[#398052]',
  flashcards: 'bg-[#E2F2F7] text-[#41839B]',
};
// History uses the viewer's local dates and times.

function dayKey(value: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(value);
}
function dateLabel(value: string, now: Date, english: boolean) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return (english ? 'Date unavailable' : 'Fecha no disponible');
  const today = dayKey(now);
  const yesterday = dayKey(new Date(now.getTime() - 86_400_000));
  const day = dayKey(date);
  if (day === today) return english ? 'Today' : 'Hoy';
  if (day === yesterday) return english ? 'Yesterday' : 'Ayer';
  return new Intl.DateTimeFormat(english ? 'en-US' : 'es-AR', {
    day: 'numeric', month: 'short', year: 'numeric',
  }).format(date);
}
function timeLabel(value: string, english: boolean) {
  return new Intl.DateTimeFormat(english ? 'en-US' : 'es-AR', {
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(value));
}
function percentOf(item: PracticeHistoryEntry) {
  return item.total > 0 ? Math.round(item.correct * 100 / item.total) : 0;
}
function average(items: PracticeHistoryEntry[]) {
  return items.length ? Math.round(items.reduce((sum, item) => sum + percentOf(item), 0) / items.length) : 0;
}

export function PracticeHistoryPanel({ history, materialId, onStartFlashcards, onSelectSession, historyLoadError = false, selectedSession = null, onBackToHistory }: {
  history: PracticeHistoryEntry[]; materialId: string;
  onStartFlashcards?: () => void;
  onSelectSession: (entry: PracticeHistoryEntry) => void;
  historyLoadError?: boolean;
  selectedSession?: PracticeHistoryEntry | null;
  onBackToHistory?: () => void;
}) {
  const router = useRouter();
  const english = useOptionalAppLocale() === 'en';
  const tr = (es:string,en:string)=>english?en:es;
  const labels = english ? modeLabelsEn : modeLabels;
  const now = useMemo(() => new Date(), []);
  const sessions = useMemo(() => history.filter(item => item.materialId === materialId), [history, materialId]);
  const totalToReview = sessions.reduce((sum, item) => sum + item.total - item.correct, 0);
  const averageScore = average(sessions);
  const groups: { key: string; items: PracticeHistoryEntry[] }[] = [];
  for (const entry of sessions) {
    const key = dateLabel(entry.completedAt, now, english);
    const last = groups[groups.length - 1];
    if (last?.key === key) last.items.push(entry);
    else groups.push({ key, items: [entry] });
  }

  // El detalle se abre en el mismo panel, sin sustituir la pantalla de Practicar.
  if (selectedSession && selectedSession.materialId === materialId) {
    const percent = percentOf(selectedSession);
    const incorrect = Math.max(0, selectedSession.total - selectedSession.correct);
    return (
      <aside data-practice-history-inline-detail aria-labelledby="practice-history-detail-title"
        className="flex h-[min(72dvh,680px)] min-h-0 min-w-0 flex-col overflow-hidden rounded-[18px] border border-[#E7EBF4] bg-white shadow-[0_5px_22px_rgba(15,27,61,0.035)] lg:h-full lg:max-h-full">
        <div className="shrink-0 border-b border-[#EFF2F7] px-4 pb-3 pt-3 sm:px-5 sm:pt-4">
          <button type="button" onClick={onBackToHistory}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg text-[11px] font-semibold text-[#2563EB] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]">
            <ArrowLeft className="size-3.5" aria-hidden="true"/> {tr("Volver a prácticas realizadas","Back to completed practice")}
          </button>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
            <div className="min-w-0 flex-1">
              <h2 id="practice-history-detail-title" className="text-[17px] font-semibold tracking-[-0.035em] text-[#0F1B3D] sm:text-[18px]">
                {labels[selectedSession.mode] ?? selectedSession.mode}
              </h2>
              <p className="mt-0.5 text-[10px] text-[#66758D]">{dateLabel(selectedSession.completedAt,now,english)} · {timeLabel(selectedSession.completedAt,english)}</p>
            </div>
            <div aria-label={tr("Resultado de la práctica","Practice result")} className="flex shrink-0 items-center gap-2.5 sm:gap-3">
              <div className="text-center"><p className="text-[9px] text-[#66758D]">{tr("Resultado","Result")}</p><p className="text-[15px] font-semibold leading-5 text-[#0F1B3D]">{percent}%</p></div>
              <span className="h-7 w-px bg-[#E7EBF4]" aria-hidden="true"/>
              <div className="text-center"><p className="text-[9px] text-[#66758D]">{tr("Correctas","Correct")}</p><p className="text-[15px] font-semibold leading-5 text-[#0F1B3D]">{selectedSession.correct}/{selectedSession.total}</p></div>
              <span className="h-7 w-px bg-[#E7EBF4]" aria-hidden="true"/>
              <div className="text-center"><p className="text-[9px] text-[#66758D]">{tr("Revisar","Review")}</p><p className="text-[15px] font-semibold leading-5 text-[#0F1B3D]">{incorrect}</p></div>
            </div>
          </div>
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-[#EDF1F6]" role="progressbar" aria-label={tr("Porcentaje de respuestas correctas","Percentage of correct answers")} aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
            <div className={`h-full rounded-full ${percent >= 80 ? 'bg-emerald-500' : 'bg-[#E0AB45]'}`} style={{width:`${percent}%`}}/>
          </div>
        </div>
        <div data-practice-history-answers tabIndex={0} role="region" aria-label={tr("Respuestas de la práctica","Practice answers")} className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4 [scrollbar-color:#B8C6DC_transparent] [scrollbar-width:thin] sm:px-5">
          {selectedSession.answers?.length ? selectedSession.answers.map((answer,index)=>(
            <article key={index} className="rounded-xl border border-[#E7EBF4] bg-white p-3">
              <div className="flex items-center gap-2">
                {answer.correct ? <CheckCircle2 className="size-4 shrink-0 text-[#358458]"/> : <CircleAlert className="size-4 shrink-0 text-[#B86A36]"/>}
                <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#66758D]">{tr('Pregunta','Question')} {index+1} · {answer.correct?tr('Correcta','Correct'):tr('Para repasar','To review')}</span>
              </div>
              <p className="mt-2 break-words text-[12px] font-semibold leading-5 text-[#0F1B3D]">{answer.prompt}</p>
              {selectedSession.mode!=='flashcards'&&<p className="mt-2 break-words text-[11px] leading-5 text-[#42506A]"><span className="font-semibold">{tr("Tu respuesta:","Your answer:")}</span> {answer.selectedAnswer||tr('Sin responder','Not answered')}</p>}
              {(selectedSession.mode !== 'casos' || !answer.correct) && <p className="mt-1 break-words text-[11px] leading-5 text-[#42506A]"><span className="font-semibold">{tr("Respuesta esperada:","Expected answer:")}</span> {answer.correctAnswer}</p>}
            </article>
          )) : (
            <p className="rounded-xl bg-[#F5F7FB] p-3 text-[12px] leading-5 text-[#42506A]">
              {tr("Esta práctica se guardó con su puntuación, pero sin el detalle individual de las respuestas.","This practice was saved with a score but without individual answer details.")}
            </p>
          )}
        </div>
      </aside>
    );
  }

  // Diferenciar una consulta fallida de un usuario que todavía no practicó.
  if (historyLoadError) {
    return (
      <aside aria-labelledby="practice-history-title"
        className={`${scrollbarStyles.scrollArea} min-w-0 rounded-[18px] border border-[#E7EBF4] bg-white px-5 py-5 shadow-[0_5px_22px_rgba(15,27,61,0.035)] lg:h-full lg:min-h-0 lg:overflow-hidden`}>
        <h2 id="practice-history-title" className="text-[18px] font-semibold text-[#0F1B3D]">
          {tr("Prácticas realizadas","Completed practice")}
        </h2>
        <div role="alert" className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-5 text-center">
          <p className="text-[13px] font-medium text-amber-900">{tr("No pudimos cargar tus prácticas.","We could not load your practice history.")}</p>
          <p className="mt-1 text-[12px] leading-5 text-amber-800">
            {tr("Podés seguir practicando. Reintentá para consultar tus resultados anteriores.","You can keep practicing. Retry to review earlier results.")}
          </p>
          <button type="button" onClick={() => router.refresh()}
            className="mt-3 min-h-10 rounded-lg bg-[#2563EB] px-4 text-[12px] font-semibold text-white hover:bg-[#1D4ED8]">
            {tr("Reintentar","Try again")}
          </button>
        </div>
      </aside>
    );
  }

  // Estado inicial basado en el diseño proporcionado: mismo panel, sin filtros ni
  // resultados simulados. El CTA usa el flujo real de Flashcards de Practicar.
  if (sessions.length === 0) {
    return (
      <aside aria-labelledby="practice-history-title"
        className={`${scrollbarStyles.scrollArea} flex min-w-0 flex-col overflow-hidden rounded-[18px] border border-[#E7EBF4] bg-white shadow-[0_5px_22px_rgba(15,27,61,0.035)] lg:h-full lg:min-h-0 lg:overflow-hidden`}>
        <div className="shrink-0 px-4 pb-4 pt-4 sm:px-5 sm:pt-5">
          <h2 id="practice-history-title" className="text-[18px] font-semibold tracking-[-0.035em] text-[#0F1B3D] sm:text-[19px]">
            {tr("Prácticas realizadas","Completed practice")}
          </h2>
          <div className="mt-4 grid grid-cols-3 divide-x divide-[#E7EBF4] pb-2">
            <div className="min-w-0 pr-2">
              <p className="text-[10px] text-slate-500">{tr("Prácticas","Practice sessions")}</p>
              <p className="mt-1 text-[20px] font-semibold leading-none tabular-nums text-[#8590A2]">0</p>
            </div>
            <div className="min-w-0 px-3">
              <p className="text-[10px] text-slate-500">{tr("Promedio","Average")}</p>
              <p className="mt-1 text-[20px] font-semibold leading-none tabular-nums text-[#8590A2]">—</p>
            </div>
            <div className="min-w-0 pl-3">
              <p className="text-[10px] text-slate-500">{tr("Para repasar","To review")}</p>
              <p className="mt-1 text-[20px] font-semibold leading-none tabular-nums text-[#8590A2]">0</p>
            </div>
          </div>
        </div>

        <div className="flex min-h-[270px] flex-1 flex-col items-center justify-center border-t border-[#EEF1F5] px-5 py-6 text-center sm:px-7 sm:py-7">
          <Image src="/evi/evi-animo.svg" alt={tr("Evi dando ánimo para empezar a practicar","Evi encouraging you to start practicing")}
            width={136} height={136} className="h-[116px] w-[116px] shrink-0 object-contain sm:h-[136px] sm:w-[136px]"/>
          <h3 className="mt-2 text-[16px] font-semibold tracking-[-0.03em] text-[#0F1B3D] sm:text-[17px]">
            {tr("Todavía no practicaste","You have not practiced yet")}
          </h3>
          <p className="mt-2 max-w-[290px] text-[12px] leading-[1.55] text-[#526079]">
            {tr("Hacé tu primera práctica y acá vas a ver cómo te fue y qué te conviene repasar.","Complete your first practice to see your results and what to review.")}
          </p>
          {onStartFlashcards && (
            <button type="button" onClick={onStartFlashcards}
              className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-[#2563EB] px-4 py-2 text-[12px] font-semibold text-white shadow-[0_5px_15px_rgba(37,99,235,0.16)] transition-colors hover:bg-[#1D4ED8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]">
              {tr("Empezar con Flashcards","Start with flashcards")} <ArrowRight className="size-3.5" aria-hidden="true"/>
            </button>
          )}
        </div>

        <div className="shrink-0 border-t border-[#EEF1F5] px-4 py-4 sm:px-5">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#344054]">
            {tr("Qué vas a ver acá","What you will see here")}
          </h3>
          <div className="mt-3 space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-[#E8F0FD] text-[#2563EB]">
                <ChartNoAxesColumnIncreasing className="size-[16px]" strokeWidth={1.8} aria-hidden="true"/>
              </span>
              <p className="text-[11px] leading-4 text-[#344054]">{tr("Tu porcentaje de aciertos en cada práctica","Your score for each practice")}</p>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-[#E4F8EE] text-[#12A05F]">
                <History className="size-[16px]" strokeWidth={1.8} aria-hidden="true"/>
              </span>
              <p className="text-[11px] leading-4 text-[#344054]">{tr("Tus resultados, ordenados por fecha","Your results, sorted by date")}</p>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-[#F0E9FD] text-[#7A3FE0]">
                <RotateCcw className="size-[16px]" strokeWidth={1.8} aria-hidden="true"/>
              </span>
              <p className="text-[11px] leading-4 text-[#344054]">{tr("Tus errores, para repasarlos con un clic","Your mistakes, ready for review")}</p>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside aria-labelledby="practice-history-title"
      className="flex min-w-0 flex-col overflow-hidden rounded-[18px] border border-[#E7EBF4] bg-white shadow-[0_5px_22px_rgba(15,27,61,0.035)] lg:h-full lg:min-h-0">
      <div className="shrink-0 px-4 pt-4 sm:px-5 sm:pt-5">
        <h2 id="practice-history-title" className="text-[18px] font-semibold tracking-[-0.035em] text-[#0F1B3D] sm:text-[19px]">
          {tr("Prácticas realizadas","Completed practice")}
        </h2>
        <div className="mt-4 grid grid-cols-3 divide-x divide-[#E7EBF4] pb-2">
          <div className="min-w-0 pr-2">
            <p className="text-[10px] text-slate-500">{tr("Prácticas","Practice sessions")}</p>
            <p className="mt-1 text-[20px] font-semibold leading-none tabular-nums text-[#0F1B3D]">{sessions.length}</p>
          </div>
          <div className="min-w-0 px-3">
            <p className="text-[10px] text-slate-500">{tr("Promedio","Average")}</p>
            <p className="mt-1 text-[20px] font-semibold leading-none tabular-nums text-[#0F1B3D]">{sessions.length ? `${averageScore}%` : '—'}</p>
          </div>
          <div className="min-w-0 pl-3">
            <p className="text-[10px] text-slate-500">{tr("Para revisar","To review")}</p>
            <p className="mt-1 text-[20px] font-semibold leading-none tabular-nums text-[#0F1B3D]">{totalToReview}</p>
          </div>
        </div>
      </div>
      <div tabIndex={0} role="region" aria-label={tr("Historial de prácticas, desplazate para ver todas","Practice history; scroll to see all")} className={`${scrollbarStyles.scrollArea} min-h-0 flex-1 overflow-y-auto overscroll-contain border-t border-[#EFF2F7] px-4 pb-4 sm:px-5`}>
            {groups.map(group => (
              <div key={group.key}>
                <div className="divide-y divide-[#F0F2F7]">
                  {group.items.map(item => {
                    const Icon = modeIcons[item.mode as keyof typeof modeIcons] ?? History;
                    const incorrect = item.total - item.correct;
                    const percent = percentOf(item);
                    return (
                      <article key={item.id} className="py-2.5">
                        <button type="button" aria-label={`${english ? 'View details for' : 'Ver el detalle de'} ${labels[item.mode] ?? item.mode}, ${percentOf(item)}%`}
                          onClick={() => onSelectSession(item)}
                          className="flex w-full items-center gap-2.5 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-[#4F5DFF]">
                          <span className={`flex size-9 shrink-0 items-center justify-center rounded-[11px] ${modePalette[item.mode] ?? 'bg-slate-100 text-slate-600'}`}>
                            <Icon className="size-[17px]" strokeWidth={1.8} aria-hidden="true"/>
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[12px] font-semibold text-[#0F1B3D]">
                              {labels[item.mode] ?? item.mode}
                            </span>
                            <span className="mt-0.5 block text-[10px] text-slate-500">
                              {timeLabel(item.completedAt,english)} · {item.total} {item.mode === 'flashcards' ? tr('tarjetas','cards') : tr('preguntas','questions')}
                            </span>
                          </span>
                          <span className="shrink-0 text-right">
                            <span className="block text-[13px] font-semibold tabular-nums text-[#0F1B3D]">{percent}%</span>
                            <span className="block text-[10px] text-slate-500">{item.correct} {tr('de','of')} {item.total}</span>
                          </span>
                          <ChevronRight className="size-3.5 text-slate-400" aria-hidden="true"/>
                        </button>
                        <div className="mt-2 flex items-center gap-3 pl-[46px]">
                          <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[#EDF1F6]">
                            <div className={`h-full rounded-full ${percent >= 80 ? 'bg-emerald-500' : 'bg-[#E0AB45]'}`}
                              style={{ width: `${percent}%` }}/>
                          </div>
                          <button type="button" onClick={() => onSelectSession(item)}
                            className="shrink-0 text-[10px] font-semibold text-[#2563EB] hover:underline">
                            {item.answers?.length && incorrect ? (english ? `Review ${incorrect}` : `Revisar ${incorrect}`) : tr('Ver detalle','View details')}
                          </button>
                        </div>

                      </article>
                    );
                  })}
                </div>
              </div>
            ))}
      </div>
      {sessions.length >= 500 && (
        <div className="shrink-0 border-t border-[#EFF2F7] px-4 py-2 text-[10px] text-slate-500">
          {tr("Se muestran hasta 500 registros recientes.","Showing up to 500 recent records.")}
        </div>
      )}
    </aside>
  );
}
