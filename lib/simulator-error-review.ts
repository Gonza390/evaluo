import 'server-only';

import { createAdminClient } from '@/lib/supabase-admin';
import { logError } from '@/lib/observability';

/**
 * Errores pendientes del simulador SEO (study_errors con source_type 'simulator').
 * Se usan para el repaso de errores y para la pantalla de resultado.
 * Acertar una pregunta en el repaso marca su error como resuelto
 * (ver `resolveWithoutReview` en `recordStudyErrorCorrect`).
 */
type PendingSimulatorError = { questionId: string; prompt: string };

/** El parcial 3 es el mixto (1 + 2): no filtra. */
function filtersByParcial(parcial: number | null | undefined): parcial is 1 | 2 {
  return parcial === 1 || parcial === 2;
}

export async function getPendingSimulatorErrors(
  userId: string,
  materiaId: string,
  parcial?: number | null
): Promise<PendingSimulatorError[]> {
  try {
    const admin = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = admin as any;
    const { data, error } = await db
      .from('study_errors')
      .select('question_id, prompt, failure_count, last_failed_at')
      .eq('user_id', userId)
      .eq('materia_id', materiaId)
      .eq('source_type', 'simulator')
      .eq('status', 'pending')
      .order('failure_count', { ascending: false })
      .order('last_failed_at', { ascending: false })
      .limit(200);
    if (error) throw error;

    let rows = ((data ?? []) as Array<{ question_id: string | null; prompt: string | null }>).filter(
      (row): row is { question_id: string; prompt: string | null } => Boolean(row.question_id)
    );
    if (filtersByParcial(parcial) && rows.length) {
      const { data: questions, error: questionError } = await admin
        .from('preguntas_banco')
        .select('id')
        .in('id', rows.map((row) => row.question_id))
        .eq('parcial', parcial);
      if (questionError) throw questionError;
      const allowed = new Set((questions ?? []).map((question) => question.id));
      rows = rows.filter((row) => allowed.has(row.question_id));
    }
    return rows.map((row) => ({ questionId: row.question_id, prompt: (row.prompt ?? '').trim() }));
  } catch (error) {
    logError('simulatorErrorReview.pending', error, { materiaId, parcial });
    return [];
  }
}

export async function getPendingSimulatorErrorQuestionIds(userId: string, materiaId: string) {
  const pending = await getPendingSimulatorErrors(userId, materiaId, null);
  return pending.slice(0, 60).map((row) => row.questionId);
}

/** Enunciados de las preguntas que falló en un intento (en el orden del banco). */
export async function getAttemptWrongPrompts(userId: string, attemptId: string, limit = 3) {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('simulator_attempt_wrong_questions')
      .select('pregunta_id')
      .eq('attempt_id', attemptId)
      .eq('user_id', userId)
      .not('pregunta_id', 'is', null)
      .limit(limit);
    if (error) throw error;
    const ids = (data ?? []).map((row) => row.pregunta_id).filter((id): id is string => Boolean(id));
    if (!ids.length) return [];
    const { data: questions, error: questionError } = await admin
      .from('preguntas_banco')
      .select('id, enunciado')
      .in('id', ids);
    if (questionError) throw questionError;
    const byId = new Map((questions ?? []).map((question) => [question.id, question.enunciado]));
    return ids.map((id) => (byId.get(id) ?? '').trim()).filter(Boolean);
  } catch (error) {
    logError('simulatorErrorReview.attemptWrongPrompts', error, { attemptId });
    return [];
  }
}

/** Unos 25 segundos por pregunta, con un mínimo de 1 minuto. */
export function estimateReviewMinutes(questionCount: number) {
  return Math.max(1, Math.round((Math.min(questionCount, 30) * 25) / 60));
}
