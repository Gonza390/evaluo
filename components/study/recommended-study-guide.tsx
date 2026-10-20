'use client';

import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  BrainCircuit,
  ChartNoAxesColumnIncreasing,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export type RecommendedStudyStep = 'summary' | 'practice' | 'errors';

const steps = {
  summary: {
    label: 'Entender',
    title: 'Empezá por tus apuntes',
    description: 'Tus apuntes, ordenados por temas con resúmenes y conceptos para estudiar.',
    nextLabel: 'Ver práctica',
    icon: BookOpenText,
  },
  practice: {
    label: 'Practicar',
    title: 'Comprobá lo que aprendiste',
    description: 'Respondé preguntas de tu PDF y descubrí qué temas ya entendiste.',
    nextLabel: 'Ver Progreso',
    icon: BrainCircuit,
  },
  errors: {
    label: 'Mejorar',
    title: 'Progreso: estudiá tema por tema',
    description: 'Elegí un tema, repasá sus conceptos, practicá y reforzá lo que te cuesta.',
    nextLabel: 'Empezar a estudiar',
    icon: ChartNoAxesColumnIncreasing,
  },
} as const;

const order: RecommendedStudyStep[] = ['summary', 'practice', 'errors'];

/** Guía integrada y estable: sin overlay ni contenido bloqueado. */
export function RecommendedStudyGuide({
  step,
  transitioning = false,
  onNext,
  onBack,
  onExit,
}: {
  step: RecommendedStudyStep;
  transitioning?: boolean;
  onNext: () => void;
  onBack?: () => void;
  onExit: () => void;
}) {
  const current = steps[step];
  const Icon = current.icon;
  const number = order.indexOf(step) + 1;

  return (
    <section
      data-first-pdf-guide
      aria-label="Guía rápida del primer PDF"
      aria-busy={transitioning}
      className="border-border bg-card relative w-full rounded-2xl border px-3 py-3 shadow-[0_6px_28px_rgba(15,23,42,0.045)] sm:px-4"
    >
      <div className="flex items-start gap-3">
        <div
          className="bg-primary/10 text-primary hidden size-9 shrink-0 items-center justify-center rounded-xl sm:flex"
          aria-hidden="true"
        >
          <Icon className="size-[18px]" />
        </div>
        <div
          key={step}
          data-guide-copy
          aria-live="polite"
          className="min-h-[102px] min-w-0 flex-1 sm:min-h-[78px]"
        >
          <p className="text-primary text-[11px] font-semibold tracking-[0.05em] uppercase">
            {number} de 3 · {current.label}
          </p>
          <h2 className="text-foreground mt-1 text-[15px] font-semibold tracking-tight sm:text-[17px]">
            {current.title}
          </h2>
          <p className="text-muted-foreground mt-1 max-w-[810px] text-[12.5px] leading-[19px] sm:text-[13px] sm:leading-5">
            {current.description}
          </p>
        </div>
        <button
          type="button"
          onClick={onExit}
          aria-label="Saltar guía e ir a estudiar"
          title="Saltar guía"
          className="text-muted-foreground hover:bg-muted focus-visible:outline-ring -mr-1 -mt-1 flex size-9 shrink-0 items-center justify-center rounded-lg focus-visible:outline-2"
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="border-border/70 mt-2 flex flex-wrap items-center justify-between gap-2 border-t pt-2">
        <div className="flex items-center gap-1.5" role="img" aria-label={`Paso ${number} de 3`}>
          {order.map((item, index) => (
            <span
              key={item}
              className={`h-1 rounded-full transition-[width,background-color] duration-300 motion-reduce:transition-none ${
                index + 1 === number
                  ? 'bg-primary w-7'
                  : index + 1 < number
                    ? 'bg-primary/40 w-3'
                    : 'bg-primary/15 w-3'
              }`}
            />
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          {onBack && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onBack}
              disabled={transitioning}
              className="min-h-9 gap-1.5"
            >
              <ArrowLeft className="size-3.5" /> Atrás
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            onClick={onNext}
            disabled={transitioning}
            className="min-h-9 gap-2 px-3 sm:px-4"
          >
            {current.nextLabel} <ArrowRight className="size-3.5" />
          </Button>
        </div>
      </div>
    </section>
  );
}
