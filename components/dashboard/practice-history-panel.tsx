'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, BookOpen, ChartNoAxesColumnIncreasing, Check, CheckCircle2, ChevronRight, CircleAlert, History, Layers3, ListChecks, Network, RotateCcw, Timer, Zap } from 'lucide-react';
import type { PracticeHistoryEntry } from '@/lib/student-materials/practice-history';
import scrollbarStyles from './practice-history-scrollbar.module.css';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const modeLabels: Record<string, string> = {
  unir: 'Unir conceptos', completar: 'Completar', casos: 'Casos',
  mixto: 'Mixto', simulacro: 'Simulacro de examen', opciones: 'Opciones', flashcards: 'Flashcards',
};
const modeIcons = { unir: Network, completar: ListChecks, casos: BookOpen,
  mixto: Zap, simulacro: Timer, opciones: Check, flashcards: Layers3 };
const modePalette: Record<string, string> = {
  unir: 'bg-[#E0F2F0] text-[#27817A]', completar: 'bg-[#FAE9DE] text-[#AE663F]',
  casos: 'bg-[#EBE4FA] text-[#6C52A8]', mixto: 'bg-[#FCF2DF] text-[#9A712C]',
  simulacro: 'bg-[#E9EAED] text-[#626B7A]', opciones: 'bg-[#E3F2E5] text-[#398052]',
  flashcards: 'bg-[#E2F2F7] text-[#41839B]',
};
const TIME_ZONE = 'America/Argentina/Buenos_Aires';

function dayKey(value: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(value);
}
function dateLabel(value: string, now: Date) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Fecha no disponible';
  const today = dayKey(now);
  const yesterday = dayKey(new Date(now.getTime() - 86_400_000));
  const day = dayKey(date);
  if (day === today) return 'Hoy';
  if (day === yesterday) return 'Ayer';
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: TIME_ZONE, day: 'numeric', month: 'short', year: 'numeric',
  }).format(date);
}
function timeLabel(value: string) {
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit',
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
  const [showAll, setShowAll] = useState(false);
  const now = useMemo(() => new Date(), []);
  const sessions = useMemo(() => history.filter(item => item.materialId === materialId), [history, materialId]);
  const visible = sessions.slice(0, 2); // Keep the desktop history column stationary.
  const totalToReview = sessions.reduce((sum, item) => sum + item.total - item.correct, 0);
  const averageScore = average(sessions);
  const groups: { key: string; items: PracticeHistoryEntry[] }[] = [];
  for (const entry of visible) {
    const key = dateLabel(entry.completedAt, now);
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
        <div className="shrink-0 border-b border-[#EFF2F7] px-4 pb-4 pt-4 sm:px-5 sm:pt-5">
          <button type="button" onClick={onBackToHistory}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg text-[11px] font-semibold text-[#2563EB] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]">
            <ArrowLeft className="size-3.5" aria-hidden="true"/> Volver a prácticas realizadas
          </button>
          <h2 id="practice-history-detail-title" className="mt-2 text-[18px] font-semibold tracking-[-0.035em] text-[#0F1B3D] sm:text-[19px]">
            {modeLabels[selectedSession.mode] ?? selectedSession.mode}
          </h2>
          <p className="mt-1 text-[11px] text-[#66758D]">{dateLabel(selectedSession.completedAt,now)} · {timeLabel(selectedSession.completedAt)}</p>
          <div className="mt-4 grid grid-cols-3 divide-x divide-[#E7EBF4]">
            <div className="pr-2"><p className="text-[10px] text-[#66758D]">Resultado</p><p className="mt-1 text-[20px] font-semibold text-[#0F1B3D]">{percent}%</p></div>
            <div className="px-3"><p className="text-[10px] text-[#66758D]">Correctas</p><p className="mt-1 text-[20px] font-semibold text-[#0F1B3D]">{selectedSession.correct} de {selectedSession.total}</p></div>
            <div className="pl-3"><p className="text-[10px] text-[#66758D]">Para revisar</p><p className="mt-1 text-[20px] font-semibold text-[#0F1B3D]">{incorrect}</p></div>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#EDF1F6]">
            <div className={`h-full rounded-full ${percent >= 80 ? 'bg-emerald-500' : 'bg-[#E0AB45]'}`} style={{width:`${percent}%`}}/>
          </div>
        </div>
        <div data-practice-history-answers tabIndex={0} role="region" aria-label="Respuestas de la práctica" className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4 [scrollbar-color:#B8C6DC_transparent] [scrollbar-width:thin] sm:px-5">
          {selectedSession.answers?.length ? selectedSession.answers.map((answer,index)=>(
            <article key={index} className="rounded-xl border border-[#E7EBF4] bg-white p-3">
              <div className="flex items-center gap-2">
                {answer.correct ? <CheckCircle2 className="size-4 shrink-0 text-[#358458]"/> : <CircleAlert className="size-4 shrink-0 text-[#B86A36]"/>}
                <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#66758D]">Pregunta {index+1} · {answer.correct?'Correcta':'Para repasar'}</span>
              </div>
              <p className="mt-2 break-words text-[12px] font-semibold leading-5 text-[#0F1B3D]">{answer.prompt}</p>
              {selectedSession.mode!=='flashcards'&&<p className="mt-2 break-words text-[11px] leading-5 text-[#42506A]"><span className="font-semibold">Tu respuesta:</span> {answer.selectedAnswer||'Sin responder'}</p>}
              <p className="mt-1 break-words text-[11px] leading-5 text-[#42506A]"><span className="font-semibold">Respuesta esperada:</span> {answer.correctAnswer}</p>
            </article>
          )) : (
            <p className="rounded-xl bg-[#F5F7FB] p-3 text-[12px] leading-5 text-[#42506A]">
              Esta práctica se guardó con su puntuación, pero sin el detalle individual de las respuestas.
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
          Prácticas realizadas
        </h2>
        <div role="alert" className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-5 text-center">
          <p className="text-[13px] font-medium text-amber-900">No pudimos cargar tus prácticas.</p>
          <p className="mt-1 text-[12px] leading-5 text-amber-800">
            Podés seguir practicando. Reintentá para consultar tus resultados anteriores.
          </p>
          <button type="button" onClick={() => router.refresh()}
            className="mt-3 min-h-10 rounded-lg bg-[#2563EB] px-4 text-[12px] font-semibold text-white hover:bg-[#1D4ED8]">
            Reintentar
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
            Prácticas realizadas
          </h2>
          <div className="mt-4 grid grid-cols-3 divide-x divide-[#E7EBF4] pb-2">
            <div className="min-w-0 pr-2">
              <p className="text-[10px] text-slate-500">Prácticas</p>
              <p className="mt-1 text-[20px] font-semibold leading-none tabular-nums text-[#8590A2]">0</p>
            </div>
            <div className="min-w-0 px-3">
              <p className="text-[10px] text-slate-500">Promedio</p>
              <p className="mt-1 text-[20px] font-semibold leading-none tabular-nums text-[#8590A2]">—</p>
            </div>
            <div className="min-w-0 pl-3">
              <p className="text-[10px] text-slate-500">Para repasar</p>
              <p className="mt-1 text-[20px] font-semibold leading-none tabular-nums text-[#8590A2]">0</p>
            </div>
          </div>
        </div>

        <div className="flex min-h-[270px] flex-1 flex-col items-center justify-center border-t border-[#EEF1F5] px-5 py-6 text-center sm:px-7 sm:py-7">
          <Image src="/evi/evi-animo.svg" alt="Evi dando ánimo para empezar a practicar"
            width={136} height={136} className="h-[116px] w-[116px] shrink-0 object-contain sm:h-[136px] sm:w-[136px]"/>
          <h3 className="mt-2 text-[16px] font-semibold tracking-[-0.03em] text-[#0F1B3D] sm:text-[17px]">
            Todavía no practicaste
          </h3>
          <p className="mt-2 max-w-[290px] text-[12px] leading-[1.55] text-[#526079]">
            Hacé tu primera práctica y acá vas a ver cómo te fue y qué te conviene repasar.
          </p>
          {onStartFlashcards && (
            <button type="button" onClick={onStartFlashcards}
              className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-[#2563EB] px-4 py-2 text-[12px] font-semibold text-white shadow-[0_5px_15px_rgba(37,99,235,0.16)] transition-colors hover:bg-[#1D4ED8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]">
              Empezar con Flashcards <ArrowRight className="size-3.5" aria-hidden="true"/>
            </button>
          )}
        </div>

        <div className="shrink-0 border-t border-[#EEF1F5] px-4 py-4 sm:px-5">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#344054]">
            Qué vas a ver acá
          </h3>
          <div className="mt-3 space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-[#E8F0FD] text-[#2563EB]">
                <ChartNoAxesColumnIncreasing className="size-[16px]" strokeWidth={1.8} aria-hidden="true"/>
              </span>
              <p className="text-[11px] leading-4 text-[#344054]">Tu porcentaje de aciertos en cada práctica</p>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-[#E4F8EE] text-[#12A05F]">
                <History className="size-[16px]" strokeWidth={1.8} aria-hidden="true"/>
              </span>
              <p className="text-[11px] leading-4 text-[#344054]">Tus resultados, ordenados por fecha</p>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-[#F0E9FD] text-[#7A3FE0]">
                <RotateCcw className="size-[16px]" strokeWidth={1.8} aria-hidden="true"/>
              </span>
              <p className="text-[11px] leading-4 text-[#344054]">Tus errores, para repasarlos con un clic</p>
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
          Prácticas realizadas
        </h2>
        <div className="mt-4 grid grid-cols-3 divide-x divide-[#E7EBF4] pb-2">
          <div className="min-w-0 pr-2">
            <p className="text-[10px] text-slate-500">Prácticas</p>
            <p className="mt-1 text-[20px] font-semibold leading-none tabular-nums text-[#0F1B3D]">{sessions.length}</p>
          </div>
          <div className="min-w-0 px-3">
            <p className="text-[10px] text-slate-500">Promedio</p>
            <p className="mt-1 text-[20px] font-semibold leading-none tabular-nums text-[#0F1B3D]">{sessions.length ? `${averageScore}%` : '—'}</p>
          </div>
          <div className="min-w-0 pl-3">
            <p className="text-[10px] text-slate-500">Para revisar</p>
            <p className="mt-1 text-[20px] font-semibold leading-none tabular-nums text-[#0F1B3D]">{totalToReview}</p>
          </div>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto border-t border-[#EFF2F7] px-4 pb-4 sm:px-5 lg:overflow-hidden">
            {groups.map(group => (
              <div key={group.key}>
                <h3 className="sticky top-0 z-10 bg-white py-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                  {group.key}
                </h3>
                <div className="divide-y divide-[#F0F2F7]">
                  {group.items.map(item => {
                    const Icon = modeIcons[item.mode as keyof typeof modeIcons] ?? History;
                    const incorrect = item.total - item.correct;
                    const percent = percentOf(item);
                    return (
                      <article key={item.id} className="py-2.5">
                        <button type="button" aria-label={`Ver el detalle de ${modeLabels[item.mode] ?? item.mode}, ${percentOf(item)}%`}
                          onClick={() => onSelectSession(item)}
                          className="flex w-full items-center gap-2.5 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-[#4F5DFF]">
                          <span className={`flex size-9 shrink-0 items-center justify-center rounded-[11px] ${modePalette[item.mode] ?? 'bg-slate-100 text-slate-600'}`}>
                            <Icon className="size-[17px]" strokeWidth={1.8} aria-hidden="true"/>
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[12px] font-semibold text-[#0F1B3D]">
                              {modeLabels[item.mode] ?? item.mode}
                            </span>
                            <span className="mt-0.5 block text-[10px] text-slate-500">
                              {timeLabel(item.completedAt)} · {item.total} {item.mode === 'flashcards' ? 'tarjetas' : 'preguntas'}
                            </span>
                          </span>
                          <span className="shrink-0 text-right">
                            <span className="block text-[13px] font-semibold tabular-nums text-[#0F1B3D]">{percent}%</span>
                            <span className="block text-[10px] text-slate-500">{item.correct} de {item.total}</span>
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
                            {item.answers?.length && incorrect ? `Revisar ${incorrect}` : 'Ver detalle'}
                          </button>
                        </div>

                      </article>
                    );
                  })}
                </div>
              </div>
            ))}
      </div>
      {sessions.length > visible.length && (
        <div className="shrink-0 border-t border-[#EFF2F7] px-4 py-2 sm:px-5">
          <button type="button" onClick={() => setShowAll(true)}
            className="inline-flex min-h-8 items-center gap-1 text-[11px] font-semibold text-[#2563EB] hover:underline">
            Ver todas las prácticas ({sessions.length}) <ChevronRight className="size-3" aria-hidden="true"/>
          </button>
        </div>
      )}
      <Dialog open={showAll} onOpenChange={setShowAll}>
        <DialogContent className="max-h-[85dvh] w-full overflow-y-auto sm:max-w-[620px]">
          <DialogHeader>
            <DialogTitle>Historial de prácticas</DialogTitle>
            <DialogDescription>Todos tus resultados de este material, del más reciente al más antiguo.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {sessions.map(item=>{
              const Icon=modeIcons[item.mode as keyof typeof modeIcons] ?? History;
              const percent=percentOf(item);
              return <button type="button" key={item.id}
                onClick={()=>{setShowAll(false);onSelectSession(item)}}
                className="flex w-full items-center gap-3 rounded-xl border border-[#E7EBF4] p-3 text-left transition-colors hover:bg-[#F8FAFD] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]">
                <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${modePalette[item.mode]??'bg-slate-100 text-slate-600'}`}>
                  <Icon className="size-4" aria-hidden="true"/>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[12px] font-semibold text-[#0F1B3D]">{modeLabels[item.mode]??item.mode}</span>
                  <span className="block text-[10px] text-slate-500">{dateLabel(item.completedAt,now)} · {timeLabel(item.completedAt)}</span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-[13px] font-semibold tabular-nums">{percent}%</span>
                  <span className="block text-[10px] text-slate-500">{item.correct} de {item.total}</span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-slate-400" aria-hidden="true"/>
              </button>;
            })}
          </div>
        </DialogContent>
      </Dialog>
      {sessions.length >= 500 && (
        <div className="shrink-0 border-t border-[#EFF2F7] px-4 py-2 text-[10px] text-slate-500">
          Se muestran hasta 500 registros recientes.
        </div>
      )}
    </aside>
  );
}
