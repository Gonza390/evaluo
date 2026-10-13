'use client';

import { useEffect, useState } from 'react';
import { PdfProgressPanel } from '@/components/dashboard/pdf-progress-panel';
import {
  getMaterialProgressDataAction,
  type MaterialProgressDataResult,
} from '@/lib/actions/study-errors';

export function MaterialProgressContent({
  material,
  sections,
  questionCounts,
  requestedError,
  tour,
  returnToErrors = false,
}: {
  material: { id: string; title: string };
  sections: unknown;
  questionCounts: number[];
  requestedError?: string;
  tour?: string;
  returnToErrors?: boolean;
}) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<MaterialProgressDataResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    void getMaterialProgressDataAction({
      materialId: material.id,
      requestedError,
      tour,
    }).then((next) => {
      if (cancelled) return;
      setResult(next);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [attempt, material.id, requestedError, tour]);

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
      material={material}
      sections={sections}
      data={result.data}
      assessmentData={result.assessmentData}
      questionCounts={questionCounts}
      summaryUnavailable={false}
      initialErrorId={result.initialErrorId ?? undefined}
      onboardingErrorId={result.onboardingErrorId}
      returnToErrors={returnToErrors}
    />
  );
}
