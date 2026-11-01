'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, Check, ChevronDown, ChevronRight, Clock3, History, Layers3, ListChecks, Network, RotateCcw, Timer, Zap } from 'lucide-react';
import type { PracticeHistoryEntry } from '@/lib/student-materials/practice-history';

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

export function PracticeHistoryPanel({ history, materialId, materialTitle }: {
  history: PracticeHistoryEntry[]; materialId: string; materialTitle?: string;
}) {
  const [mode, setMode] = useState('all');
  const [errorsOnly, setErrorsOnly] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const now = useMemo(() => new Date(), []);
  const sessions = useMemo(() => history.filter(item => item.materialId === materialId), [history, materialId]);
  const modeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    sessions.forEach(item => { counts[item.mode] = (counts[item.mode] ?? 0) + 1; });
    return counts;
  }, [sessions]);
  const selected = useMemo(() => sessions.filter(item =>
    (mode === 'all' || item.mode === mode) && (!errorsOnly || item.correct < item.total)
  ), [sessions, mode, errorsOnly]);
  const visible = showAll ? selected : selected.slice(0, 12);
  const totalToReview = sessions.reduce((sum, item) => sum + item.total - item.correct, 0);
  const averageScore = average(sessions);
  const recent = [...sessions].reverse().slice(-8);
  const firstHalf = sessions.length >= 4 ? average(sessions.slice(-4)) : null;
  const lastHalf = sessions.length >= 4 ? average(sessions.slice(0, 4)) : null;
  const change = firstHalf !== null && lastHalf !== null ? lastHalf - firstHalf : null;
  const groups: { key: string; items: PracticeHistoryEntry[] }[] = [];
  for (const entry of visible) {
    const key = dateLabel(entry.completedAt, now);
    const last = groups[groups.length - 1];
    if (last?.key === key) last.items.push(entry);
    else groups.push({ key, items: [entry] });
  }
  const hasErrors = sessions.some(item => item.correct < item.total);

  return (
    <aside aria-labelledby="practice-history-title"
      className="flex min-w-0 flex-col overflow-hidden rounded-[18px] border border-[#E7EBF4] bg-white shadow-[0_5px_22px_rgba(15,27,61,0.035)] lg:sticky lg:top-5 lg:max-h-[min(710px,calc(100dvh-42px))]">
      <div className="shrink-0 px-4 pt-4 sm:px-5 sm:pt-5">
        <div className="flex items-center justify-between gap-2">
          <h2 id="practice-history-title" className="text-[18px] font-semibold tracking-[-0.035em] text-[#0F1B3D] sm:text-[19px]">
            Prácticas realizadas
          </h2>
          <History className="size-[17px] shrink-0 text-[#71809A]" aria-hidden="true"/>
        </div>
        <p className="mt-1 truncate text-[11px] text-[#66758D]" title={materialTitle}>
          {materialTitle ? `De ${materialTitle}` : 'Historial de este material'}
        </p>
        <div className="mt-4 grid grid-cols-3 divide-x divide-[#E7EBF4]">
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
        {sessions.length >= 2 && (
          <div className="mt-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] text-slate-500">Evolución</p>
              <p className={`mt-1 text-[11px] font-medium ${change !== null && change > 0 ? 'text-emerald-700' : 'text-slate-600'}`}>
                {change === null ? 'Tus resultados recientes' : change === 0 ? 'Sin cambios en las últimas 4' :
                  `${change > 0 ? '+' : ''}${change} puntos vs. las 4 anteriores`}
              </p>
            </div>
            <div className="flex h-[36px] shrink-0 items-end gap-[4px]" role="img"
              aria-label={`Aciertos de las últimas ${recent.length} prácticas, de más antigua a más reciente`}>
              {recent.map((item, index) => (
                <span key={item.id} className={`w-[8px] rounded-t-[3px] ${index === recent.length - 1 ? 'bg-[#4F5DFF]' : 'bg-[#CDD6F6]'}`}
                  style={{ height: `${Math.max(4, Math.round(percentOf(item) * 0.34))}px` }} />
              ))}
            </div>
          </div>
        )}
        {hasErrors && (
          <button type="button" onClick={() => { setMode('all'); setErrorsOnly(value => !value); setExpandedId(null); setShowAll(false); }}
            aria-pressed={errorsOnly}
            className="mt-4 flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-3 text-[12px] font-medium text-white transition-colors hover:bg-[#1D4ED8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
            <RotateCcw className="size-3.5" aria-hidden="true"/>
            {errorsOnly ? 'Mostrar todas las prácticas' : 'Ver prácticas con errores'}
          </button>
        )}
        <div className="-mx-4 mt-4 flex gap-1.5 overflow-x-auto px-4 pb-3 sm:-mx-5 sm:px-5" role="group" aria-label="Filtrar por modalidad">
          <button type="button" onClick={() => { setMode('all'); setExpandedId(null); setShowAll(false); }}
            aria-pressed={mode === 'all'}
            className={`min-h-8 shrink-0 rounded-full border px-3 text-[11px] font-medium ${mode === 'all' ? 'border-[#0F1B3D] bg-[#0F1B3D] text-white' : 'border-[#E7EBF4] bg-white text-slate-600 hover:border-slate-300'}`}>
            Todas · {sessions.length}
          </button>
          {Object.keys(modeCounts).sort((a,b) => (modeLabels[a] ?? a).localeCompare(modeLabels[b] ?? b, 'es')).map(key => (
            <button key={key} type="button" aria-pressed={mode === key}
              onClick={() => { setMode(key); setExpandedId(null); setShowAll(false); }}
              className={`min-h-8 shrink-0 rounded-full border px-3 text-[11px] font-medium ${mode === key ? 'border-[#0F1B3D] bg-[#0F1B3D] text-white' : 'border-[#E7EBF4] bg-white text-slate-600 hover:border-slate-300'}`}>
              {modeLabels[key] ?? key} · {modeCounts[key]}
            </button>
          ))}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto border-t border-[#EFF2F7] px-4 pb-4 sm:px-5 lg:overscroll-contain">
        {selected.length === 0 ? (
          <div className="flex flex-col items-center px-2 py-9 text-center">
            <History className="size-7 text-[#99A7BD]" aria-hidden="true"/>
            <p className="mt-3 text-[12px] font-medium text-[#0F1B3D]">
              {sessions.length === 0 ? 'Todavía no realizaste prácticas' : 'No hay prácticas con estos filtros'}
            </p>
            <p className="mt-1 max-w-[33ch] text-[11px] leading-5 text-slate-500">
              {sessions.length === 0 ? 'Cuando termines una actividad, sus resultados aparecerán acá.' :
                'Probá otra modalidad o mostrá todas las prácticas.'}
            </p>
          </div>
        ) : (
          <>
            {groups.map(group => (
              <div key={group.key}>
                <h3 className="sticky top-0 z-10 bg-white py-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                  {group.key}
                </h3>
                <div className="divide-y divide-[#F0F2F7]">
                  {group.items.map(item => {
                    const Icon = modeIcons[item.mode as keyof typeof modeIcons] ?? History;
                    const expanded = expandedId === item.id;
                    const incorrect = item.total - item.correct;
                    const percent = percentOf(item);
                    return (
                      <article key={item.id} className="py-2.5">
                        <button type="button" aria-expanded={expanded}
                          onClick={() => setExpandedId(expanded ? null : item.id)}
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
                          {expanded ? <ChevronDown className="size-3.5 text-slate-400" aria-hidden="true"/> :
                            <ChevronRight className="size-3.5 text-slate-400" aria-hidden="true"/>}
                        </button>
                        <div className="mt-2 flex items-center gap-3 pl-[46px]">
                          <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[#EDF1F6]">
                            <div className={`h-full rounded-full ${percent >= 80 ? 'bg-emerald-500' : 'bg-[#E0AB45]'}`}
                              style={{ width: `${percent}%` }}/>
                          </div>
                          <button type="button" onClick={() => setExpandedId(expanded ? null : item.id)}
                            className="shrink-0 text-[10px] font-semibold text-[#2563EB] hover:underline">
                            {expanded ? 'Cerrar' : incorrect ? `Revisar ${incorrect}` : 'Ver detalle'}
                          </button>
                        </div>
                        {expanded && (
                          <div className="mt-3 rounded-xl border border-[#E7EBF4] bg-[#FAFBFD] p-3">
                            <p className="text-[11px] font-semibold text-[#0F1B3D]">{item.correct} de {item.total} · Resultado orientativo</p>
                            {item.answers?.length ? (
                              <div className="mt-2 max-h-[250px] space-y-2 overflow-y-auto">
                                {item.answers.map((answer, i) => (
                                  <div key={i} className="rounded-lg border border-[#E7EBF4] bg-white px-2.5 py-2 text-[11px] leading-[1.5]">
                                    <p className="font-medium text-slate-800">{i+1}. {answer.prompt}</p>
                                    <p className={`mt-1 font-medium ${answer.correct ? 'text-emerald-700' : 'text-rose-700'}`}>
                                      {item.mode === 'flashcards' ? answer.correct ? 'Lo sabía' : 'No lo sabía' : answer.correct ? 'Correcta' : 'Para repasar'}
                                    </p>
                                    {item.mode !== 'flashcards' && <p className="mt-0.5 text-slate-600">Tu respuesta: {answer.selectedAnswer || 'Sin responder'}</p>}
                                    <p className="mt-0.5 text-slate-600">{item.mode === 'flashcards' ? 'Respuesta' : 'Respuesta esperada'}: {answer.correctAnswer}</p>
                                  </div>
                                ))}
                              </div>
                            ) : <p className="mt-2 text-[11px] leading-5 text-slate-500">
                              Esta práctica es anterior al historial detallado. Se conserva la puntuación, pero no las respuestas.
                            </p>}
                            <Link href={`/dashboard/practicar/${item.materialId}/${item.mode}`}
                              className="mt-3 inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#2563EB] px-3 text-[11px] font-medium text-white hover:bg-[#1D4ED8]">
                              Practicar otra vez <ArrowRight className="size-3.5" aria-hidden="true"/>
                            </Link>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </div>
            ))}
            {selected.length > visible.length && (
              <button type="button" onClick={() => setShowAll(true)}
                className="mt-3 flex min-h-9 items-center gap-1 text-[11px] font-medium text-[#2563EB] hover:underline">
                Ver todas ({selected.length}) <ChevronRight className="size-3" aria-hidden="true"/>
              </button>
            )}
            {showAll && selected.length > 12 && <button type="button" onClick={() => setShowAll(false)}
              className="mt-2 text-[11px] font-medium text-slate-500 hover:underline">Ver menos</button>}
          </>
        )}
      </div>
      {sessions.length >= 100 && (
        <div className="shrink-0 border-t border-[#EFF2F7] px-4 py-2 text-[10px] text-slate-500">
          Se muestran hasta 100 registros recientes.
        </div>
      )}
    </aside>
  );
}
