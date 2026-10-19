'use client';

import { memo } from 'react';
import { Flag, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuestionMapProps {
  /** Total number of questions in the exam. */
  questionLimit: number;
  /** Index of the currently visible question (0-based). */
  currentQuestionIndex: number;
  /** Map of answered question indices to their selected answer(s). */
  selectedAnswers: Record<number, number | number[]>;
  /** Indices of questions the user has flagged for review. */
  flaggedQuestions: number[];
  /** Highest accessible question index (inclusive). */
  maxIndex: number;
  /** Callback to navigate to a specific question. */
  onGoToQuestion: (index: number) => void;
  /** Desktop grid or mobile horizontal-scroll layout. */
  variant: 'desktop' | 'mobile';
}

/**
 * Renders the numbered question-map grid used in both the desktop sidebar and
 * the mobile bottom bar. Preserves the exact markup and Tailwind classes from
 * the original inline rendering in SimuladorExamen.
 */
export const QuestionMap = memo(function QuestionMap({
  questionLimit,
  currentQuestionIndex,
  selectedAnswers,
  flaggedQuestions,
  maxIndex,
  onGoToQuestion,
  variant,
}: QuestionMapProps) {
  const isDesktop = variant === 'desktop';

  return (
    <>
      {isDesktop ? (
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-600">
            Pregunta {currentQuestionIndex + 1} de {questionLimit}
          </p>
          <div className="flex items-center gap-1 text-xs font-medium text-slate-500">
            <Flag className="h-3.5 w-3.5" /> {flaggedQuestions.length}
          </div>
        </div>
      ) : (
        <div className="mb-2 flex items-center justify-between gap-3 px-0.5">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Mapa rápido
          </p>
          <p className="text-[12px] font-medium text-slate-500">
            {currentQuestionIndex + 1} de {questionLimit}
          </p>
        </div>
      )}

      <div
        className={
          isDesktop
            ? 'grid grid-cols-5 gap-1.5'
            : 'flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
        }
      >
        {Array.from({ length: questionLimit }, (_, index) => {
          const isCurrent = currentQuestionIndex === index;
          const isAnswered = selectedAnswers[index] !== undefined;
          const isFlagged = flaggedQuestions.includes(index);
          const isDisabled = index > maxIndex;
          const questionMapLabel = isCurrent
            ? `Pregunta ${index + 1} actual`
            : isAnswered
              ? `Pregunta ${index + 1} respondida`
              : `Pregunta ${index + 1}`;

          return (
            <button
              key={isDesktop ? index : `mobile-${index}`}
              onClick={() => onGoToQuestion(index)}
              disabled={isDisabled}
              aria-label={questionMapLabel}
              aria-current={isCurrent ? 'step' : undefined}
              className={cn(
                'relative h-8 rounded-lg border text-[12px] font-semibold',
                isDesktop && 'transition',
                !isDesktop && 'min-w-8 shrink-0 px-1',
                isDisabled &&
                  'cursor-not-allowed border-slate-100 bg-white text-slate-300',
                !isDisabled &&
                  'border-slate-200 bg-white text-slate-700',
                !isDisabled && isDesktop && 'hover:border-slate-300',
                isAnswered &&
                  !isDisabled &&
                  'bg-blue-50 text-blue-700',
                isCurrent &&
                  !isDisabled &&
                  isDesktop &&
                  'border-blue-500 ring-2 ring-blue-100',
                isCurrent &&
                  !isDisabled &&
                  !isDesktop &&
                  'border-blue-500 ring-1 ring-blue-200'
              )}
            >
              {index + 1}
              {isFlagged ? (
                <Star
                  className={cn(
                    'absolute -right-1 -top-1 fill-orange-400 text-orange-500',
                    isDesktop ? 'h-3 w-3' : 'h-2.5 w-2.5'
                  )}
                />
              ) : null}
            </button>
          );
        })}
      </div>
    </>
  );
});
