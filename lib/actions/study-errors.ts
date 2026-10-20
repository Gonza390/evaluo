'use server';

import { createAdminClient } from '@/lib/supabase-admin';
import { createClientServer } from '@/lib/supabase-server';
import { logError } from '@/lib/observability';
import { buildWrongAnswersExplanations } from '@/lib/simulator-wrong-answers';
import type { TutorQuickHelpKind } from '@/lib/ai-tutor';
import { generateReviewHelpAction } from '@/lib/actions/study-error-review';
import { hasPremiumAccess } from '@/lib/premium';
import { enforceStrictRateLimit } from '@/lib/rate-limit';
import { randomUUID } from 'node:crypto';
import { isUuid } from '@/lib/uuid';
import {
  resolveMaterialAnswer,
  type MaterialAnswerInput,
} from '@/lib/student-materials/answer-evidence';
import type { PedagogicalArtifacts } from '@/lib/student-materials/pedagogy';
import { sanitizePedagogicalArtifacts } from '@/lib/student-materials/pedagogical-integrity';
import type { StudySummarySection } from '@/lib/student-materials/types';
import { getPdfAssessmentData, type PdfAssessmentData } from '@/lib/student-materials/answer-events';

const FREE_STUDY_ERROR_EXPLANATIONS_LIMIT = 5;
const STUDY_ERROR_EXPLANATION_WINDOW_MS = 3 * 60 * 60 * 1000;
import {
  finishStudyErrorOnboarding,
  getPendingStudyErrorOnboarding,
  getStudyErrorsPageData,
  type StudyErrorsPageData,
  markStudyErrorReviewed,
  recordStudyErrorCorrect,
  recordStudyErrorFailure,
} from '@/lib/study-errors';

function safeText(value: string | null | undefined, max = 4000) {
  return (value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
}

async function requireUser() {
  const supabase = await createClientServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function recordStudentMaterialStudyResultAction(input: MaterialAnswerInput): Promise<{
  success: boolean;
  resolved?: boolean;
  errorId?: string | null;
  onboardingErrorId?: string | null;
}> {
  const user = await requireUser();
  if (!user) return { success: false };

  if (
    !input ||
    !isUuid(input.materialId) ||
    (input.resultId && !isUuid(input.resultId)) ||
    !['exercise', 'diagnostic', 'flashcard'].includes(input.sourceType) ||
    typeof input.wasCorrect !== 'boolean' ||
    typeof input.itemKey !== 'string' ||
    !input.itemKey ||
    input.itemKey.length > 300 ||
    typeof input.prompt !== 'string' ||
    !input.prompt ||
    input.prompt.length > 4000 ||
    (input.selectedAnswer != null &&
      (typeof input.selectedAnswer !== 'string' || input.selectedAnswer.length > 4000))
  ) {
    return { success: false };
  }

  try {
    const admin = createAdminClient();
    const rate = await enforceStrictRateLimit({
      key: `material-answer:${user.id}`,
      limit: 120,
      windowMs: 60_000,
    });
    if (!rate.allowed) return { success: false };
    const { data: material, error } = await admin
      .from('student_materials')
      .select('id, user_id, materia_id, pedagogical_artifacts')
      .eq('id', input.materialId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (error || !material) {
      if (error) {
        logError('studyErrors.materialResult.material', error, {
          userId: user.id,
          materialId: input.materialId,
        });
      }
      return { success: false };
    }

    const { data: summary, error: summaryError } = await admin
      .from('student_material_summaries')
      .select('summary_sections')
      .eq('student_material_id', material.id)
      .maybeSingle();
    if (summaryError || !material.pedagogical_artifacts) return { success: false };
    const sections = (summary?.summary_sections ?? []) as unknown as StudySummarySection[];
    const safeArtifacts = sanitizePedagogicalArtifacts(
      material.pedagogical_artifacts as unknown as PedagogicalArtifacts,
      sections
    );
    const canonical = resolveMaterialAnswer(input, safeArtifacts, sections);
    if (!canonical) return { success: false };
    const event = {
      id: input.resultId ?? randomUUID(),
      user_id: user.id,
      material_id: material.id,
      source_type: input.sourceType,
      evidence_kind: canonical.evidenceKind,
      item_key: input.itemKey,
      topic: canonical.topic?.slice(0, 500) ?? null,
      // El tema canónico evita que una referencia general contradiga la asociación validada.
      section_title: canonical.topic?.slice(0, 500) ?? null,
      prompt: canonical.prompt.slice(0, 4000),
      selected_answer: canonical.selectedAnswer,
      was_correct: canonical.wasCorrect,
    };
    const { data: inserted, error: insertError } = await admin
      .from('student_material_answer_events')
      .upsert(event, { onConflict: 'id', ignoreDuplicates: true })
      .select('id');
    if (insertError) throw insertError;
    if (!inserted?.length) {
      const { data: existing } = await admin
        .from('student_material_answer_events')
        .select('id, item_key, selected_answer')
        .eq('id', event.id)
        .eq('user_id', user.id)
        .eq('material_id', material.id)
        .maybeSingle();
      return {
        success: Boolean(
          existing &&
          existing.item_key === event.item_key &&
          existing.selected_answer === event.selected_answer
        ),
      };
    }
    const sourceKey = `${input.materialId}:${input.itemKey}`;

    if (canonical.wasCorrect) {
      const resolved = await recordStudyErrorCorrect({
        userId: user.id,
        sourceType: input.sourceType,
        sourceKey,
      });
      return { success: true, resolved };
    }

    const errorId = await recordStudyErrorFailure({
      userId: user.id,
      materiaId: material.materia_id,
      studentMaterialId: material.id,
      sourceType: input.sourceType,
      sourceKey,
      topic: safeText(canonical.topic, 500) || null,
      prompt: safeText(canonical.prompt),
      explanation: safeText(canonical.explanation),
      correctAnswer: safeText(canonical.correctAnswer),
      selectedAnswer: safeText(canonical.selectedAnswer),
      reference: {
        pageStart: canonical.reference?.pageStart ?? null,
        pageEnd: canonical.reference?.pageEnd ?? null,
        sectionTitle: safeText(canonical.topic, 500) || null,
        excerpt: safeText(canonical.reference?.excerpt, 1200) || null,
      },
    });

    const onboardingErrorId = errorId
      ? await getPendingStudyErrorOnboarding(user.id, errorId)
      : null;

    return { success: true, resolved: false, errorId: errorId ?? null, onboardingErrorId };
  } catch (error) {
    logError('studyErrors.materialResult', error, {
      userId: user.id,
      materialId: input.materialId,
      sourceType: input.sourceType,
    });
    return { success: false };
  }
}

export type MaterialProgressDataResult =
  | {
      success: true;
      data: StudyErrorsPageData;
      assessmentData: PdfAssessmentData;
      initialErrorId: string | null;
      onboardingErrorId: string | null;
    }
  | { success: false };

export async function getMaterialProgressDataAction(input: {
  materialId: string;
  requestedError?: string;
  tour?: string;
}): Promise<MaterialProgressDataResult> {
  const user = await requireUser();
  if (!user || !isUuid(input.materialId)) return { success: false };

  try {
    const admin = createAdminClient();
    const { data: material, error } = await admin
      .from('student_materials')
      .select('id')
      .eq('id', input.materialId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw error;
    if (!material) return { success: false };

    const [data, assessmentData] = await Promise.all([
      getStudyErrorsPageData(user.id, material.id),
      getPdfAssessmentData(user.id, material.id),
    ]);
    const requestedError =
      input.requestedError && isUuid(input.requestedError) ? input.requestedError : null;
    const initialErrorId =
      [...data.pending, ...data.resolved].find((item) => item.id === requestedError)?.id ?? null;
    const onboardingErrorId =
      input.tour === 'first-error' && initialErrorId
        ? await getPendingStudyErrorOnboarding(user.id, initialErrorId)
        : null;

    return {
      success: true,
      data: { ...data, materials: [] },
      assessmentData,
      initialErrorId,
      onboardingErrorId,
    };
  } catch (error) {
    logError('studyErrors.materialProgress', error, {
      userId: user.id,
      materialId: input.materialId,
    });
    return { success: false };
  }
}

export async function getMaterialPendingStudyErrorTopicCountAction(
  materialId: string
): Promise<{ count: number }> {
  const user = await requireUser();
  if (!user || !materialId) return { count: 0 };

  try {
    const admin = createAdminClient();
    // study_errors todavía no forma parte de los tipos generados.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = admin as any;
    const { data, error } = await db
      .from('study_errors')
      .select('topic')
      .eq('user_id', user.id)
      .eq('student_material_id', materialId)
      .eq('status', 'pending')
      .limit(300);

    if (error) throw error;

    const rows = (data ?? []) as Array<{ topic: string | null }>;
    const topics = new Set(
      rows.map((row) => safeText(row.topic, 180).toLocaleLowerCase('es-AR')).filter(Boolean)
    );

    return { count: topics.size || rows.length };
  } catch (error) {
    logError('studyErrors.materialPendingTopicCount', error, {
      userId: user.id,
      materialId,
    });
    return { count: 0 };
  }
}

export async function markStudyErrorReviewedAction(errorId: string): Promise<{ success: boolean }> {
  const user = await requireUser();
  if (!user || !errorId) return { success: false };

  const success = await markStudyErrorReviewed(user.id, errorId);
  return { success };
}

export async function getPendingStudyErrorOnboardingAction(): Promise<{
  errorId: string | null;
}> {
  const user = await requireUser();
  if (!user) return { errorId: null };

  return { errorId: await getPendingStudyErrorOnboarding(user.id) };
}

export async function finishStudyErrorOnboardingAction(
  errorId: string,
  outcome: 'completed' | 'skipped' | 'legacy'
): Promise<{ success: boolean }> {
  const user = await requireUser();
  if (!user || !errorId) return { success: false };

  const success = await finishStudyErrorOnboarding({
    userId: user.id,
    errorId,
    outcome,
  });

  return { success };
}

export async function generateStudyErrorExplanationAction(
  errorId: string
): Promise<{ success: boolean; explanation?: string; message?: string }> {
  const user = await requireUser();
  if (!user || !errorId) return { success: false, message: 'Sesión no válida.' };

  try {
    const admin = createAdminClient();
    // study_errors todavía no está en los tipos generados.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = admin as any;
    const { data: row, error } = await db
      .from('study_errors')
      .select('id, user_id, materia_id, question_id, source_type, status, explanation, metadata')
      .eq('id', errorId)
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .maybeSingle();

    if (error) throw error;
    if (!row || row.source_type !== 'simulator' || !row.question_id || !row.materia_id) {
      return { success: false, message: 'Este error no admite una explicación automática.' };
    }

    if (row.explanation) {
      return { success: true, explanation: row.explanation };
    }

    const parcialValue = Number(row.metadata?.parcial);
    const parcial = Number.isInteger(parcialValue) && parcialValue > 0 ? parcialValue : 1;

    const isPremium = await hasPremiumAccess(user.id);
    if (!isPremium) {
      const rate = await enforceStrictRateLimit({
        key: `study-errors:explanation:${user.id}`,
        limit: FREE_STUDY_ERROR_EXPLANATIONS_LIMIT,
        windowMs: STUDY_ERROR_EXPLANATION_WINDOW_MS,
      });

      if (!rate.allowed) {
        return {
          success: false,
          message:
            'Ya usaste las 5 explicaciones con IA incluidas en Free para este período. Podés revisar tu respuesta, estudiar con tus apuntes o volver cuando se renueve el límite.',
        };
      }
    }

    const { explanations, dailyLimitReached } = await buildWrongAnswersExplanations({
      materiaId: row.materia_id,
      parcial,
      wrongQuestionIds: [row.question_id],
      userId: user.id,
    });

    const explanation = explanations[0]?.explicacion;
    if (explanation) {
      return { success: true, explanation };
    }

    return {
      success: false,
      message: dailyLimitReached
        ? 'Alcanzaste el límite de explicaciones por hoy.'
        : 'No pudimos generar esta explicación ahora.',
    };
  } catch (error) {
    logError('studyErrors.generateExplanation', error, { userId: user.id, errorId });
    return { success: false, message: 'No pudimos generar esta explicación ahora.' };
  }
}

export async function generateStudyErrorQuickHelpAction(
  errorId: string,
  kind: TutorQuickHelpKind
): Promise<{ success: boolean; text?: string; message?: string }> {
  return generateReviewHelpAction(errorId, kind);
}
