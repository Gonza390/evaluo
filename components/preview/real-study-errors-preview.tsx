'use client';

import { StudyErrorsClient } from '@/components/dashboard/study-errors-client';
import type { StudyErrorReviewActions } from '@/components/dashboard/study-error-detail';
import type { StudyErrorsPageData, StudyErrorView } from '@/lib/study-errors';
import { previewErrors, previewMaterials } from './study-errors-preview-data';
import { previewLearning } from './study-errors-preview-learning';

// El preview monta los componentes de producción con acciones locales y datos ficticios.
// No consulta usuarios, no llama a IA y no guarda eventos de estudio ni progreso real.
const sources = {
  Preguntero: 'simulator',
  Flashcards: 'flashcard',
  Práctica: 'exercise',
  Diagnóstico: 'diagnostic',
} as const;
const sampleErrors: StudyErrorView[] = previewErrors
  .filter((item) => item.evidence !== 'conflict')
  .map((item) => ({
    id: item.id,
    materiaId: null,
    parcial: null,
    materiaNombre: previewMaterials.find((pdf) => pdf.id === item.materialId)?.subject ?? null,
    sourceType: sources[item.source as keyof typeof sources],
    sourceKey: `preview:${item.id}`,
    questionId: null,
    topic: item.topic,
    prompt: item.question,
    explanation: item.explanation || null,
    correctAnswer: item.options[item.correct],
    selectedAnswer: item.options[item.chosen],
    failureCount: item.failures,
    status: item.resolved ? 'resolved' : 'pending',
    lastFailedAt: '2026-10-05T10:00:00.000Z',
    lastReviewedAt: item.resolved ? '2026-10-05T11:00:00.000Z' : null,
    resolvedAt: item.resolved ? '2026-10-05T11:00:00.000Z' : null,
    recommendation: item.materialId
      ? {
          materialId: item.materialId,
          materialTitle:
            previewMaterials.find((pdf) => pdf.id === item.materialId)?.title ?? 'Mi PDF',
          pageStart: item.page,
          pageEnd: item.page,
          sectionTitle: item.section || null,
          excerpt: item.excerpt || null,
          relation: 'origin',
        }
      : null,
    alternatives: [],
  }));
const data: StudyErrorsPageData = {
  pending: sampleErrors.filter((item) => item.status === 'pending'),
  resolved: sampleErrors.filter((item) => item.status === 'resolved'),
  materials: previewMaterials.map((pdf) => ({
    id: pdf.id,
    title: pdf.title,
    materiaNombre: pdf.subject,
  })),
};
const waitForSample = () => new Promise<void>((resolve) => setTimeout(resolve, 450));

export const realStudyErrorPreviewActions: StudyErrorReviewActions = {
  markReviewed: async () => ({ success: true }),
  generateHelp: async (errorId, kind) => {
    await waitForSample();
    const error = previewErrors.find((item) => item.id === errorId);
    const source = sampleErrors.find((item) => item.id === errorId)?.recommendation;
    if (!error?.excerpt)
      return {
        success: false,
        message: 'Este material de muestra no tiene un fragmento para ese tema.',
      };
    const learning = previewLearning[errorId];
    const text =
      kind === 'why_wrong'
        ? `${error.explanation}\n\n${error.takeaway}`
        : kind === 'simpler'
          ? learning?.simple
          : learning?.example;
    return text
      ? { success: true, text, source }
      : { success: false, message: 'No hay otra explicación preparada para este ejemplo.' };
  },
  openSource: async (errorId) => {
    await waitForSample();
    const source = sampleErrors.find((item) => item.id === errorId)?.recommendation;
    return source?.excerpt
      ? { success: true, source }
      : { success: false, message: 'No hay un fragmento disponible para este ejemplo.' };
  },
  generateCheck: async (errorId) => {
    await waitForSample();
    const learning = previewLearning[errorId];
    return learning
      ? {
          success: true,
          question: {
            id: `preview:${errorId}`,
            question: learning.question,
            options: learning.options,
          },
        }
      : { success: false, message: 'No hay una comprobación preparada para este ejemplo.' };
  },
  submitCheck: async (questionId, answer) => {
    await waitForSample();
    const learning = previewLearning[questionId.replace(/^preview:/, '')];
    if (!learning || !Number.isInteger(answer) || answer < 0 || answer >= learning.options.length)
      return { success: false, message: 'Elegí una respuesta válida.' };
    const correct = answer === learning.correct;
    return {
      success: true,
      correct,
      correctIndex: learning.correct,
      feedback: learning.feedback,
      resolvedAt: correct ? new Date().toISOString() : null,
    };
  },
  associatePdf: async () => ({
    success: false,
    message:
      'En esta vista de muestra podés probar las explicaciones de Finalismo, Culpabilidad y Transporte pasivo.',
  }),
};

export function RealStudyErrorsPreview() {
  return (
    <main className="dashboard-responsive">
      <StudyErrorsClient
        data={data}
        initialMaterialId="penal"
        reviewActions={realStudyErrorPreviewActions}
        preview
      />
    </main>
  );
}
