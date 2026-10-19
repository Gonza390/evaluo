import 'server-only';
import { createAdminClient } from '@/lib/supabase-admin';
import { logError } from '@/lib/observability';
import type { PdfTopicEvidence } from './progress';

export type PdfAssessmentData = { items: PdfTopicEvidence[]; loadError?: boolean };

export async function getPdfAssessmentData(
  userId: string,
  materialId: string
): Promise<PdfAssessmentData> {
  try {
    const { data, error } = await createAdminClient().rpc('get_student_material_answer_coverage', {
      p_user_id: userId,
      p_material_id: materialId,
    });
    if (error) throw error;
    return {
      items: (data ?? []).map((row) => ({
        topic: row.topic,
        sectionTitle: row.section_title,
        correct: row.correct_count,
        incorrect: row.incorrect_count,
        selfReported: row.self_report_count,
        lastAnsweredAt: row.last_answered_at,
      })),
    };
  } catch (error) {
    logError('materialProgress.coverage', error, { userId, materialId });
    return { items: [], loadError: true };
  }
}
