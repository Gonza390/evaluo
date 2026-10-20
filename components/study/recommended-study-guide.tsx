'use client';

import { ArrowLeft, ArrowRight, BookOpenText, BrainCircuit, ChartNoAxesColumnIncreasing, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type RecommendedStudyStep = 'summary' | 'practice' | 'errors';

const steps = {
  summary: {
    label: 'Entender',
    title: 'Empezá por tus apuntes',
    description: 'Tu PDF está organizado en capítulos para que puedas estudiar los conceptos importantes.',
    nextLabel: 'Ver práctica',
    icon: BookOpenText,
  },
  practice: {
    label: 'Practicar',
    title: 'Comprobá lo que aprendiste',
    description: 'Elegí una tanda de preguntas creadas a partir de tu mismo PDF.',
    nextLabel: 'Ver Progreso',
    icon: BrainCircuit,
  },
  errors: {
    label: 'Mejorar',
    title: 'Progreso: estudiá tema por tema',
    description: 'Elegí un tema, repasá sus conceptos, practicá y reforzá lo que te cuesta. Así sabés qué estudiar después.',
    nextLabel: 'Empezar a estudiar',
    icon: ChartNoAxesColumnIncreasing,
  },
} as const;

const order: RecommendedStudyStep[] = ['summary', 'practice', 'errors'];

/**
 * Una guía compacta dentro del espacio de estudio: sin desenfoque, recortes
 * del contenido ni controles superpuestos sobre la interfaz real.
 */
export function RecommendedStudyGuide({
  step,
  onNext,
  onBack,
  onExit,
}: {
  step: RecommendedStudyStep;
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
      className="border-primary/20 bg-primary/[0.045] relative w-full rounded-xl border px-3 py-3 sm:px-4 sm:py-3"
    >
      <div className="flex items-start gap-3">
        <div className="bg-primary/10 text-primary hidden size-10 shrink-0 items-center justify-center rounded-lg sm:flex" aria-hidden="true">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-primary text-[11px] font-bold tracking-wide uppercase">
            {number} de 3 · {current.label}
          </p>
          <h2 className="text-foreground mt-1 text-base font-bold tracking-tight sm:text-[17px]">
            {current.title}
          </h2>
          <p className="text-muted-foreground mt-1 max-w-[800px] text-[13px] leading-5 sm:text-sm">
            {current.description}
          </p>
        </div>
        <button
          type="button"
          onClick={onExit}
          aria-label="Saltar guía e ir a estudiar"
          title="Saltar guía"
          className="text-muted-foreground hover:bg-muted focus-visible:outline-ring -mr-1 -mt-1 flex size-10 shrink-0 items-center justify-center rounded-lg focus-visible:outline-2"
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-primary/10 pt-2.5">
        <div className="flex items-center gap-1.5" role="img" aria-label={`Paso ${number} de 3`}>
          {order.map((item, index) => (
            <span
              key={item}
              className={`h-1.5 rounded-full transition-all ${
                index + 1 === number ? 'bg-primary w-7' : index + 1 < number ? 'bg-primary/40 w-3' : 'bg-primary/15 w-3'
              }`}
            />
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {onBack && (
            <Button type="button" variant="ghost" size="sm" onClick={onBack} className="min-h-10 gap-1.5">
              <ArrowLeft className="size-3.5" /> Atrás
            </Button>
          )}
          <Button type="button" size="sm" onClick={onNext} className="min-h-10 gap-2 px-4">
            {current.nextLabel} <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
