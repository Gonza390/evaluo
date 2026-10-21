import type { StudyErrorView } from '@/lib/study-errors';

export function studyErrorGroupId(error: Pick<StudyErrorView, 'sourceType' | 'recommendation'>) {
  return error.sourceType === 'simulator'
    ? 'unlinked'
    : (error.recommendation?.materialId ?? 'unlinked');
}

/** Un PDF se refuerza en Progreso; una recomendación no cambia el origen del simulador. */
export function pdfProgressReviewHref(
  materialId: string | null | undefined,
  error?: Pick<StudyErrorView, 'id' | 'sourceType'>
) {
  if (!materialId || error?.sourceType === 'simulator') return null;
  const target = new URLSearchParams({ material: materialId, from: 'errores' });
  if (error) target.set('error', error.id);
  return `/dashboard/progreso?${target}`;
}
