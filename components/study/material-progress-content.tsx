'use client';

import { useEffect, useRef, useState } from 'react';
import { trackMarketingEvent } from '@/lib/marketing-analytics';
import { PdfProgressPanel } from '@/components/dashboard/pdf-progress-panel';
import type { TopicPracticeOutcome } from '@/lib/student-materials/topic-practice-feedback';
import type { StudyGlossaryItem } from '@/lib/student-materials/types';
import type { StudyFlashcard } from '@/lib/student-materials/pedagogy';
import {
  getMaterialProgressDataAction,
  type MaterialProgressDataResult,
} from '@/lib/actions/study-errors';

export function MaterialProgressContent({
  material,
  sections,
  questionCounts,
  requestedError,
  initialTopicSectionIndex,
  initialReinforce,
  lastPracticeOutcome,
  returnToErrors = false,
  onPracticeTopic,
  glossary,
  flashcards,
  sourcePdfHref,
  showOnboardingExample = false,
  showOnboardingTopic = false,
}: {
  material: { id: string; title: string };
  sections: unknown;
  questionCounts: number[];
  requestedError?: string;
  initialTopicSectionIndex?: number;
  initialReinforce?: boolean;
  lastPracticeOutcome?: TopicPracticeOutcome;
  returnToErrors?: boolean;
  onPracticeTopic?: (sectionIndex: number) => void;
  glossary?: StudyGlossaryItem[];
  flashcards?: StudyFlashcard[];
  sourcePdfHref?: string;
  showOnboardingExample?: boolean;
  showOnboardingTopic?: boolean;
}) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<MaterialProgressDataResult | null>(null);
  const [loading, setLoading] = useState(true);
  const progressContentTrackedRef = useRef(false);

  // Track actual loaded PDF progress, not just a click on the Progreso tab.
  // Never record a view for failed requests or loading placeholders.
  useEffect(() => {
    if (loading || !result?.success || progressContentTrackedRef.current) return;
    progressContentTrackedRef.current = true;
    trackMarketingEvent('pdf_progress_content_rendered', { material_id: material.id });
  }, [loading, result?.success, material.id]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    void getMaterialProgressDataAction({
      materialId: material.id,
      requestedError,
    }).then((next) => {
      if (cancelled) return;
      setResult(next);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [attempt, material.id, requestedError]);

  if (loading) {
    return (
      <p role="status" className="text-muted-foreground p-4 text-sm">
        Cargando tu progreso…
      </p>
    );
  }

  if (!result?.success) {
    return (
      <div className="p-4">
        <p role="alert" className="text-sm">
          No pudimos cargar tu progreso. Tus resultados siguen guardados.
        </p>
        <button
          type="button"
          onClick={() => setAttempt((value) => value + 1)}
          className="bg-primary text-primary-foreground mt-3 inline-flex min-h-10 items-center justify-center rounded-lg px-4 text-sm font-semibold"
        >
          Volver a intentar
        </button>
      </div>
    );
  }

  return (
    <PdfProgressPanel
      key={`${material.id}:${result.initialErrorId ?? ''}:${result.assessmentData.items
        .map((item) => item.lastAnsweredAt)
        .join(':')}:${result.data.resolved.map((item) => item.id).join(':')}`}
      embedded
      initialTopicSectionIndex={initialTopicSectionIndex}
      initialReinforce={initialReinforce}
      lastPracticeOutcome={lastPracticeOutcome}
      material={material}
      sections={sections}
      data={result.data}
      assessmentData={result.assessmentData}
      questionCounts={questionCounts}
      onPracticeTopic={onPracticeTopic}
      glossary={glossary}
      flashcards={flashcards}
      sourcePdfHref={sourcePdfHref}
      showOnboardingExample={showOnboardingExample}
      showOnboardingTopic={showOnboardingTopic}
      summaryUnavailable={false}
      initialErrorId={result.initialErrorId ?? undefined}
      returnToErrors={returnToErrors}
    />
  );
}
