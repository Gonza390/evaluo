'use client';

import { useMemo, useState } from 'react';
import { CalendarDays, Loader2 } from 'lucide-react';

/**
 * Pregunta "¿Cuándo es tu examen?" (onboarding etapa 2).
 * La usan la pantalla de procesamiento y "Armar mi plan de estudio" en la pantalla final.
 * Con la fecha, el plan se arma solo (lib/student-materials/auto-study-plan.ts).
 */
export type ExamDateAnswer = 'week1' | 'week2' | 'custom';

function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function addDays(base: Date, days: number) {
  const next = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 12);
  next.setDate(next.getDate() + days);
  return next;
}

export function formatExamDateShort(dateKey: string, english: boolean) {
  const date = new Date(`${dateKey}T12:00:00`);
  if (!Number.isFinite(date.getTime())) return dateKey;
  return date.toLocaleDateString(english ? 'en-US' : 'es-AR', {
    weekday: 'short',
    day: 'numeric',
    month: english ? 'short' : 'numeric',
  });
}

export function ExamDateQuestion({
  english,
  saving,
  error,
  onPick,
  onSkip,
  skipLabel,
  headingId = 'exam-date-question',
}: {
  english: boolean;
  saving: boolean;
  error?: string | null;
  onPick: (dateKey: string, answer: ExamDateAnswer) => void;
  onSkip?: () => void;
  skipLabel?: string;
  headingId?: string;
}) {
  const [now] = useState(() => new Date());
  const options = useMemo(
    () =>
      [
        { answer: 'week1' as const, label: english ? 'In 1 week' : 'En 1 semana', date: localDateKey(addDays(now, 7)) },
        { answer: 'week2' as const, label: english ? 'In 2 weeks' : 'En 2 semanas', date: localDateKey(addDays(now, 14)) },
      ],
    [english, now]
  );
  const minDate = localDateKey(addDays(now, 1));
  const maxDate = localDateKey(addDays(now, 365));

  return (
    <section data-exam-date-question aria-labelledby={headingId} className="flex w-full flex-col text-left">
      <h2 id={headingId} className="text-titulo font-semibold leading-tight tracking-titulo text-[#0f1623]">
        {english ? 'When is your exam?' : '¿Cuándo es tu examen?'}
      </h2>
      <p className="mt-2 text-cuerpo leading-[1.45] text-[#4b5565]">
        {english ? "With the date we'll build you a day-by-day plan, automatically." : 'Con la fecha te armamos un plan día por día, solo.'}
      </p>
      <div className="mt-6 flex flex-col gap-2.5">
        {options.map((option) => (
          <button
            key={option.answer}
            type="button"
            disabled={saving}
            onClick={() => onPick(option.date, option.answer)}
            className="flex min-h-14 items-center justify-between rounded-2xl border border-[#dbe3f0] bg-white px-[18px] text-left transition-colors hover:border-[#9fb6e4] hover:bg-[#f7faff] disabled:opacity-60"
          >
            <span className="text-cuerpo font-semibold text-[#0f1623]">{option.label}</span>
            <span className="text-ui text-[#667085]">{formatExamDateShort(option.date, english)}</span>
          </button>
        ))}
        <label className="relative flex min-h-14 cursor-pointer items-center justify-between rounded-2xl border border-[#dbe3f0] bg-white px-[18px] text-[#3c6cba] transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-blue-600 hover:border-[#9fb6e4] hover:bg-[#f7faff]">
          <span className="text-cuerpo font-semibold">{english ? 'Pick another date' : 'Elegir otra fecha'}</span>
          <CalendarDays className="size-[18px]" strokeWidth={1.8} aria-hidden="true" />
          {/* El selector nativo cubre toda la opción: en el teléfono abre el calendario del sistema. */}
          <input
            type="date"
            min={minDate}
            max={maxDate}
            disabled={saving}
            aria-label={english ? 'Exam date' : 'Fecha del examen'}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            onChange={(event) => {
              const value = event.currentTarget.value;
              if (/^\d{4}-\d{2}-\d{2}$/.test(value)) onPick(value, 'custom');
            }}
          />
        </label>
      </div>
      {error ? (
        <p role="alert" className="mt-3 text-ui text-rose-700">{error}</p>
      ) : null}
      {saving ? (
        <p role="status" className="mt-3 flex items-center gap-2 text-ui text-[#4b5565]">
          <Loader2 className="size-4 animate-spin text-[#3c6cba]" aria-hidden="true" />
          {english ? 'Saving…' : 'Guardando…'}
        </p>
      ) : null}
      {onSkip ? (
        <button
          type="button"
          disabled={saving}
          onClick={onSkip}
          className="mt-4 min-h-11 self-center px-4 text-ui font-medium text-[#4b5565] hover:text-[#0f1623]"
        >
          {skipLabel ?? (english ? "I don't know yet" : 'Todavía no sé')}
        </button>
      ) : null}
    </section>
  );
}
