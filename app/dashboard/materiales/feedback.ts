'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { logError } from '@/lib/observability';
import { createClientServer } from '@/lib/supabase-server';
import { enforceServerActionRateLimit, getServerActionClientKey } from '@/lib/rate-limit';
import {
  getStudentMaterialFeedback,
  getStudentMaterialFeedbackSummary,
  isValidFeedbackRating,
  isValidFeedbackReason,
  submitStudentMaterialFeedback,
  type StudentMaterialFeedbackSummary,
} from '@/lib/student-material-feedback';

const FEEDBACK_RATE_LIMIT_PER_MINUTE = 20;
const FEEDBACK_RATE_WINDOW_MS = 60_000;

const feedbackInputSchema = z.object({
  materialId: z.string().uuid(),
  rating: z.enum(['up', 'down']),
  reportReason: z.string().max(160).nullable().optional(),
  reportNote: z.string().max(500).nullable().optional(),
});

export type MaterialFeedbackResult = {
  success: boolean;
  message: string;
  rating?: 'up' | 'down' | null;
  counts?: StudentMaterialFeedbackSummary;
};

export type MyMaterialFeedbackResult = {
  success: boolean;
  feedback: {
    id: string;
    rating: 'up' | 'down';
    report_reason: string | null;
    report_note: string | null;
    created_at: string;
    updated_at: string;
  } | null;
  counts: StudentMaterialFeedbackSummary;
};

async function requireAuthenticatedUser() {
  const supabase = await createClientServer();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('Inicia sesión para calificar el material.');
  }

  return user;
}

export async function submitMaterialFeedbackAction(input: {
  materialId: string;
  rating: string;
  reportReason?: string | null;
  reportNote?: string | null;
}): Promise<MaterialFeedbackResult> {
  try {
    const parsed = feedbackInputSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, message: 'Los datos del feedback no son validos.' };
    }

    const user = await requireAuthenticatedUser();
    const clientKey = await getServerActionClientKey();
    const rateLimit = await enforceServerActionRateLimit({
      key: `feedback:${clientKey}`,
      limit: FEEDBACK_RATE_LIMIT_PER_MINUTE,
      windowMs: FEEDBACK_RATE_WINDOW_MS,
    });
    if (!rateLimit.allowed) {
      return {
        success: false,
        message: 'Estas enviando demasiados comentarios. Espera un momento y reintenta.',
      };
    }

    const reportReason = parsed.data.reportReason ?? null;
    await submitStudentMaterialFeedback({
      userId: user.id,
      studentMaterialId: parsed.data.materialId,
      rating: parsed.data.rating,
      reportReason: isValidFeedbackReason(reportReason) ? reportReason : null,
      reportNote: parsed.data.reportNote ?? null,
    });

    const counts = await getStudentMaterialFeedbackSummary(parsed.data.materialId);
    revalidatePath('/dashboard/materiales');

    return {
      success: true,
      message: 'Gracias por tu feedback.',
      rating: parsed.data.rating,
      counts,
    };
  } catch (error) {
    logError('studentMaterials.feedback', error, { materialId: input.materialId });
    return { success: false, message: 'No pudimos guardar tu feedback en este momento.' };
  }
}

export async function getMyMaterialFeedbackAction(
  materialId: string
): Promise<MyMaterialFeedbackResult> {
  try {
    const user = await requireAuthenticatedUser();
    const feedback = await getStudentMaterialFeedback({
      userId: user.id,
      studentMaterialId: materialId,
    });
    const counts = await getStudentMaterialFeedbackSummary(materialId);

    if (!feedback) {
      return { success: true, feedback: null, counts };
    }

    return {
      success: true,
      feedback: {
        id: feedback.id,
        rating: isValidFeedbackRating(feedback.rating) ? feedback.rating : 'down',
        report_reason: feedback.report_reason,
        report_note: feedback.report_note,
        created_at: feedback.created_at,
        updated_at: feedback.updated_at,
      },
      counts,
    };
  } catch (error) {
    logError('studentMaterials.feedbackRead', error, { materialId });
    return { success: false, feedback: null, counts: { up: 0, down: 0, reports: 0 } };
  }
}
