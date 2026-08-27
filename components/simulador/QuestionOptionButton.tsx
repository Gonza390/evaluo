'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Sparkles, X } from 'lucide-react';
import { getLiveWrongAnswerExplanationDemo } from '@/lib/actions/errores';
import { cn } from '@/lib/utils';

const OPTION_LABELS = ['a', 'b', 'c', 'd'];

interface QuestionOptionButtonProps {
  /** The option text to display. */
  opcion: string;
  /** Index of this option (used for the a/b/c/d label). */
  optionIndex: number;
  /** Whether this option is currently selected. */
  selected: boolean;
  /** Whether the question has been fully answered (locked). */
  questionAnswered: boolean;
  /** Whether this option is one of the correct answers (after grading). */
  optionIsCorrect: boolean;
  /** Whether this option was selected but is wrong (after grading). */
  selectedIsWrong: boolean;
  /** Click handler. */
  onClick: () => void;
  /** Whether the button should be disabled. */
  disabled: boolean;
}

function getSimulatorContext() {
  if (typeof window === 'undefined') return null;
  const parts = window.location.pathname.split('/').filter(Boolean);
  const simulatorIndex = parts.indexOf('simulador');
  if (simulatorIndex < 0) return null;

  const materiaId = decodeURIComponent(parts[simulatorIndex + 1] ?? '');
  const parcial = Number(parts[simulatorIndex + 2]);
  if (!materiaId || ['errores', 'premium', 'ultimo-intento'].includes(materiaId)) return null;
  if (![1, 2, 3].includes(parcial)) return null;

  return { materiaId, parcial };
}

function getBriefExplanation(text: string) {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return '';

  const sentences = normalized.match(/[^.!?]+[.!?]+/g) ?? [];
  if (sentences.length > 0) {
    const brief = sentences.slice(0, 2).join(' ').trim();
    if (brief.length <= 560) return brief;
  }

  if (normalized.length <= 560) return normalized;
  const clipped = normalized.slice(0, 557);
  const lastSpace = clipped.lastIndexOf(' ');
  return `${clipped.slice(0, lastSpace > 360 ? lastSpace : 557).trim()}…`;
}

/** Answer option styled as an exam response row, with clear selected/graded states. */
export function QuestionOptionButton({
  opcion,
  optionIndex,
  selected,
  questionAnswered,
  optionIsCorrect,
  selectedIsWrong,
  onClick,
  disabled,
}: QuestionOptionButtonProps) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [portalHost, setPortalHost] = useState<HTMLElement | null>(null);
  const [explanation, setExplanation] = useState('');
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [explanationError, setExplanationError] = useState('');
  const [suppressed, setSuppressed] = useState(false);

  useEffect(() => {
    if (!questionAnswered || !selectedIsWrong) return;

    const button = buttonRef.current;
    const optionsGroup = button?.parentElement;
    if (!button || !optionsGroup) return;

    // En preguntas de respuesta múltiple puede haber más de una opción errónea.
    // Sólo la primera monta el bloque explicativo compartido debajo de todas las opciones.
    const firstWrong = optionsGroup.querySelector<HTMLButtonElement>(
      'button[data-evaluo-selected-wrong="true"]'
    );
    if (firstWrong !== button) return;

    const questionElement = document.getElementById('pregunta-actual-enunciado');
    const enunciado = questionElement?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
    const context = getSimulatorContext();
    if (!enunciado || !context) return;

    const host = document.createElement('div');
    host.dataset.evaluoLiveExplanation = 'true';
    optionsGroup.insertAdjacentElement('afterend', host);
    setPortalHost(host);
    setSuppressed(false);
    setExplanationError('');

    const cacheKey = `evaluo_demo_explanation:${context.materiaId}:${context.parcial}:${enunciado}`;
    const cached = window.sessionStorage.getItem(cacheKey);
    if (cached) {
      setExplanation(cached);
      return () => {
        host.remove();
        setPortalHost(null);
      };
    }

    let active = true;
    setExplanation('');
    setLoadingExplanation(true);

    void getLiveWrongAnswerExplanationDemo({
      materia_id: context.materiaId,
      parcial: context.parcial,
      enunciado,
    })
      .then((response) => {
        if (!active) return;

        if ('skipped' in response && response.skipped) {
          setSuppressed(true);
          return;
        }

        if (!response.success) {
          throw new Error(response.message || 'No pudimos generar la explicación.');
        }

        const text = getBriefExplanation(response.explanations?.[0]?.explicacion ?? '');
        if (!text) {
          throw new Error('La explicación todavía no está disponible para esta pregunta.');
        }

        window.sessionStorage.setItem(cacheKey, text);
        setExplanation(text);
      })
      .catch((error) => {
        if (!active) return;
        setExplanationError(
          error instanceof Error
            ? error.message
            : 'No pudimos generar la explicación en este momento.'
        );
      })
      .finally(() => {
        if (active) setLoadingExplanation(false);
      });

    return () => {
      active = false;
      host.remove();
      setPortalHost(null);
    };
  }, [questionAnswered, selectedIsWrong]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-pressed={selected}
        data-evaluo-selected-wrong={selectedIsWrong ? 'true' : undefined}
        className={cn(
          'min-h-[60px] w-full rounded-2xl border px-4 py-4 text-left transition-[border-color,background-color,box-shadow,transform] duration-150 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none sm:px-5',
          !questionAnswered &&
            'border-border bg-card hover:-translate-y-px hover:border-primary/35 hover:shadow-[0_10px_24px_rgba(15,23,42,0.06)]',
          questionAnswered && 'cursor-default border-border bg-card',
          selected &&
            !questionAnswered &&
            'border-primary bg-primary/5 text-foreground ring-2 ring-primary/10',
          questionAnswered &&
            optionIsCorrect &&
            'border-emerald-500 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-100',
          selectedIsWrong && 'border-rose-500 bg-rose-50 text-rose-950 ring-2 ring-rose-100'
        )}
      >
        <div className="flex items-start gap-3.5">
          <span
            className={cn(
              'mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border text-xs font-bold uppercase transition-colors',
              selected
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background text-muted-foreground'
            )}
          >
            {OPTION_LABELS[optionIndex] ?? optionIndex + 1}
          </span>
          <span className="flex-1 pt-1 text-[15px] leading-6 text-foreground sm:text-base sm:leading-7">
            {opcion}
          </span>
          {questionAnswered && optionIsCorrect ? (
            <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
              <Check className="h-3 w-3" />
              Correcta
            </span>
          ) : null}
          {selectedIsWrong ? (
            <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-bold text-rose-800">
              <X className="h-3 w-3" />
              Incorrecta
            </span>
          ) : null}
        </div>
      </button>

      {portalHost && !suppressed
        ? createPortal(
            <div
              className="mt-5 rounded-2xl border border-indigo-200 bg-[linear-gradient(135deg,#EEF0FF_0%,#FFFFFF_100%)] p-4 shadow-[0_12px_28px_rgba(99,102,241,0.08)]"
              role="status"
              aria-live="polite"
            >
              <div className="flex items-start gap-3">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900">¿Por qué?</p>
                  {loadingExplanation ? (
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Analizando tu respuesta...
                    </p>
                  ) : explanation ? (
                    <p className="mt-1 text-sm leading-6 text-slate-700">{explanation}</p>
                  ) : explanationError ? (
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      La respuesta correcta es la opción marcada en verde. La explicación automática
                      no pudo cargarse ahora; podés seguir y volver a esta pregunta después.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>,
            portalHost
          )
        : null}
    </>
  );
}
