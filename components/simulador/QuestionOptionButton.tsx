'use client';

import { Check, X } from 'lucide-react';
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

/**
 * A single answer-option button for a simulator question.
 *
 * Handles all visual states: default, selected, correct, incorrect, and
 * disabled. Preserves the exact markup and Tailwind classes from the original
 * inline rendering in SimuladorExamen.
 */
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
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        'w-full rounded-lg border p-3.5 text-left transition',
        !questionAnswered &&
          'border-slate-200 bg-white hover:border-slate-300 hover:bg-white',
        questionAnswered &&
          'border-slate-200 bg-white',
        selected &&
          !questionAnswered &&
          'border-blue-500 bg-blue-50 text-blue-900 ring-2 ring-blue-100',
        questionAnswered &&
          optionIsCorrect &&
          'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-100',
        selectedIsWrong &&
          'border-rose-500 bg-rose-50 text-rose-900 ring-2 ring-rose-100'
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold uppercase',
            selected
              ? 'border-blue-500 bg-white text-blue-600'
              : 'border-slate-300 bg-white text-slate-500'
          )}
        >
          {OPTION_LABELS[optionIndex] ?? optionIndex + 1}
        </span>
        <span className="flex-1 text-sm leading-5 sm:text-[15px]">{opcion}</span>
        {questionAnswered && optionIsCorrect ? (
          <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
            <Check className="h-3 w-3" />
            Correcta
          </span>
        ) : null}
        {selectedIsWrong ? (
          <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-800">
            <X className="h-3 w-3" />
            Incorrecta
          </span>
        ) : null}
      </div>
    </button>
  );
}
