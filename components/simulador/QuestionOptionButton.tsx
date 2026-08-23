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
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
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
  );
}
