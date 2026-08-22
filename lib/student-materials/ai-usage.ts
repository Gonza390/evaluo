import type { AiUsage } from '@/lib/ai/providers';
import { createAdminClient } from '@/lib/supabase-admin';
import { logError } from '@/lib/observability';
import type { AdminClient } from '@/lib/student-materials/types';

export type AiUsageOperation =
  | 'summary_map'
  | 'summary_reduce'
  | 'summary_canonical'
  | 'summary_pdf'
  | 'summary_vision'
  | 'glossary'
  | 'glossary_pdf'
  | 'glossary_vision'
  | 'chunk_evaluation';

export type AiUsageRecordInput = {
  materialId?: string | null;
  userId?: string | null;
  provider: string;
  model: string;
  operation: AiUsageOperation;
  usage?: AiUsage | null;
};

function hasAnyToken(usage?: AiUsage | null): boolean {
  if (!usage) return false;
  return (
    (usage.promptTokens !== null && usage.promptTokens !== undefined) ||
    (usage.completionTokens !== null && usage.completionTokens !== undefined) ||
    (usage.totalTokens !== null && usage.totalTokens !== undefined)
  );
}

/**
 * Persiste el consumo real de tokens de IA de un material de forma best-effort.
 * Si falta materialId o usage sin tokens, no hace nada. Ante cualquier error solo
 * loguea y no lanza, para nunca tumbar el pipeline de procesamiento.
 */
export async function recordAiUsage(input: AiUsageRecordInput): Promise<void> {
  if (!input.materialId || !input.usage || !hasAnyToken(input.usage)) {
    return;
  }

  let admin: AdminClient;
  try {
    admin = createAdminClient();
  } catch (error) {
    logError('studentMaterialAiUsage.record', error, {
      materialId: input.materialId,
      operation: input.operation,
    });
    return;
  }

  try {
    const { error } = await admin.from('student_material_ai_usage' as never).insert({
      student_material_id: input.materialId,
      user_id: input.userId ?? null,
      provider: input.provider,
      model: input.model,
      operation: input.operation,
      prompt_tokens: input.usage.promptTokens ?? null,
      completion_tokens: input.usage.completionTokens ?? null,
      total_tokens: input.usage.totalTokens ?? null,
    } as never);
    if (error) throw error;
  } catch (error) {
    logError('studentMaterialAiUsage.record', error, {
      materialId: input.materialId,
      operation: input.operation,
      provider: input.provider,
      model: input.model,
    });
  }
}

function isMissingTableError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const code = 'code' in error ? String((error as { code?: string }).code ?? '') : '';
  const message = 'message' in error ? String((error as { message?: string }).message ?? '') : '';
  return code === '42P01' || /student_material_ai_usage/i.test(message);
}

/**
 * Agrega el consumo de tokens de IA registrado para un material.
 * Si la tabla no existe aun (migracion pendiente), devuelve valores nulos sin
 * loguear error.
 */
export async function aggregateAiUsageForMaterial(
  admin: AdminClient,
  materialId: string
): Promise<{
  totalAiTokens: number | null;
  promptTokens: number | null;
  completionTokens: number | null;
  aiCallCount: number;
}> {
  try {
    const { data, error } = await admin
      .from('student_material_ai_usage' as never)
      .select('prompt_tokens, completion_tokens, total_tokens')
      .eq('student_material_id', materialId);
    if (error) throw error;

    const rows = (data ?? []) as Array<{
      prompt_tokens: number | null;
      completion_tokens: number | null;
      total_tokens: number | null;
    }>;

    let promptTokens = 0;
    let completionTokens = 0;
    let totalTokens = 0;
    for (const row of rows) {
      promptTokens += row.prompt_tokens ?? 0;
      completionTokens += row.completion_tokens ?? 0;
      totalTokens += row.total_tokens ?? 0;
    }

    return {
      totalAiTokens: totalTokens,
      promptTokens,
      completionTokens,
      aiCallCount: rows.length,
    };
  } catch (error) {
    if (!isMissingTableError(error)) {
      logError('studentMaterialAiUsage.aggregate', error, { materialId });
    }
    return { totalAiTokens: null, promptTokens: null, completionTokens: null, aiCallCount: 0 };
  }
}
