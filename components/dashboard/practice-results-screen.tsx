'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, ChevronDown, FileText, Lightbulb, RotateCcw, X } from 'lucide-react';

export type PracticeResultEntry = {
  index: number;
  prompt: string;
  selectedAnswer: string;
  correctAnswer: string;
  explanation: string;
  correct: boolean;
  chapterTitle?: string | null;
  modeLabel?: string;
  pageStart?: number | null;
};

type ResultAction = {
  label: string;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
};

type PracticeResultsScreenProps = {
  materialTitle: string;
  modeLabel: string;
  entries: PracticeResultEntry[];
  materialId?: string;
  kind?: 'questions' | 'flashcards';
  preview?: boolean;
  onClose?: () => void;
  closeHref?: string;
  primaryAction?: ResultAction;
  secondaryAction?: ResultAction;
  extraAction?: ResultAction;
  note?: string;
};

function ResultButton({ action, primary = false }: { action?: ResultAction; primary?: boolean }) {
  if (!action) return null;
  const className = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2 text-[13px] font-semibold transition-colors ' +
    (primary ? 'bg-[#2563EB] text-white hover:bg-[#1D4ED8] ' : 'border border-[#E7EBF4] bg-white text-[#42506A] hover:bg-[#F5F7FB] ') +
    (action.disabled ? 'cursor-not-allowed opacity-50' : '');
  if (action.href && !action.disabled) return (
    <Link href={action.href} className={className}>{action.label}{primary ? <ArrowRight className="size-4" aria-hidden="true" /> : null}</Link>
  );
  return (
    <button type="button" onClick={action.onClick} disabled={action.disabled || !action.onClick} className={className}>
      {action.label}{primary ? <ArrowRight className="size-4" aria-hidden="true" /> : null}
    </button>
  );
}

export function PracticeResultsScreen({
  materialTitle,
  modeLabel,
  entries,
  materialId,
  kind = 'questions',
  preview = false,
  onClose,
  closeHref,
  primaryAction,
  secondaryAction,
  extraAction,
  note,
}: PracticeResultsScreenProps) {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const mistakes = useMemo(() => entries.filter((entry) => !entry.correct), [entries]);
  const topics = useMemo(() => Array.from(new Set(
    mistakes.map((entry) => entry.chapterTitle?.trim()).filter((topic): topic is string => Boolean(topic))
  )), [mistakes]);
  const visible = selectedTopic ? mistakes.filter((entry) => entry.chapterTitle === selectedTopic) : mistakes;
  const correctCount = entries.length - mistakes.length;
  const flashcards = kind === 'flashcards';
  const summaryHref = materialId && !preview ? '/materiales/' + encodeURIComponent(materialId) + '?tab=resumen' : undefined;
  const secondaryText = flashcards
    ? 'Estas son las tarjetas que marcaste como “No lo sabía”. Repasá el concepto y volvé a intentarlo cuando quieras.'
    : 'Estas son las preguntas que fallaste. Mirá la explicación y volvé al material cuando lo necesites.';
  const perfectTitle = flashcards ? '¡Recordaste todas las tarjetas!' : '¡Completaste la práctica sin errores!';
  const hasClose = Boolean(onClose || closeHref);

  return (
    <div data-practice-results-screen className="w-full min-w-0 bg-white font-sans text-[#0F1B3D]">
      <header className="flex min-h-[56px] items-center justify-between gap-3 border-b border-[#E7EBF4] px-4 py-2 sm:px-6 lg:px-8">
        <span className="min-w-0 truncate text-[13px] font-semibold text-[#42506A]" title={materialTitle}>
          Resultados · {materialTitle}
        </span>
        {hasClose ? (closeHref && !preview ? (
          <Link href={closeHref} aria-label="Cerrar resultados" className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[#E7EBF4] text-[#42506A] hover:bg-[#F5F7FB]">
            <X className="size-4" aria-hidden="true" />
          </Link>
        ) : (
          <button type="button" onClick={onClose} disabled={preview || !onClose} aria-label="Cerrar resultados" className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[#E7EBF4] text-[#42506A] hover:bg-[#F5F7FB] disabled:opacity-50">
            <X className="size-4" aria-hidden="true" />
          </button>
        )) : <span aria-hidden="true" className="size-9" />}
      </header>

      <main className="mx-auto w-full max-w-[860px] px-4 pb-10 pt-6 sm:px-6 sm:pt-8">
        <section className="flex min-w-0 flex-col gap-5" aria-label={'Resultado de ' + modeLabel}>
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-[#7F8AA3]">
              {modeLabel} · {flashcards ? correctCount + ' recordadas' : correctCount + ' de ' + entries.length + ' correctas'}
              {preview ? ' · Vista previa' : ''}
            </p>
            <h1 className="text-[24px] font-bold leading-[1.2] tracking-[-0.03em] text-[#0F1B3D] sm:text-[27px]">
              {mistakes.length ? 'Repasá lo que te costó' : perfectTitle}
            </h1>
            <p className="max-w-[720px] text-[13px] leading-[1.65] text-[#42506A] sm:text-[14px]">
              {mistakes.length ? secondaryText
                : flashcards ? 'Todas las tarjetas quedaron marcadas como recordadas. Podés cerrar el repaso o continuar con otra actividad.'
                  : 'Respondiste correctamente todas las preguntas. Podés volver a practicar para consolidar lo aprendido.'}
            </p>
            {mistakes.length > 0 && (
              <p className="text-[12px] font-medium text-[#7F8AA3]">
                {mistakes.length} {flashcards ? 'tarjeta' : 'respuesta'}{mistakes.length === 1 ? '' : 's'} para repasar
              </p>
            )}
          </div>

          {topics.length > 1 && (
            <div className="flex flex-wrap gap-2" aria-label="Filtrar por tema">
              <button type="button" aria-pressed={selectedTopic === null} onClick={() => setSelectedTopic(null)}
                className={'min-h-8 rounded-full border px-3 py-1 text-[12px] font-semibold ' +
                  (selectedTopic === null ? 'border-[#2563EB] bg-[#EEF2FF] text-[#032269]' : 'border-[#E7EBF4] text-[#42506A] hover:bg-[#F5F7FB]')}>
                Todos ({mistakes.length})
              </button>
              {topics.map((topic) => (
                <button type="button" key={topic} aria-pressed={selectedTopic === topic} onClick={() => setSelectedTopic(topic)}
                  className={'min-h-8 max-w-full truncate rounded-full border px-3 py-1 text-[12px] font-semibold ' +
                    (selectedTopic === topic ? 'border-[#2563EB] bg-[#EEF2FF] text-[#032269]' : 'border-[#E7EBF4] text-[#42506A] hover:bg-[#F5F7FB]')}>
                  {topic}
                </button>
              ))}
            </div>
          )}

          {mistakes.length === 0 ? (
            <div className="flex items-start gap-3 rounded-[20px] border border-[#D1FADF] bg-[#F6FEF9] px-4 py-5 sm:p-6">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#067647] text-white"><Check className="size-5" aria-hidden="true" /></span>
              <div>
                <p className="text-[14px] font-semibold text-[#054F31]">{flashcards ? 'Tarjetas recordadas' : 'Práctica completada'}</p>
                <p className="mt-1 text-[13px] leading-5 text-[#42506A]">
                  {flashcards ? 'No quedaron tarjetas pendientes en esta sesión.' : 'No quedaron respuestas incorrectas en esta sesión.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {visible.map((entry, position) => {
                const materialHref = summaryHref && entry.pageStart
                  ? summaryHref + '&page=' + encodeURIComponent(String(entry.pageStart))
                  : summaryHref;
                return (
                  <details key={entry.index} open={position === 0 && selectedTopic === null}
                    className="group overflow-hidden rounded-[20px] border border-[#E7EBF4] bg-white shadow-[0_6px_22px_rgba(15,27,61,0.04)]">
                    <summary className="flex cursor-pointer items-center gap-3 px-4 py-4 marker:content-none sm:px-5">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#D92D20] text-white">
                        <X className="size-3.5" strokeWidth={3} aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#42506A]">
                            {flashcards ? 'TARJETA ' : 'PREGUNTA '}{entry.index + 1}
                          </span>
                          <span className="rounded-full bg-[#F2F4F7] px-2.5 py-0.5 text-[11px] font-semibold text-[#42506A]">
                            {entry.modeLabel || modeLabel}
                          </span>
                          {entry.chapterTitle && (
                            <span className="max-w-full truncate rounded-full bg-[#EAF0FB] px-2.5 py-0.5 text-[11px] font-semibold text-[#084BB0]">
                              {entry.chapterTitle}
                            </span>
                          )}
                        </div>
                        <span className="block text-[14px] font-semibold leading-[1.45] tracking-[-0.015em] text-[#0F1B3D] sm:text-[15px]">
                          {entry.prompt}
                        </span>
                      </div>
                      <ChevronDown className="size-4 shrink-0 text-[#7F8AA3] transition-transform group-open:rotate-180" aria-hidden="true" />
                    </summary>

                    <div className="flex flex-col gap-2.5 px-4 pb-4 sm:px-5 sm:pb-5">
                      <div className="flex items-start gap-2.5 rounded-xl border border-[#FDA29B] bg-[#FEF3F2] px-3 py-3">
                        <X className="mt-0.5 size-4 shrink-0 text-[#B42318]" strokeWidth={2.4} aria-hidden="true" />
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold tracking-[0.08em] text-[#B42318]">{flashcards ? 'NO LO SABÍA' : 'TU RESPUESTA'}</p>
                          <p className="mt-0.5 break-words text-[13px] leading-5 text-[#7A271A]">{entry.selectedAnswer || 'Sin responder'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5 rounded-xl border border-[#ABEFC6] bg-[#ECFDF3] px-3 py-3">
                        <Check className="mt-0.5 size-4 shrink-0 text-[#067647]" strokeWidth={2.6} aria-hidden="true" />
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold tracking-[0.08em] text-[#067647]">{flashcards ? 'CONCEPTO A RECORDAR' : 'RESPUESTA CORRECTA'}</p>
                          <p className="mt-0.5 break-words text-[13px] leading-5 text-[#054F31]">{entry.correctAnswer}</p>
                        </div>
                      </div>
                      {entry.explanation?.trim() && (
                        <div className="rounded-xl border border-[#DBE6F8] bg-[#F7FAFF] px-3.5 py-3">
                          <p className="flex items-center gap-2 text-[13px] font-semibold text-[#0F1B3D]">
                            <Lightbulb className="size-4 text-[#2563EB]" aria-hidden="true" /> Por qué
                          </p>
                          <p className="mt-1.5 whitespace-pre-line break-words text-[13px] leading-[1.6] text-[#42506A]">{entry.explanation}</p>
                        </div>
                      )}
                      {materialHref && (
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                          <Link href={materialHref} className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#2563EB] hover:text-[#084BB0]">
                            <span aria-hidden="true" className="flex h-6 w-5 items-center justify-center rounded bg-[#D92D3A] text-[7px] font-bold text-white">PDF</span>
                            {entry.pageStart ? 'Ver en tu material · pág. ' + entry.pageStart : 'Ver en tu material'}
                          </Link>
                          <Link href={summaryHref!} className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#2563EB] hover:text-[#084BB0]">
                            Repasar el resumen del tema <ArrowRight className="size-3.5" aria-hidden="true" />
                          </Link>
                        </div>
                      )}
                    </div>
                  </details>
                );
              })}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 border-t border-[#E7EBF4] pt-4">
            <ResultButton action={primaryAction} primary />
            <ResultButton action={secondaryAction} />
            <ResultButton action={extraAction} />
          </div>
          {note && <p className="text-[12px] leading-5 text-[#7F8AA3]">{note}</p>}
          {preview && <p className="text-[11px] leading-5 text-[#7F8AA3]">Vista previa: resultados ficticios. No se guardan datos ni se consumen cupos.</p>}
        </section>
      </main>
    </div>
  );
}
