import {
  analyzePdfDocument,
  extractPdfTextAndPageCount,
  generateStudentMaterialGlossary,
  generateStudentMaterialSummary,
  persistStudentMaterialGlossaryArtifacts,
  persistStudentMaterialSummaryFromComputed,
} from '@/lib/student-material-summary';
import { completeStudentMaterialJob } from '@/lib/student-material-jobs';
import {
  findStudentMaterialForProcessing,
  loadStudentMaterialProcessingContext,
  updateStudentMaterialProcessing,
} from '@/lib/repositories/student-materials';
import { createAdminClient } from '@/lib/supabase-admin';
import { evaluateChunks, buildChunkEvaluationReport } from '@/lib/student-materials/chunk-evaluator';
import { checkDuplicate } from '@/lib/student-materials/dedup';
import { buildSummaryChunks } from '@/lib/student-materials/text';
import { logError, logInfo } from '@/lib/observability';
import type { StudyDocumentAnalysis } from '@/lib/student-materials/types';

export type StudentMaterialProcessingStage =
  | 'uploaded'
  | 'extracting'
  | 'summarizing'
  | 'glossary'
  | 'ready'
  | 'failed';

export type StudentMaterialProcessingResult = {
  success: boolean;
  message: string;
  materialId?: string;
};

function buildAnalysisMessage(analysis: StudyDocumentAnalysis) {
  if (analysis.requiresOcr) {
    return 'Detectamos un PDF escaneado o muy visual. Seguimos con extracción base y dejamos OCR recomendado.';
  }
  if (analysis.processingStrategy === 'slide_layout') {
    return 'Detectamos un material tipo diapositiva. Ajustamos la lectura para priorizar bloques, títulos y puntos clave.';
  }
  if (analysis.processingStrategy === 'hybrid_text') {
    return 'Detectamos un PDF mixto con texto e imágenes. Priorizamos una lectura híbrida del contenido.';
  }
  return 'Detectamos un PDF con texto nativo. Seguimos con extracción estructurada por temas y bloques.';
}

export async function processStudentMaterial(input: {
  materialId: string;
  ownerUserId?: string;
  jobId?: string | null;
}): Promise<StudentMaterialProcessingResult> {
  const admin = createAdminClient();
  const material = await findStudentMaterialForProcessing(admin, input.materialId, input.ownerUserId);

  if (!material) throw new Error('No encontramos el material que queres procesar.');

  await updateStudentMaterialProcessing(admin, material.id, {
    processingStatus: 'processing', processingStage: 'extracting', processingProgress: 18,
    processingMessage: 'Analizando el PDF para clasificar su estructura y estrategia de lectura.',
  });

  const context = await loadStudentMaterialProcessingContext(admin, material);
  const buffer = Buffer.from(await context.file.arrayBuffer());
  const { text, pageCount } = await extractPdfTextAndPageCount(buffer);
  const documentAnalysis = analyzePdfDocument(buffer, text, pageCount);

  // --- Dedup check (best-effort, never blocks processing) ---
  try {
    const dedupResult = await checkDuplicate(
      text,
      material.materia_id,
      material.user_id,
      material.id
    );
    if (dedupResult.isDuplicate) {
      logInfo('processStudentMaterial.dedup', {
        materialId: material.id,
        similarity: dedupResult.similarity,
        similarMaterialId: dedupResult.similarMaterialId,
      });
    }
  } catch (dedupError) {
    logError('processStudentMaterial.dedup', dedupError, { materialId: material.id });
  }

  await updateStudentMaterialProcessing(admin, material.id, {
    processingStatus: 'processing', processingStage: 'extracting', processingProgress: 34,
    processingMessage: buildAnalysisMessage(documentAnalysis), pageCount,
    processingStrategy: documentAnalysis.processingStrategy, documentAnalysis,
  });
  await updateStudentMaterialProcessing(admin, material.id, {
    processingStatus: 'processing', processingStage: 'summarizing', processingProgress: 52,
    processingMessage: documentAnalysis.processingStrategy === 'slide_layout'
      ? 'Generando resumen estructurado a partir de bloques visuales y temas detectados.'
      : 'Generando resumen estructurado del PDF.',
    pageCount, processingStrategy: documentAnalysis.processingStrategy,
  });

  const summary = await generateStudentMaterialSummary({
    title: material.title, universidadName: context.universidadName, carreraName: context.carreraName,
    materiaName: context.materiaName, text, documentAnalysis, pdfBuffer: buffer,
  });
  await persistStudentMaterialSummaryFromComputed({
    admin, studentMaterialId: material.id, text, summary, persistChunks: true,
  });

  // --- Chunk quality evaluation (best-effort, never blocks processing) ---
  try {
    const chunks = buildSummaryChunks(text);
    const evaluations = await evaluateChunks(
      chunks,
      context.materiaName ?? material.title,
      material.id
    );
    const report = buildChunkEvaluationReport(evaluations);
    if (report.flaggedChunks.length > 0) {
      logInfo('processStudentMaterial.chunkQuality', {
        materialId: material.id,
        totalChunks: report.totalChunks,
        averageScore: report.averageScore,
        flaggedCount: report.flaggedChunks.length,
        actionCounts: report.actionCounts,
      });
    }
  } catch (chunkEvalError) {
    logError('processStudentMaterial.chunkQuality', chunkEvalError, { materialId: material.id });
  }

  await updateStudentMaterialProcessing(admin, material.id, {
    processingStatus: 'processing', processingStage: 'glossary', processingProgress: 78,
    processingMessage: 'Generando glosario y conceptos clave para estudiar.', pageCount,
    processingStrategy: documentAnalysis.processingStrategy,
  });
  const glossary = await generateStudentMaterialGlossary({
    title: material.title, universidadName: context.universidadName, carreraName: context.carreraName,
    materiaName: context.materiaName, text, documentAnalysis, pdfBuffer: buffer,
  }, summary);
  await persistStudentMaterialGlossaryArtifacts({
    admin, studentMaterialId: material.id, glossary, provider: summary.provider, errorMessage: summary.errorMessage,
  });

  await updateStudentMaterialProcessing(admin, material.id, {
    processingStatus: 'ready', processingStage: 'ready', processingProgress: 100,
    processingMessage: 'Material listo para estudiar.', processingError: null, pageCount,
    processingStrategy: documentAnalysis.processingStrategy,
  });
  if (input.jobId) await completeStudentMaterialJob(admin, input.jobId);

  return { success: true, materialId: material.id, message: 'El PDF ya quedo listo con su resumen y glosario.' };
}

export async function markStudentMaterialProcessingFailed(materialId: string, error: unknown) {
  const admin = createAdminClient();
  await updateStudentMaterialProcessing(admin, materialId, {
    processingStatus: 'failed', processingStage: 'failed', processingProgress: 0,
    processingMessage: 'No pudimos terminar el procesamiento del PDF.',
    processingError: error instanceof Error ? error.message : 'Error desconocido al procesar el PDF.',
  });
}
