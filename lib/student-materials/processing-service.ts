import { createHash } from 'node:crypto';
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
import {
  enhancePdfExtractionWithVision,
  selectVisionPageNumbers,
} from '@/lib/student-materials/vision-extract';
import { isStudentMaterialVisualAnalysisEnabled } from '@/lib/student-materials/visual-analysis-policy';
import { logError, logInfo } from '@/lib/observability';
import { trackServerAnalyticsEvent } from '@/lib/server-analytics';
import type {
  CanonicalPedagogicalModel,
  StudyDocumentAnalysis,
} from '@/lib/student-materials/types';
import type { Json } from '@/types/supabase';
import { aggregateAiUsageForMaterial } from '@/lib/student-materials/ai-usage';
import {
  buildPedagogicalArtifacts,
  PEDAGOGICAL_ARTIFACTS_VERSION,
} from '@/lib/student-materials/pedagogy';
import {
  buildStudentMaterialPedagogicalQualityReport,
  PEDAGOGICAL_QUALITY_REPORT_VERSION,
} from '@/lib/student-materials/quality';
import {
  buildCanonicalSourcePipelineVersion,
  CANONICAL_PEDAGOGICAL_MODEL_VERSION,
} from '@/lib/student-materials/processing-contract';

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

// Señal diagnóstica de complejidad. Incluso los documentos grandes deben
// terminar en el mismo contrato canónico; cambia el costo, no la representación.
const LARGE_NATIVE_PDF_MIN_PAGES = 31;
const LARGE_NATIVE_PDF_MIN_CHUNKS = 150;
const LARGE_NATIVE_PDF_MIN_TEXT_CHARS = 180_000;

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

  // Conservamos la última representación canónica válida durante un reprocesamiento.
  // Si un proveedor externo falla transitoriamente, podemos reutilizar ese modelo
  // para el mismo archivo sin volver a mostrar artefactos derivados obsoletos.
  const { data: previousCanonicalRow, error: previousCanonicalError } = await admin
    .from('student_materials')
    .select('pedagogical_model, pedagogical_model_version, content_fingerprint, pipeline_version')
    .eq('id', material.id)
    .maybeSingle();

  if (previousCanonicalError) {
    throw previousCanonicalError;
  }

  const previousPedagogicalModel =
    previousCanonicalRow?.pedagogical_model &&
    previousCanonicalRow.pedagogical_model_version ===
      CANONICAL_PEDAGOGICAL_MODEL_VERSION
      ? (previousCanonicalRow.pedagogical_model as unknown as CanonicalPedagogicalModel)
      : null;

  // Todo reprocesamiento invalida sólo las proyecciones derivadas. El modelo
  // canónico sólo se reutiliza más abajo si el hash del archivo y la versión
  // completa del pipeline coinciden exactamente.
  const { error: resetDerivedArtifactsError } = await admin
    .from('student_materials')
    .update({
      pedagogical_quality_report: null,
      pedagogical_quality_version: null,
      pedagogical_artifacts: null,
      pedagogical_artifacts_version: null,
    } as never)
    .eq('id', material.id);

  if (resetDerivedArtifactsError) {
    throw resetDerivedArtifactsError;
  }

  await updateStudentMaterialProcessing(admin, material.id, {
    processingStatus: 'processing',
    processingStage: 'extracting',
    processingProgress: 18,
    processingMessage: 'Analizando el PDF para clasificar su estructura y estrategia de lectura.',
  });

  const extractionStartedAt = Date.now();
  const context = await loadStudentMaterialProcessingContext(admin, material);
  const buffer = Buffer.from(await context.file.arrayBuffer());
  const contentFingerprint = createHash('sha256').update(buffer).digest('hex');
  const visualAnalysisEnabled =
    await isStudentMaterialVisualAnalysisEnabled(material.id);
  const canonicalPipelineVersion = buildCanonicalSourcePipelineVersion({
    visualAnalysisEnabled,
  });
  const {
    text: nativeText,
    pageCount,
    pages: nativePages,
  } = await extractPdfTextAndPageCount(buffer);
  const documentAnalysis = analyzePdfDocument(buffer, nativeText, pageCount);

  const selectedVisionPageNumbers = visualAnalysisEnabled
    ? selectVisionPageNumbers({
        analysis: documentAnalysis,
        pages: nativePages,
        pageCount,
      })
    : [];

  if (visualAnalysisEnabled && selectedVisionPageNumbers.length > 0) {
    await updateStudentMaterialProcessing(admin, material.id, {
      processingStatus: 'processing',
      processingStage: 'extracting',
      processingProgress: 27,
      processingMessage: documentAnalysis.requiresOcr
        ? 'Detectamos páginas escaneadas. Activamos lectura visual solo en las páginas necesarias.'
        : 'Detectamos páginas donde la estructura visual importa. Analizamos solo esas páginas para controlar el costo.',
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
  const isVeryLargeNativePdf =
    typeof pageCount === 'number' &&
    pageCount >= LARGE_NATIVE_PDF_MIN_PAGES &&
    (traceableChunks.length >= LARGE_NATIVE_PDF_MIN_CHUNKS ||
      text.length >= LARGE_NATIVE_PDF_MIN_TEXT_CHARS) &&
    !documentAnalysis.requiresOcr &&
    !visionUsed &&
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
    processingMessage: visionUsed
      ? `Lectura visual integrada en ${visionPageNumbers.length} ${visionPageNumbers.length === 1 ? 'página' : 'páginas'}. Ese contenido ya forma parte de la fuente académica del PDF.`
      : visualAnalysisEnabled && selectedVisionPageNumbers.length === 0
        ? 'No detectamos páginas que justifiquen análisis visual. Seguimos con el texto nativo sin costo visual adicional.'
        : visualAnalysisEnabled
          ? buildAnalysisMessage(documentAnalysis)
          : 'Procesamiento estándar: usamos únicamente la extracción nativa del PDF, sin análisis visual.',
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
    processingMessage: isVeryLargeNativePdf
      ? 'PDF de complejidad muy alta detectado. Construimos igualmente el modelo pedagógico canónico completo.'
      : visionUsed
        ? 'Construyendo el modelo pedagógico canónico desde texto y contenido visual recuperado.'
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
    // El PDF completo sólo puede llegar a un modelo multimodal cuando el
    // usuario activó explícitamente el análisis visual. En modo estándar no
    // existe fallback visual oculto ni costo de visión accidental.
    pdfBuffer:
      visualAnalysisEnabled && documentAnalysis.requiresOcr && !visionUsed
        ? buffer
        : undefined,
    materialId: material.id,
    userId: material.user_id,
  };

  if (isVeryLargeNativePdf) {
    logInfo('processStudentMaterial.largeDocument', {
      materialId: material.id,
      pageCount,
      pagesWithText,
      chunkCount: traceableChunks.length,
      strategy: 'canonical_large_document',
    });
  }

  let cachedPedagogicalModel: CanonicalPedagogicalModel | null = null;
  let reusedFromMaterialId: string | null = null;

  const previousCacheMatches =
    previousPedagogicalModel !== null &&
    previousCanonicalRow?.content_fingerprint === contentFingerprint &&
    previousCanonicalRow?.pipeline_version === canonicalPipelineVersion;

  if (previousCacheMatches) {
    cachedPedagogicalModel = previousPedagogicalModel;
    reusedFromMaterialId = material.id;
  } else {
    const { data: reusableCanonicalRow, error: reusableCanonicalError } = await admin
      .from('student_materials')
      .select('id, pedagogical_model')
      .eq('user_id', material.user_id)
      .eq('content_fingerprint', contentFingerprint)
      .eq('pipeline_version', canonicalPipelineVersion)
      .eq('pedagogical_model_version', CANONICAL_PEDAGOGICAL_MODEL_VERSION)
      .eq('processing_status', 'ready')
      .neq('id', material.id)
      .not('pedagogical_model', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (reusableCanonicalError) {
      logError('processStudentMaterial.pedagogicalModelCacheLookup', reusableCanonicalError, {
        materialId: material.id,
      });
    } else if (reusableCanonicalRow?.pedagogical_model) {
      cachedPedagogicalModel =
        reusableCanonicalRow.pedagogical_model as unknown as CanonicalPedagogicalModel;
      reusedFromMaterialId = reusableCanonicalRow.id;
    }
  }

  let generatedPedagogicalModel: CanonicalPedagogicalModel | null = null;
  let pedagogicalModelGenerationError: unknown = null;

  if (!cachedPedagogicalModel) {
    try {
      generatedPedagogicalModel = await generatePedagogicalModel(generationInput);
    } catch (modelGenerationError) {
      pedagogicalModelGenerationError = modelGenerationError;
      logError('processStudentMaterial.pedagogicalModelGeneration', modelGenerationError, {
        materialId: material.id,
      });
    }
  }

  const pedagogicalModel =
    cachedPedagogicalModel ?? generatedPedagogicalModel;

  if (!pedagogicalModel) {
    if (pedagogicalModelGenerationError) {
      throw pedagogicalModelGenerationError;
    }
    throw new Error(
      'No pudimos construir una representación académica completa del PDF. Reintentá el procesamiento.'
    );
  }

  try {
    const { error: pedagogicalModelPersistError } = await admin
      .from('student_materials')
      .update({
        pedagogical_model: pedagogicalModel as unknown as Json,
        pedagogical_model_version: CANONICAL_PEDAGOGICAL_MODEL_VERSION,
        content_fingerprint: contentFingerprint,
        pipeline_version: canonicalPipelineVersion,
        reused_from_material_id:
          reusedFromMaterialId && reusedFromMaterialId !== material.id
            ? reusedFromMaterialId
            : null,
      } as never)
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

  if (cachedPedagogicalModel) {
    logInfo('processStudentMaterial.pedagogicalModelCacheHit', {
      materialId: material.id,
      reusedFromMaterialId,
      version: CANONICAL_PEDAGOGICAL_MODEL_VERSION,
      pipelineVersion: canonicalPipelineVersion,
    });
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

  const pedagogicalArtifacts = buildPedagogicalArtifacts({
    summary,
    glossary,
    canonicalModel: pedagogicalModel,
    chunks: traceableChunks.map((chunk) => ({
      text: chunk.text,
      pageStart: chunk.pageStart,
      pageEnd: chunk.pageEnd,
      sectionTitle: chunk.sectionTitle,
      excerpt: '',
    })),
  });

  const pedagogicalQualityReport =
    buildStudentMaterialPedagogicalQualityReport({
      pageCount,
      pages,
      documentAnalysis,
      model: pedagogicalModel,
      summary,
      glossary,
      artifacts: pedagogicalArtifacts,
      visionUsed,
    });

  const { error: derivedArtifactsPersistError } = await admin
    .from('student_materials')
    .update({
      pedagogical_artifacts: pedagogicalArtifacts as unknown as Json,
      pedagogical_artifacts_version: PEDAGOGICAL_ARTIFACTS_VERSION,
      pedagogical_quality_report:
        pedagogicalQualityReport as unknown as Json,
      pedagogical_quality_version: PEDAGOGICAL_QUALITY_REPORT_VERSION,
    } as never)
    .eq('id', material.id);

  if (derivedArtifactsPersistError) {
    throw derivedArtifactsPersistError;
  }

  if (pedagogicalQualityReport.status === 'fail') {
    throw new Error(
      `El procesamiento no superó el control pedagógico (score ${pedagogicalQualityReport.score}).`
    );
  }

  await updateStudentMaterialProcessing(admin, material.id, {
    processingStatus: 'ready',
    processingStage: 'ready',
    processingProgress: 100,
    processingMessage:
      pedagogicalQualityReport.status === 'pass'
        ? 'Material listo para estudiar.'
        : 'Material listo para estudiar con cobertura pedagógica reducida.',
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
      large_document: isVeryLargeNativePdf,
      visual_analysis_enabled: visualAnalysisEnabled,
      visual_candidate_count: selectedVisionPageNumbers.length,
      vision_used: visionUsed,
      vision_page_count: visionPageNumbers.length,
      pedagogical_quality_status: pedagogicalQualityReport.status,
      pedagogical_quality_score: pedagogicalQualityReport.score,
      pedagogical_model_version: CANONICAL_PEDAGOGICAL_MODEL_VERSION,
      pedagogical_model_reused: Boolean(cachedPedagogicalModel),
      pedagogical_artifacts_version: PEDAGOGICAL_ARTIFACTS_VERSION,
      pedagogical_quality_version: PEDAGOGICAL_QUALITY_REPORT_VERSION,
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
    largeDocument: isVeryLargeNativePdf,
    visualAnalysisEnabled,
    visualCandidateCount: selectedVisionPageNumbers.length,
    visionUsed,
    visionPageCount: visionPageNumbers.length,
    visionModel: visionExtraction.visionModel,
    pedagogicalQualityStatus: pedagogicalQualityReport.status,
    pedagogicalQualityScore: pedagogicalQualityReport.score,
    pedagogicalModelCacheHit: Boolean(cachedPedagogicalModel),
    canonicalPipelineVersion,
    pedagogicalQualityVersion: PEDAGOGICAL_QUALITY_REPORT_VERSION,
    pedagogicalModelVersion: CANONICAL_PEDAGOGICAL_MODEL_VERSION,
    pedagogicalModelReused: !generatedPedagogicalModel,
    pedagogicalArtifactsVersion: PEDAGOGICAL_ARTIFACTS_VERSION,
    pedagogicalRepresentedPageRatio:
      pedagogicalQualityReport.representedPageRatio,
    pedagogicalArtifactCount:
      pedagogicalQualityReport.flashcardCount +
      pedagogicalQualityReport.questionCount,
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
