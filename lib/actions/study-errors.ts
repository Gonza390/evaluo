'use server';

import { createAdminClient } from '@/lib/supabase-admin';
import { createClientServer } from '@/lib/supabase-server';
import { logError } from '@/lib/observability';
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
