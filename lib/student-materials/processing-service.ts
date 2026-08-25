import {
  analyzePdfDocument,
  extractPdfTextAndPageCount,
  generateStudentMaterialGlossary,
  generateStudentMaterialSummary,
  persistStudentMaterialGlossaryArtifacts,
  persistStudentMaterialSummaryFromComputed,
  generatePedagogicalModel,
} from '@/lib/student-material-summary';
import { generateCanonicalStudentMaterialSummary } from '@/lib/student-materials/canonical-summary';
import {
  buildCanonicalStudentMaterialGlossary,
  CANONICAL_GLOSSARY_PROVIDER,
} from '@/lib/student-materials/canonical-glossary';
import { completeStudentMaterialJob } from '@/lib/student-material-jobs';
import {
  findStudentMaterialForProcessing,
  loadStudentMaterialProcessingContext,
  updateStudentMaterialProcessing,
} from '@/lib/repositories/student-materials';
import { createAdminClient } from '@/lib/supabase-admin';
import {
  evaluateChunks,
  buildChunkEvaluationReport,
} from '@/lib/student-materials/chunk-evaluator';
import { checkDuplicate } from '@/lib/student-materials/dedup';
import {
  buildSummaryChunks,
  buildTraceableSummaryChunks,
  mapLocalSummaryToView,
  summarizeExtractedText,
} from '@/lib/student-materials/text';
import { logError, logInfo } from '@/lib/observability';
import { trackServerAnalyticsEvent } from '@/lib/server-analytics';
import type { StudyDocumentAnalysis } from '@/lib/student-materials/types';
import type { Json } from '@/types/supabase';
import { aggregateAiUsageForMaterial } from '@/lib/student-materials/ai-usage';

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

const LARGE_NATIVE_PDF_FAST_PATH_PAGES = 20;

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
  const processingStartedAt = Date.now();
  const admin = createAdminClient();
  const material = await findStudentMaterialForProcessing(
    admin,
    input.materialId,
    input.ownerUserId
  );

  if (!material) throw new Error('No encontramos el material que queres procesar.');

  await updateStudentMaterialProcessing(admin, material.id, {
    processingStatus: 'processing',
    processingStage: 'extracting',
    processingProgress: 18,
    processingMessage: 'Analizando el PDF para clasificar su estructura y estrategia de lectura.',
  });

  const extractionStartedAt = Date.now();
  const context = await loadStudentMaterialProcessingContext(admin, material);
  const buffer = Buffer.from(await context.file.arrayBuffer());
  const { text, pageCount, pages } = await extractPdfTextAndPageCount(buffer);
  const documentAnalysis = analyzePdfDocument(buffer, text, pageCount);

  /**
   * `pagesProcessed` mide páginas físicas procesadas por el extractor,
   * no páginas que contienen texto seleccionable.
   *
   * Una página vacía, una página con sólo imágenes o una página visual puede
   * haber sido procesada correctamente y conservar su posición física dentro
   * de `pages[]` aunque su string sea vacío.
   */
  const pagesProcessed = Array.isArray(pages) ? pages.length : 0;
  const pagesWithText = Array.isArray(pages)
    ? pages.filter((page) => page.trim().length > 0).length
    : 0;

  const coverageRatio =
    pageCount && pageCount > 0
      ? Math.min(1, Math.round((pagesProcessed / pageCount) * 100) / 100)
      : 0;

  const extractionMs = Date.now() - extractionStartedAt;
  const traceableChunks = buildTraceableSummaryChunks(pages, text);
  const useLargeNativePdfFastPath =
    typeof pageCount === 'number' &&
    pageCount >= LARGE_NATIVE_PDF_FAST_PATH_PAGES &&
    !documentAnalysis.requiresOcr &&
    pagesWithText > 0;

  // Dedup es informativo: lo solapamos con la generación en lugar de frenar la IA.
  const dedupPromise = checkDuplicate(
    text,
    material.materia_id,
    material.user_id,
    material.id
  )
    .then((dedupResult) => {
      if (dedupResult.isDuplicate) {
        logInfo('processStudentMaterial.dedup', {
          materialId: material.id,
          similarity: dedupResult.similarity,
          similarMaterialId: dedupResult.similarMaterialId,
        });
      }
    })
    .catch((dedupError) => {
      logError('processStudentMaterial.dedup', dedupError, { materialId: material.id });
    });

  await updateStudentMaterialProcessing(admin, material.id, {
    processingStatus: 'processing',
    processingStage: 'extracting',
    processingProgress: 34,
    processingMessage: buildAnalysisMessage(documentAnalysis),
    pageCount,
    processingStrategy: documentAnalysis.processingStrategy,
    documentAnalysis,
    pagesProcessed,
    coverageRatio,
  });

  await updateStudentMaterialProcessing(admin, material.id, {
    processingStatus: 'processing',
    processingStage: 'extracting',
    processingProgress: 45,
    processingMessage: useLargeNativePdfFastPath
      ? 'PDF extenso detectado. Activamos el modo rápido y preparamos resumen y glosario en paralelo.'
      : 'Construyendo el modelo pedagógico canónico del material.',
    pageCount,
    processingStrategy: documentAnalysis.processingStrategy,
    pagesProcessed,
    coverageRatio,
  });

  const generationInput = {
    title: material.title,
    universidadName: context.universidadName,
    carreraName: context.carreraName,
    materiaName: context.materiaName,
    text,
    pages,
    documentAnalysis,
    pdfBuffer: documentAnalysis.requiresOcr ? buffer : undefined,
    materialId: material.id,
    userId: material.user_id,
  };

  if (useLargeNativePdfFastPath) {
    logInfo('processStudentMaterial.fastPath', {
      materialId: material.id,
      pageCount,
      pagesWithText,
      chunkCount: traceableChunks.length,
      strategy: 'large_native_pdf',
    });
  }

  const pedagogicalModel = useLargeNativePdfFastPath
    ? null
    : await generatePedagogicalModel(generationInput);

  if (pedagogicalModel) {
    try {
      const { error: pedagogicalModelPersistError } = await admin
        .from('student_materials')
        .update({ pedagogical_model: pedagogicalModel as unknown as Json } as never)
        .eq('id', material.id);

      if (pedagogicalModelPersistError) {
        throw pedagogicalModelPersistError;
      }
    } catch (modelErr) {
      logError('processStudentMaterial.pedagogicalModelPersist', modelErr, {
        materialId: material.id,
      });
      throw modelErr;
    }
  }

  await updateStudentMaterialProcessing(admin, material.id, {
    processingStatus: 'processing',
    processingStage: 'summarizing',
    processingProgress: 65,
    processingMessage:
      pedagogicalModel
        ? 'Generando la guía de estudio desde el modelo pedagógico canónico.'
        : documentAnalysis.processingStrategy === 'slide_layout'
          ? 'Generando resumen y glosario a partir de bloques visuales y temas detectados.'
          : 'Generando resumen y glosario en paralelo.',
    pageCount,
    processingStrategy: documentAnalysis.processingStrategy,
    pagesProcessed,
    coverageRatio,
  });

  const generationStartedAt = Date.now();

  const summaryPromise = pedagogicalModel
    ? generateCanonicalStudentMaterialSummary(generationInput, pedagogicalModel)
    : generateStudentMaterialSummary(generationInput);

  const canonicalGlossary = pedagogicalModel
    ? buildCanonicalStudentMaterialGlossary(pedagogicalModel)
    : [];

  const glossaryUsesCanonicalModel =
    pedagogicalModel !== null && canonicalGlossary.length > 0;

  const glossaryPromise = glossaryUsesCanonicalModel
    ? Promise.resolve(canonicalGlossary)
    : generateStudentMaterialGlossary(
        generationInput,
        mapLocalSummaryToView(
          summarizeExtractedText(text, material.title),
          buildSummaryChunks(text).length,
          'parallel-local-seed'
        )
      );

  const [summary, glossary] = await Promise.all([
    summaryPromise,
    glossaryPromise,
  ]);

  const glossaryProvider = glossaryUsesCanonicalModel
    ? CANONICAL_GLOSSARY_PROVIDER
    : summary.provider;

  const generationMs = Date.now() - generationStartedAt;

  await updateStudentMaterialProcessing(admin, material.id, {
    processingStatus: 'processing',
    processingStage: 'glossary',
    processingProgress: 78,
    processingMessage: 'Guardando la guía, el glosario y los conceptos clave.',
    pageCount,
    processingStrategy: documentAnalysis.processingStrategy,
  });

  const chunkQualityPromise = (async () => {
    try {
      const chunks = buildSummaryChunks(text);
      const evaluations = await evaluateChunks(
        chunks,
        context.materiaName ?? material.title,
        material.id,
        { useLlm: false }
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
      logError('processStudentMaterial.chunkQuality', chunkEvalError, {
        materialId: material.id,
      });
    }
  })();

  const [aiUsage] = await Promise.all([
    aggregateAiUsageForMaterial(admin, material.id),
    persistStudentMaterialSummaryFromComputed({
      admin,
      studentMaterialId: material.id,
      text,
      summary,
      persistChunks: true,
      traceableChunks,
    }),
    persistStudentMaterialGlossaryArtifacts({
      admin,
      studentMaterialId: material.id,
      glossary,
      provider: glossaryProvider,
      errorMessage: glossary.length > 0 ? null : summary.errorMessage,
    }),
    chunkQualityPromise,
    dedupPromise,
  ]);

  await updateStudentMaterialProcessing(admin, material.id, {
    processingStatus: 'ready',
    processingStage: 'ready',
    processingProgress: 100,
    processingMessage: 'Material listo para estudiar.',
    processingError: null,
    pageCount,
    processingStrategy: documentAnalysis.processingStrategy,
    pagesProcessed,
    coverageRatio,
  });

  if (input.jobId) await completeStudentMaterialJob(admin, input.jobId);

  await trackServerAnalyticsEvent({
    eventName: 'student_material_processing_ready',
    userId: material.user_id,
    path: '/dashboard/materiales',
    metadata: {
      material_id: material.id,
      page_count: pageCount,
      processing_strategy: documentAnalysis.processingStrategy,
      fast_path: useLargeNativePdfFastPath,
    },
  });

  logInfo('processStudentMaterial.performance', {
    materialId: material.id,
    pageCount,
    pagesProcessed,
    pagesWithText,
    coverageRatio,
    chunkCount: traceableChunks.length,
    extractionMs,
    generationMs,
    totalMs: Date.now() - processingStartedAt,
    summaryProvider: summary.provider,
    glossaryProvider,
    glossaryItemCount: glossary.length,
    processingStrategy: documentAnalysis.processingStrategy,
    fastPath: useLargeNativePdfFastPath,
    totalAiTokens: aiUsage.totalAiTokens,
    promptTokens: aiUsage.promptTokens,
    completionTokens: aiUsage.completionTokens,
    aiCallCount: aiUsage.aiCallCount,
    tokensPerPage:
      pageCount && pageCount > 0 && aiUsage.totalAiTokens
        ? Math.round(aiUsage.totalAiTokens / pageCount)
        : null,
  });

  return {
    success: true,
    materialId: material.id,
    message: 'El PDF ya quedo listo con su resumen y glosario.',
  };
}

export async function markStudentMaterialProcessingFailed(materialId: string, error: unknown) {
  const admin = createAdminClient();
  await updateStudentMaterialProcessing(admin, materialId, {
    processingStatus: 'failed',
    processingStage: 'failed',
    processingProgress: 0,
    processingMessage: 'No pudimos terminar el procesamiento del PDF.',
    processingError:
      error instanceof Error ? error.message : 'Error desconocido al procesar el PDF.',
  });
}
