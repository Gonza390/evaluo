import { createAdminClient } from '@/lib/supabase-admin';

const FEEDBACK_RATINGS = ['up', 'down'] as const;
export type StudentMaterialFeedbackRating = (typeof FEEDBACK_RATINGS)[number];

const FEEDBACK_REASONS = [
  'resumen incorrecto',
  'informacion inventada',
  'falta contenido',
  'glosario erroneo',
  'error de extraccion',
  'otro',
] as const;
export type StudentMaterialFeedbackReason = (typeof FEEDBACK_REASONS)[number];

export const MAX_REPORT_NOTE_CHARS = 500;

export type StudentMaterialFeedbackSummary = {
  up: number;
  down: number;
  reports: number;
};

export function isValidFeedbackRating(value: unknown): value is StudentMaterialFeedbackRating {
  return typeof value === 'string' && (FEEDBACK_RATINGS as readonly string[]).includes(value);
}

export function isValidFeedbackReason(value: unknown): value is StudentMaterialFeedbackReason {
  return typeof value === 'string' && (FEEDBACK_REASONS as readonly string[]).includes(value);
}

export async function submitStudentMaterialFeedback(input: {
  userId: string;
  studentMaterialId: string;
  rating: StudentMaterialFeedbackRating;
  reportReason?: StudentMaterialFeedbackReason | null;
  reportNote?: string | null;
}) {
  const admin = createAdminClient();
  const reportNote = cleanReportNote(input.reportNote);

  const { data, error } = await admin
    .from('student_material_feedback')
    .upsert(
      {
        user_id: input.userId,
        student_material_id: input.studentMaterialId,
        rating: input.rating,
        report_reason: input.reportReason ?? null,
        report_note: reportNote,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,student_material_id' }
    )
    .select('id, rating, report_reason, report_note')
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function getStudentMaterialFeedback(input: {
  userId: string;
  studentMaterialId: string;
}) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('student_material_feedback')
    .select('id, rating, report_reason, report_note, created_at, updated_at')
    .eq('user_id', input.userId)
    .eq('student_material_id', input.studentMaterialId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function getStudentMaterialFeedbackSummary(
  studentMaterialId: string
): Promise<StudentMaterialFeedbackSummary> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('student_material_feedback')
    .select('rating, report_reason')
    .eq('student_material_id', studentMaterialId);

  if (error) {
    throw error;
  }

  const rows = data ?? [];
  return {
    up: rows.filter((row) => row.rating === 'up').length,
    down: rows.filter((row) => row.rating === 'down').length,
    reports: rows.filter((row) => row.report_reason !== null).length,
  };
}

function cleanReportNote(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const cleaned = value.trim().slice(0, MAX_REPORT_NOTE_CHARS);
  return cleaned || null;
}
