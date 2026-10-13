import { PdfProgressPanel } from '@/components/dashboard/pdf-progress-panel';
import { getPendingStudyErrorOnboarding, getStudyErrorsPageData } from '@/lib/study-errors';
import { getPdfAssessmentData } from '@/lib/student-materials/answer-events';

/** Se monta únicamente después de verificar que el visitante es dueño del PDF. */
export async function MaterialProgressContent({
  userId,
  material,
  sections,
  questionCounts,
  requestedError,
  tour,
  returnToErrors = false,
  summaryUnavailable,
}: {
  userId: string;
  material: { id: string; title: string };
  sections: unknown;
  questionCounts: number[];
  requestedError?: string;
  tour?: string;
  returnToErrors?: boolean;
  summaryUnavailable: boolean;
}) {
  const [data, assessmentData] = await Promise.all([
    getStudyErrorsPageData(userId, material.id),
    getPdfAssessmentData(userId, material.id),
  ]);
  const initialErrorId = [...data.pending, ...data.resolved].find(
    (item) => item.id === requestedError
  )?.id;
  const onboardingErrorId =
    tour === 'first-error' && initialErrorId
      ? await getPendingStudyErrorOnboarding(userId, initialErrorId)
      : null;

  return (
    <PdfProgressPanel
      key={`${material.id}:${initialErrorId ?? ''}:${assessmentData.items.map((item) => item.lastAnsweredAt).join(':')}:${data.resolved.map((item) => item.id).join(':')}`}
      embedded
      material={material}
      sections={sections}
      data={data}
      assessmentData={assessmentData}
      questionCounts={questionCounts}
      summaryUnavailable={summaryUnavailable}
      initialErrorId={initialErrorId}
      onboardingErrorId={onboardingErrorId}
      returnToErrors={returnToErrors}
    />
  );
}
