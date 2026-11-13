'use client';

import { useState, type ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { useOptionalAppLocale } from '@/components/i18n/app-locale-provider';
import { autoHideScrollbarRef } from '@/components/study/auto-hide-scrollbar';

export type TopicStudyStep = {
  id: 'summary' | 'concepts' | 'flashcards' | 'practice';
  label: string;
  /** Oculta el encabezado del tema en este paso (ej. flashcards, que ya tiene su propia pantalla). */
  hideHeader?: boolean;
  content: () => ReactNode;
};

/**
 * Estudio de un tema paso a paso. Sin pestañas: se avanza con el botón de abajo.
 * Cambiar de tema vuelve siempre al primer paso.
 */
export function TopicStudySteps({
  steps,
  resetKey,
  header,
}: {
  steps: TopicStudyStep[];
  resetKey: string;
  /** Encabezado del tema: va dentro del scroll, junto al contenido (no queda fijo). */
  header?: ReactNode;
}) {
  const english = useOptionalAppLocale() === 'en';
  const [state, setState] = useState({ key: resetKey, current: 0 });
  const current = state.key === resetKey ? state.current : 0;
  const step = steps[current] ?? steps[0]!;
  const last = current === steps.length - 1;
  const next = steps[current + 1];
  const go = (index: number) => setState({ key: resetKey, current: index });

  return (
    <div className="mt-3 xl:flex xl:min-h-0 xl:flex-1 xl:flex-col">
      <p className="sr-only" aria-live="polite">
        {(english ? `Step ${current + 1} of ${steps.length}: ` : `Paso ${current + 1} de ${steps.length}: `) + step.label}
      </p>
      <div className="flex min-h-0 flex-col xl:flex-1">
        <div
          ref={autoHideScrollbarRef}
          className="scroll-auto-hide pr-1 xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:pr-3"
        >
          {step.hideHeader ? null : header}
          <div className="evaluo-enter" key={step.id}>
            {step.content()}
          </div>
        </div>
        <div className="border-border bg-background mt-6 flex shrink-0 items-center justify-between gap-3 border-t pt-1 pb-0 xl:mt-0">
          <span className="text-muted-foreground text-xs">
            {english ? `Step ${current + 1} of ${steps.length}` : `Paso ${current + 1} de ${steps.length}`}
          </span>
          <div className="flex items-center gap-4">
            {current > 0 && (
              <button
                type="button"
                onClick={() => go(current - 1)}
                className="text-muted-foreground focus-visible:outline-ring min-h-9 text-[13px] underline underline-offset-4 focus-visible:outline-2"
              >
                {english ? 'Back' : 'Atrás'}
              </button>
            )}
            {!last && next && (
              <>
                <button
                  type="button"
                  onClick={() => go(steps.length - 1)}
                  className="text-muted-foreground focus-visible:outline-ring hidden min-h-9 text-[13px] underline underline-offset-4 focus-visible:outline-2 sm:block"
                >
                  {english ? 'Go straight to practice' : 'Ir directo a practicar'}
                </button>
                <button
                  type="button"
                  onClick={() => go(current + 1)}
                  className="bg-primary text-primary-foreground focus-visible:outline-ring inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full px-4 text-[13px] font-semibold focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  {(english ? 'Next: ' : 'Siguiente: ') + next.label.toLowerCase()} <ArrowRight size={15} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
