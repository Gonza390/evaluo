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
import { tryReuseStudentMaterialCanonicalArtifacts } from '@/lib/student-materials/canonical-cache';
import {
  buildSummaryChunks,
  buildTraceableSummaryChunks,
  mapLocalSummaryToView,
  summarizeExtractedText,
} from '@/lib/student-materials/text';
import {
  enhancePdfExtractionWithVision,
  selectVisionPageNumbers,
} from '@/lib/student-materials/vision-extract';
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
  const {
    text: nativeText,
    pageCount,
    pages: nativePages,
  } = await extractPdfTextAndPageCount(buffer);
  const documentAnalysis = analyzePdfDocument(buffer, nativeText, pageCount);

  const selectedVisionPageNumbers = selectVisionPageNumbers({
    analysis: documentAnalysis,
    pages: nativePages,
    pageCount,
  });

  if (selectedVisionPageNumbers.length > 0) {
    await updateStudentMaterialProcessing(admin, material.id, {
      processingStatus: 'processing',
      processingStage: 'extracting',
      processingProgress: 27,
      processingMessage: documentAnalysis.requiresOcr
        ? 'Detectamos páginas escaneadas. Activamos lectura visual para reconstruir texto, fórmulas, matrices y gráficos.'
        : 'Detectamos páginas donde la estructura visual importa. Reforzamos la extracción de fórmulas, tablas y diagramas.',
      pageCount,
      processingStrategy: documentAnalysis.processingStrategy,
      documentAnalysis,
    });
  }

  const visionExtraction = await enhancePdfExtractionWithVision({
    pdfBuffer: buffer,
    nativeText,
    nativePages,
    pageCount,
    analysis: documentAnalysis,
    materialId: material.id,
    userId: material.user_id,
    pageNumbers: selectedVisionPageNumbers,
  });

  const text = visionExtraction.text;
  const pages = visionExtraction.pages;
  const visionUsed = visionExtraction.visionUsed;
  const visionPageNumbers = visionExtraction.visionPageNumbers;

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
    !visionUsed &&
    pagesWithText > 0;

  const cacheReuse = await tryReuseStudentMaterialCanonicalArtifacts({
    materialId: material.id,
    materiaId: material.materia_id,
    text,
  });

  if (cacheReuse.hit) {
    await updateStudentMaterialProcessing(admin, material.id, {
      processingStatus: 'ready',
      processingStage: 'ready',
      processingProgress: 100,
      processingMessage: 'Material listo para estudiar.',
      processingError: null,
      pageCount,
      processingStrategy: documentAnalysis.processingStrategy,
      documentAnalysis,
      pagesProcessed,
      coverageRatio,
    });

    if (input.jobId) await completeStudentMaterialJob(admin, input.jobId);

    const aiUsage = await aggregateAiUsageForMaterial(admin, material.id);

    await Promise.all([
      trackServerAnalyticsEvent({
        eventName: 'student_material_processing_cache_hit',
        userId: material.user_id,
        path: '/dashboard/materiales',
        metadata: {
          material_id: material.id,
          pipeline_version: cacheReuse.pipelineVersion,
          page_count: pageCount,
          vision_used: visionUsed,
          vision_page_count: visionPageNumbers.length,
        },
      }),
      trackServerAnalyticsEvent({
        eventName: 'student_material_processing_ready',
        userId: material.user_id,
        path: '/dashboard/materiales',
        metadata: {
          material_id: material.id,
          page_count: pageCount,
          processing_strategy: documentAnalysis.processingStrategy,
          fast_path: useLargeNativePdfFastPath,
          vision_used: visionUsed,
          vision_page_count: visionPageNumbers.length,
          cache_hit: true,
          pipeline_version: cacheReuse.pipelineVersion,
        },
      }),
    ]);

    logInfo('processStudentMaterial.performance', {
      materialId: material.id,
      pageCount,
      pagesProcessed,
      pagesWithText,
      coverageRatio,
      chunkCount: cacheReuse.chunkCount,
      extractionMs,
      generationMs: 0,
      totalMs: Date.now() - processingStartedAt,
      summaryProvider: cacheReuse.summaryProvider,
      glossaryProvider: cacheReuse.glossaryProvider,
      glossaryItemCount: cacheReuse.glossaryItemCount,
      processingStrategy: documentAnalysis.processingStrategy,
      fastPath: useLargeNativePdfFastPath,
      visionUsed,
      visionPageCount: visionPageNumbers.length,
      visionModel: visionExtraction.visionModel,
      cacheHit: true,
      cacheSourceMaterialId: cacheReuse.sourceMaterialId,
      pipelineVersion: cacheReuse.pipelineVersion,
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
      message: 'El PDF ya quedo listo reutilizando un procesamiento identico.',
    };
  }

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
    processingMessage: visionUsed
      ? `Lectura visual integrada en ${visionPageNumbers.length} ${visionPageNumbers.length === 1 ? 'página' : 'páginas'}. Conservamos fórmulas y estructura antes de generar el material de estudio.`
      : buildAnalysisMessage(documentAnalysis),
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
      : visionUsed
        ? 'Construyendo el modelo pedagógico canónico desde texto y lectura visual del PDF.'
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
    // Si la reconstrucción visual canónica fue satisfactoria, todo el pipeline
    // posterior consume esa única fuente. Evitamos volver a leer el PDF por
    // separado para resumen/glosario y generar versiones divergentes.
    pdfBuffer: documentAnalysis.requiresOcr && !visionUsed ? buffer : undefined,
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
      vision_used: visionUsed,
      vision_page_count: visionPageNumbers.length,
      cache_hit: false,
      pipeline_version: cacheReuse.pipelineVersion,
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
    visionUsed,
    visionPageCount: visionPageNumbers.length,
    visionModel: visionExtraction.visionModel,
    cacheHit: false,
    pipelineVersion: cacheReuse.pipelineVersion,
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
