import type { AiUsage } from '@/lib/ai/providers';
import { logError } from '@/lib/observability';
import type { AdminClient } from '@/lib/student-materials/types';

export type AiUsageOperation =
  | 'source_vision'
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

type PendingAiUsageRow = {
  student_material_id: string;
  user_id: string | null;
  provider: string;
  model: string;
  operation: AiUsageOperation;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  total_tokens: number | null;
};

const pendingAiUsageByMaterial = new Map<string, PendingAiUsageRow[]>();

function hasAnyToken(usage?: AiUsage | null): boolean {
  if (!usage) return false;
  return (
    (usage.promptTokens !== null && usage.promptTokens !== undefined) ||
    (usage.completionTokens !== null && usage.completionTokens !== undefined) ||
    (usage.totalTokens !== null && usage.totalTokens !== undefined)
  );
}

/**
 * Acumula en memoria el consumo real de tokens de IA durante un procesamiento.
 * No hace I/O: los registros se insertan juntos al final cuando se agregan las
 * métricas del material. Mantiene la API async para no tocar los call sites.
 */
export async function recordAiUsage(input: AiUsageRecordInput): Promise<void> {
  if (!input.materialId || !input.usage || !hasAnyToken(input.usage)) {
    return;
  }

  const row: PendingAiUsageRow = {
    student_material_id: input.materialId,
    user_id: input.userId ?? null,
    provider: input.provider,
    model: input.model,
    operation: input.operation,
    prompt_tokens: input.usage.promptTokens ?? null,
    completion_tokens: input.usage.completionTokens ?? null,
    total_tokens: input.usage.totalTokens ?? null,
  };

  const pending = pendingAiUsageByMaterial.get(input.materialId);
  if (pending) {
    pending.push(row);
  } else {
    pendingAiUsageByMaterial.set(input.materialId, [row]);
  }
}

function isMissingTableError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const code = 'code' in error ? String((error as { code?: string }).code ?? '') : '';
  const message = 'message' in error ? String((error as { message?: string }).message ?? '') : '';
  return code === '42P01' || /student_material_ai_usage/i.test(message);
}

async function flushPendingAiUsageForMaterial(admin: AdminClient, materialId: string): Promise<void> {
  const pending = pendingAiUsageByMaterial.get(materialId);
  if (!pending || pending.length === 0) return;

  // Retiramos el lote antes del INSERT para que nunca se duplique si esta
  // función se invoca más de una vez para el mismo material.
  pendingAiUsageByMaterial.delete(materialId);

  try {
    const { error } = await admin
      .from('student_material_ai_usage' as never)
      .insert(pending as never);
    if (error) throw error;
  } catch (error) {
    if (!isMissingTableError(error)) {
      logError('studentMaterialAiUsage.flush', error, {
        materialId,
        recordCount: pending.length,
      });
    }
  }
}

/**
 * Agrega el consumo de tokens de IA registrado para un material. Antes de leer
 * las métricas hace un único INSERT batch con todos los consumos acumulados en
 * el procesamiento actual, evitando un round-trip a Supabase por llamada de IA.
 * Si la tabla no existe aun, devuelve valores nulos sin loguear error.
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
  await flushPendingAiUsageForMaterial(admin, materialId);

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
