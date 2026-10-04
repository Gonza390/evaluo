'use client';

import { PdfTourSpotlight } from './pdf-tour-spotlight';

export type RecommendedStudyStep = 'summary' | 'practice' | 'errors';

/** Guía breve del método de Evaluo sobre el contenido real del primer PDF. */
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
  const steps = {
    summary: {
      selector: '[data-recommended-summary]',
      title: 'Entendé tu PDF',
      description:
        'Acá tenés el resumen con los temas principales de tu material. Empezá por recorrer lo que necesitás estudiar.',
      nextLabel: 'Siguiente',
      progress: '1 de 3 · Entender',
    },
    practice: {
      selector: '[data-recommended-tab="ejercicios"]',
      title: 'Practicá cuando quieras',
      description:
        'Cuando ya hayas estudiado, entrá en Práctica para comprobar qué entendiste con preguntas del mismo PDF.',
      nextLabel: 'Siguiente',
      progress: '2 de 3 · Practicar',
    },
    errors: {
      selector: '[data-recommended-errors]',
      title: 'Reforzá lo que te cuesta',
      description:
        'Si te equivocás, esos conceptos quedan en Mis errores para que puedas entenderlos y volver a practicarlos.',
      nextLabel: 'Empezar a estudiar',
      progress: '3 de 3 · Reforzar',
    },
  } satisfies Record<
    RecommendedStudyStep,
    {
      selector: string;
      title: string;
      description: string;
      nextLabel: string;
      progress: string;
    }
  >;

  const current = steps[step];

  return (
    <PdfTourSpotlight
      minimal
      selector={current.selector}
      title={current.title}
      description={current.description}
      compactDescription={current.description}
      showCompactDescription
      progress={current.progress}
      nextLabel={current.nextLabel}
      onNext={onNext}
      onBack={onBack}
      onExit={onExit}
      ariaLabel="Guía rápida para estudiar este PDF"
      footerLabel=""
    />
  );
}
