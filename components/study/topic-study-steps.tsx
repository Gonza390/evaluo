'use client';

import { useState, type ReactNode } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { useOptionalAppLocale } from '@/components/i18n/app-locale-provider';

export type TopicStudyStep = {
  id: 'summary' | 'concepts' | 'flashcards' | 'practice';
  label: string;
  /** Cantidad opcional que se muestra chica junto al nombre (ej. conceptos, tarjetas). */
  count?: number;
  /** Recibe markDone para que el paso pueda marcarse como hecho al completarse (flashcards). */
  content: (api: { markDone: () => void }) => ReactNode;
};

/**
 * Un paso se marca como hecho sólo si se avanzó con "Siguiente" o se completó
 * (flashcards). Saltar directo a otro paso nunca marca los intermedios.
 */
export function TopicStudySteps({ steps, resetKey }: { steps: TopicStudyStep[]; resetKey: string }) {
  const english = useOptionalAppLocale() === 'en';
  const [state, setState] = useState<{ key: string; current: number; done: string[] }>({
    key: resetKey,
    current: 0,
    done: [],
  });
  // Al cambiar de tema se vuelve al paso 1 sin arrastrar progreso del anterior.
  const view = state.key === resetKey ? state : { key: resetKey, current: 0, done: [] as string[] };
  const step = steps[view.current] ?? steps[0]!;
  const last = view.current === steps.length - 1;
  const next = steps[view.current + 1];
  const set = (current: number, done = view.done) => setState({ key: resetKey, current, done });
  const markDone = (id: string) => (done = view.done) =>
    done.includes(id) ? done : [...done, id];

  return (
    <div className="mt-3 xl:flex xl:min-h-0 xl:flex-1 xl:flex-col">
      <ol className="flex shrink-0 gap-1 sm:flex-wrap sm:gap-2" aria-label={english ? 'Study steps' : 'Pasos de estudio'}>
        {steps.map((item, index) => {
          const current = index === view.current;
          const done = view.done.includes(item.id);
          return (
            <li key={item.id} className="flex min-w-0 flex-1">
              <button
                type="button"
                aria-current={current ? 'step' : undefined}
                onClick={() => set(index)}
                className={
                  'focus-visible:outline-ring flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 text-[12px] font-semibold focus-visible:outline-2 sm:min-h-9 sm:flex-row sm:gap-2 sm:rounded-full sm:border sm:px-3 sm:text-[13px] ' +
                  (current ? 'text-foreground sm:border-primary/30 sm:bg-primary/10' : 'text-muted-foreground sm:text-foreground sm:border-border sm:bg-card sm:hover:bg-muted/50')
                }
              >
                <span
                  className={
                    'flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px] ' +
                    (done && !current
                      ? 'border-emerald-700 bg-emerald-700 text-white'
                      : current
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border text-muted-foreground')
                  }
                >
                  {done && !current ? <Check size={13} strokeWidth={3} aria-label={english ? 'Done' : 'Hecho'} /> : index + 1}
                </span>
                <span className="truncate">{item.label}</span>
                {item.count ? <span className="text-muted-foreground hidden text-xs font-medium sm:inline">{item.count}</span> : null}
              </button>
            </li>
          );
        })}
      </ol>
      <div className="mt-4 flex min-h-0 flex-col xl:flex-1">
        <div className="pr-1 xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:pr-3" key={step.id}>
          {step.content({
            markDone: () => setState((prev) => {
              const base = prev.key === resetKey ? prev : { key: resetKey, current: 0, done: [] as string[] };
              return { ...base, done: markDone(step.id)(base.done) };
            }),
          })}
        </div>
        {!last && next && (
          <div className="border-border bg-background mt-6 flex shrink-0 flex-col gap-2 border-t py-3 sm:flex-row sm:items-center sm:justify-between xl:mt-0">
            <span className="text-muted-foreground hidden text-xs sm:block">
              {english ? `Step ${view.current + 1} of ${steps.length}` : `Paso ${view.current + 1} de ${steps.length}`}
            </span>
            <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-5">
              <button
                type="button"
                onClick={() => set(steps.length - 1)}
                className="text-muted-foreground focus-visible:outline-ring min-h-11 text-[13px] underline underline-offset-4 focus-visible:outline-2"
              >
                {english ? 'Go straight to practice' : 'Ir directo a practicar'}
              </button>
              <button
                type="button"
                onClick={() => set(view.current + 1, markDone(step.id)())}
                className="bg-primary text-primary-foreground focus-visible:outline-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-[14px] font-semibold focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                {(english ? 'Next: ' : 'Siguiente: ') + next.label.toLowerCase()} <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
