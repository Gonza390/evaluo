'use client';

import { useState } from 'react';

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

  if (selected) {
    return (
      <p role="status" className="text-sm font-medium text-emerald-700">
        Gracias. Esto nos ayuda a mejorar el próximo simulador.
      </p>
    );
  }

  return (
    <section
      aria-labelledby="simulator-needs-question"
      className={compact ? 'mt-5' : 'border-border bg-white mt-6 rounded-2xl border p-5'}
    >
      <p id="simulator-needs-question" className="text-foreground text-sm font-semibold">
        ¿Qué te faltó para sentirte más preparado?
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {SIMULATOR_NEEDS_REASONS.map((reason) => (
          <button
            key={reason.value}
            type="button"
            onClick={() => {
              setSelected(reason.value);
              onSelect(reason.value);
            }}
            className="border-border bg-card text-foreground hover:border-primary hover:text-primary focus-visible:ring-ring rounded-full border px-3 py-2 text-xs font-medium transition focus-visible:ring-2 focus-visible:outline-none"
          >
            {reason.label}
          </button>
        ))}
      </div>
    </section>
  );
}
