'use server';

import { createAdminClient } from '@/lib/supabase-admin';
import { createClientServer } from '@/lib/supabase-server';
import { logError } from '@/lib/observability';
import { buildWrongAnswersExplanations } from '@/lib/simulator-wrong-answers';
import {
  markStudyErrorReviewed,
  recordStudyErrorCorrect,
  recordStudyErrorFailure,
  type StudyErrorSource,
} from '@/lib/study-errors';

type StudentMaterialSource = Extract<StudyErrorSource, 'flashcard' | 'exercise' | 'diagnostic'>;

type StudentMaterialStudyResultInput = {
  materialId: string;
  sourceType: StudentMaterialSource;
  itemKey: string;
  wasCorrect: boolean;
  topic?: string | null;
  prompt: string;
  explanation?: string | null;
  correctAnswer?: string | null;
  selectedAnswer?: string | null;
  reference?: {
    pageStart?: number | null;
    pageEnd?: number | null;
    sectionTitle?: string | null;
    excerpt?: string | null;
  } | null;
};

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

export async function recordStudentMaterialStudyResultAction(
  input: StudentMaterialStudyResultInput
): Promise<{ success: boolean; resolved?: boolean }> {
  const user = await requireUser();
  if (!user) return { success: false };

  if (!input.materialId || !input.itemKey || !input.prompt) {
    return { success: false };
  }

  try {
    const admin = createAdminClient();
    const { data: material, error } = await admin
      .from('student_materials')
      .select('id, user_id, materia_id')
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

    const sourceKey = `${input.materialId}:${input.itemKey}`;

    if (input.wasCorrect) {
      const resolved = await recordStudyErrorCorrect({
        userId: user.id,
        sourceType: input.sourceType,
        sourceKey,
      });
      return { success: true, resolved };
    }

    await recordStudyErrorFailure({
      userId: user.id,
      materiaId: material.materia_id,
      studentMaterialId: material.id,
      sourceType: input.sourceType,
      sourceKey,
      topic: safeText(input.topic, 180) || null,
      prompt: safeText(input.prompt),
      explanation: safeText(input.explanation),
      correctAnswer: safeText(input.correctAnswer),
      selectedAnswer: safeText(input.selectedAnswer),
      reference: {
        pageStart: input.reference?.pageStart ?? null,
        pageEnd: input.reference?.pageEnd ?? null,
        sectionTitle: safeText(input.reference?.sectionTitle, 240) || null,
        excerpt: safeText(input.reference?.excerpt, 1200) || null,
      },
    });

    return { success: true, resolved: false };
  } catch (error) {
    logError('studyErrors.materialResult', error, {
      userId: user.id,
      materialId: input.materialId,
      sourceType: input.sourceType,
    });
    return { success: false };
  }
}

export async function markStudyErrorReviewedAction(
  errorId: string
): Promise<{ success: boolean }> {
  const user = await requireUser();
  if (!user || !errorId) return { success: false };

  const success = await markStudyErrorReviewed(user.id, errorId);
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
