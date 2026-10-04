'use client';

import { PdfTourSpotlight } from './pdf-tour-spotlight';

export type RecommendedStudyStep = 'summary' | 'practice' | 'errors';

/** Ayudas breves sobre el contenido real del PDF, sin un panel adicional de onboarding. */
export function RecommendedStudyGuide({
  step,
  questionCount,
  demo = false,
  onNext,
  onBack,
  onExit,
}: {
  step: RecommendedStudyStep;
  questionCount: number;
  demo?: boolean;
  onNext: () => void;
  onBack?: () => void;
  onExit: () => void;
}) {
  const steps = {
    summary: {
      selector: '[data-recommended-summary]',
      title: 'Este es tu resumen',
      description: 'Acá tenés los temas principales de tu PDF. Podés empezar leyendo este resumen.',
      nextLabel: 'Entendido',
      progress: 'Entender',
    },
    practice: {
      selector: '[data-recommended-tab="ejercicios"]',
      title: 'Acá comprobás qué entendiste',
      description: `${questionCount} preguntas sobre este mismo PDF. Así encontrás qué temas necesitás reforzar.`,
      nextLabel: 'Probar una práctica',
      progress: 'Practicar',
    },
    errors: {
      selector: '[data-recommended-result]',
      title: 'Volvé a los temas que te costaron',
      description: demo
        ? 'En tus PDFs, estos conceptos quedan guardados en Mis errores. Ahí podés entenderlos con tu material y comprobarlos de nuevo.'
        : 'Estos conceptos quedaron guardados en Mis errores. Ahí podés entenderlos con tu PDF y comprobarlos de nuevo.',
      nextLabel: 'Ver mis errores',
      progress: 'Reforzar',
    },
  };
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
      ariaLabel="Ayuda para estudiar este PDF"
      footerLabel=""
    />
  );
}
