'use client';

import { useState } from 'react';
import { CheckCircle2, MessageSquareText, Send } from 'lucide-react';
import { submitSimulatorFeedback } from '@/lib/actions/simulator-feedback';
import { cn } from '@/lib/utils';

export const SIMULATOR_NEEDS_REASONS = [
  { value: 'more_questions', label: 'Más preguntas' },
  { value: 'better_explanations', label: 'Mejores explicaciones' },
  { value: 'summaries', label: 'Resúmenes' },
  { value: 'exam_similarity', label: 'Preguntas más parecidas al parcial' },
  { value: 'confusing_experience', label: 'Una experiencia más clara' },
] as const;

export type SimulatorNeedsReason = (typeof SIMULATOR_NEEDS_REASONS)[number]['value'];

export function SimulatorNeedsSurvey({
  onSelect,
  compact = false,
}: {
  onSelect: (reason: SimulatorNeedsReason) => void;
  compact?: boolean;
}) {
  const [selected, setSelected] = useState<SimulatorNeedsReason | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!selected || submitting) return;
    setSubmitting(true);
    setError('');

    try {
      const path = `${window.location.pathname}${window.location.search}`;
      const response = await submitSimulatorFeedback({
        reason: selected,
        comment,
        path,
      });

      if (!response.success) {
        setError(response.message ?? 'No pudimos guardar tu comentario.');
        return;
      }

      setSubmitted(true);
    } catch {
      setError('No pudimos guardar tu comentario. Podés seguir igualmente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div
        role="status"
        className={cn(
          'flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-emerald-900',
          compact ? 'mt-4' : 'mt-6'
        )}
      >
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
        <div>
          <p className="text-sm font-semibold">Gracias por contarnos.</p>
          <p className="mt-0.5 text-xs leading-5 text-emerald-800/80">
            Lo vamos a usar para mejorar los próximos simuladores.
          </p>
        </div>
      </div>
    );
  }

  return (
    <section
      aria-labelledby="simulator-needs-question"
      className={cn(
        'rounded-2xl border border-slate-200 bg-[linear-gradient(145deg,#FFFFFF_0%,#F8FAFF_100%)] p-4 sm:p-5',
        compact ? 'mt-5' : 'mt-6 shadow-[0_12px_32px_rgba(15,23,42,0.05)]'
      )}
    >
      <div className="flex items-start gap-3">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <MessageSquareText className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p id="simulator-needs-question" className="text-sm font-bold text-slate-950">
            ¿Qué te faltó para sentirte más preparado?
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Elegí una opción y, si querés, contanos un poco más.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {SIMULATOR_NEEDS_REASONS.map((reason) => {
          const active = selected === reason.value;
          return (
            <button
              key={reason.value}
              type="button"
              aria-pressed={active}
              onClick={() => {
                setSelected(reason.value);
                setError('');
                onSelect(reason.value);
              }}
              className={cn(
                'min-h-9 rounded-full border px-3 py-2 text-xs font-semibold transition focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:outline-none',
                active
                  ? 'border-indigo-300 bg-indigo-50 text-indigo-700 shadow-sm'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:text-indigo-700'
              )}
            >
              {reason.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        <label htmlFor="simulator-feedback-comment" className="text-xs font-semibold text-slate-700">
          Comentario <span className="font-normal text-slate-400">(opcional)</span>
        </label>
        <textarea
          id="simulator-feedback-comment"
          value={comment}
          onChange={(event) => setComment(event.target.value.slice(0, 1200))}
          rows={3}
          placeholder="Ej.: me gustaría que hubiera más preguntas de casos prácticos..."
          className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
        />
        <div className="mt-1 flex items-center justify-between gap-3">
          <p className="text-[11px] text-slate-400">{comment.length}/1200</p>
          {error ? <p className="text-right text-xs font-medium text-rose-600">{error}</p> : null}
        </div>
      </div>

      <button
        type="button"
        disabled={!selected || submitting}
        onClick={() => void handleSubmit()}
        className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-45"
      >
        <Send className="h-4 w-4" />
        {submitting ? 'Enviando...' : 'Enviar feedback'}
      </button>
    </section>
  );
}
