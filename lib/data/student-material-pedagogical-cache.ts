import { buildPedagogicalArtifacts } from '@/lib/student-material-summary';
import { PEDAGOGICAL_ARTIFACTS_VERSION } from '@/lib/student-materials/pedagogy';
import { PEDAGOGICAL_QUALITY_REPORT_VERSION } from '@/lib/student-materials/quality';
import { analyzeQuestionBankCoverage } from '@/lib/student-materials/question-bank';
import { sanitizePedagogicalArtifacts } from '@/lib/student-materials/pedagogical-integrity';
import { groundedPracticeExplanation, type PracticePair } from '@/lib/student-materials/practice-modes';
import { logError } from '@/lib/observability';

export const CURRENT_PEDAGOGICAL_ARTIFACTS_VERSION = PEDAGOGICAL_ARTIFACTS_VERSION;

type BuildInput = Parameters<typeof buildPedagogicalArtifacts>[0];
type Artifacts = ReturnType<typeof buildPedagogicalArtifacts>;
type UntypedAdmin = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- CI unblock for PDF-first merge
  from: (table: string) => any;
};

/**
 * View-only editorial improvement. The original artifacts are kept intact in
 * Supabase and continue to serve as the source of truth for grading.
 */
function withGroundedExplanations(artifacts: Artifacts, glossary: BuildInput['glossary']): Artifacts {
  const pairs:PracticePair[] = glossary.map(item => ({
    term:item.term,definition:item.definition,chapterTitle:null,
    englishTerm:item.englishTerm ?? null,
  }));
  return {...artifacts,questions:artifacts.questions.map(question =>
    question.type === 'multiple_choice'
      ? {...question,explanation:groundedPracticeExplanation(question,pairs)}
      : question)};
}
type LoadInput = {
  admin: unknown;
  materialId: string;
  summary: BuildInput['summary'];
  glossary: BuildInput['glossary'];
};

export async function loadOrBuildPedagogicalArtifacts({
  admin,
  materialId,
  summary,
  glossary,
}: LoadInput): Promise<Artifacts> {
  const db = admin as UntypedAdmin;
  const { data: cachedRow, error: cachedError } = await db
    .from('student_materials')
    .select('pedagogical_artifacts, pedagogical_artifacts_version')
    .eq('id', materialId)
    .maybeSingle();

  if (
    !cachedError &&
    cachedRow?.pedagogical_artifacts_version === CURRENT_PEDAGOGICAL_ARTIFACTS_VERSION &&
    cachedRow?.pedagogical_artifacts
  ) {
    return withGroundedExplanations(sanitizePedagogicalArtifacts(cachedRow.pedagogical_artifacts as Artifacts, summary.sections),glossary);
  }

  const [{ data: sourceChunks, error: chunksError }, { data: modelRow, error: modelError }] =
    await Promise.all([
      db
        .from('student_material_chunks')
        .select('chunk_text, page_start, page_end, section_title')
        .eq('student_material_id', materialId)
        .order('chunk_index', { ascending: true }),
      db
        .from('student_materials')
        .select('pedagogical_model, page_count, pedagogical_quality_report')
        .eq('id', materialId)
        .maybeSingle(),
    ]);

  if (chunksError) throw chunksError;
  if (modelError) throw modelError;

  const canonicalModel = (modelRow?.pedagogical_model ?? null) as BuildInput['canonicalModel'];
  const artifacts = buildPedagogicalArtifacts({
    summary,
    glossary,
    canonicalModel,
    pageCount: typeof modelRow?.page_count === 'number' ? modelRow.page_count : null,
    chunks: (sourceChunks ?? []).map((chunk: {
      chunk_text: string;
      page_start: number | null;
      page_end: number | null;
      section_title: string | null;
    }) => ({
      text: chunk.chunk_text,
      pageStart: chunk.page_start,
      pageEnd: chunk.page_end,
      sectionTitle: chunk.section_title,
      excerpt: '',
    })),
  });

  // Cuando se reconstruye un banco anterior, refrescar también la medición
  // de cobertura de práctica. El score histórico de extracción se conserva.
  const previousQuality = modelRow?.pedagogical_quality_report;
  const rejectedQuestions = artifacts.integrity?.rejectedQuestions ?? 0;
  const rejectedFlashcards = artifacts.integrity?.rejectedFlashcards ?? 0;
  const hasUnsafeArtifacts = rejectedQuestions > 0 || rejectedFlashcards > 0;
  // Un reporte histórico de extracción (v4) nunca certificó que las
  // respuestas fueran correctas. No reetiquetar silenciosamente ese 100
  // como quality v5 sin una auditoría íntegra de las páginas originales.
  const requiresSemanticReaudit =
    // Los bancos v12 guardados antes de corregir el pipeline pueden tener
    // score=100 sin haber pasado por la validación semántica real.
    Number(cachedRow?.pedagogical_artifacts_version ?? 0) < CURRENT_PEDAGOGICAL_ARTIFACTS_VERSION ||
    Number(previousQuality?.version ?? 0) < PEDAGOGICAL_QUALITY_REPORT_VERSION;
  const downgraded = hasUnsafeArtifacts || requiresSemanticReaudit;
  const updatedQuality =
    previousQuality && typeof previousQuality === 'object' && !Array.isArray(previousQuality)
      ? {
          ...previousQuality,
          // No certificar una auditoría v6 usando el banco histórico: faltan
          // las páginas originales y las métricas independientes nuevas.
          version: Math.min(Number(previousQuality.version ?? 0), PEDAGOGICAL_QUALITY_REPORT_VERSION - 1),
          ...(downgraded ? {
            status: previousQuality.status === 'fail' ? 'fail' : 'degraded',
            score: Math.min(Number(previousQuality.score ?? 0) || 0, hasUnsafeArtifacts ? 59 : 79),
            pedagogicalDepthScore: hasUnsafeArtifacts
              ? Math.min(Number(previousQuality.pedagogicalDepthScore ?? 0) || 0, 49)
              : Number(previousQuality.pedagogicalDepthScore ?? 0) || 0,
          } : {}),
          semanticAudit: {
            rejectedQuestions,
            rejectedFlashcards,
            formulaicHigherOrderQuestions: 0,
            conceptsWithoutUniqueChapter: glossary.filter(item => !item.chapterTitle).length,
          },
          issues: [...new Set([
            ...(Array.isArray(previousQuality.issues) ? previousQuality.issues : []),
            ...(rejectedQuestions > 0 ? ['unsafe_model_answers_rejected'] : []),
            ...(rejectedFlashcards > 0 ? ['unsafe_flashcards_rejected'] : []),
            ...(requiresSemanticReaudit ? ['semantic_reaudit_pending'] : []),
          ])],
          practiceCoverage: analyzeQuestionBankCoverage(
            artifacts.questions,
            summary.sections,
            typeof modelRow?.page_count === 'number' ? modelRow.page_count : null
          ),
        }
      : null;
  // Las previews pueden apuntar al mismo Supabase que producción.
  // No reemplazar un banco persistido con el contrato experimental del branch:
  // el banco de preview se calcula para la vista actual, sin migrar datos.
  if (process.env.VERCEL_ENV === 'preview') return withGroundedExplanations(artifacts,glossary);

  const { error: persistError } = await db
    .from('student_materials')
    .update({
      pedagogical_artifacts: artifacts,
      pedagogical_artifacts_version: CURRENT_PEDAGOGICAL_ARTIFACTS_VERSION,
      ...(updatedQuality ? { pedagogical_quality_report: updatedQuality } : {}),
    })
    .eq('id', materialId);

  if (persistError) {
    logError('studentMaterial.pedagogicalArtifacts.persist', persistError);
  }

  return withGroundedExplanations(artifacts,glossary);
}
