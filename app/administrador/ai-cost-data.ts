'use server';

import { PINNED_GEMINI_SUMMARY_MODEL } from '@/lib/ai/providers';
import { requireAdminAccess } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-admin';

const USAGE_ROW_LIMIT = 10_000;
const GEMINI_INPUT_USD_PER_MILLION = 0.1;
const GEMINI_OUTPUT_USD_PER_MILLION = 0.4;

type UsageRow = {
  student_material_id: string;
  provider: string;
  model: string;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  total_tokens: number | null;
  created_at: string;
};

type MaterialRow = {
  id: string;
  page_count: number | null;
};

export type AdminPdfAiUsageWindow = {
  materials: number;
  pages: number;
  calls: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  tokensPerPage: number | null;
  tokensPerMaterial: number | null;
  paidEquivalentCostUsd: number;
};

export type AdminPdfAiUsageStats = {
  model: string;
  inputUsdPerMillion: number;
  outputUsdPerMillion: number;
  freeTierTokenCostUsd: number;
  allTime: AdminPdfAiUsageWindow;
  last7Days: AdminPdfAiUsageWindow;
  today: AdminPdfAiUsageWindow;
  otherProviderCalls: number;
  historicalModels: Array<{
    provider: string;
    model: string;
    calls: number;
    totalTokens: number;
  }>;
  lastUsageAt: string | null;
  truncated: boolean;
};

function getPaidEquivalentCostUsd(rows: UsageRow[]) {
  return rows.reduce((total, row) => {
    if (row.provider !== 'gemini') return total;

    const promptTokens = row.prompt_tokens ?? 0;
    const completionTokens = row.completion_tokens ?? 0;
    const totalTokens = row.total_tokens ?? promptTokens + completionTokens;
    const billedOutputTokens = Math.max(completionTokens, totalTokens - promptTokens);

    return (
      total +
      (promptTokens / 1_000_000) * GEMINI_INPUT_USD_PER_MILLION +
      (billedOutputTokens / 1_000_000) * GEMINI_OUTPUT_USD_PER_MILLION
    );
  }, 0);
}

function buildWindow(
  rows: UsageRow[],
  materialById: Map<string, MaterialRow>,
  since?: Date
): AdminPdfAiUsageWindow {
  const filteredRows = since
    ? rows.filter((row) => new Date(row.created_at).getTime() >= since.getTime())
    : rows;
  const materialIds = Array.from(new Set(filteredRows.map((row) => row.student_material_id)));
  const pages = materialIds.reduce(
    (total, materialId) => total + (materialById.get(materialId)?.page_count ?? 0),
    0
  );
  const promptTokens = filteredRows.reduce((total, row) => total + (row.prompt_tokens ?? 0), 0);
  const completionTokens = filteredRows.reduce(
    (total, row) => total + (row.completion_tokens ?? 0),
    0
  );
  const totalTokens = filteredRows.reduce((total, row) => total + (row.total_tokens ?? 0), 0);

  return {
    materials: materialIds.length,
    pages,
    calls: filteredRows.length,
    promptTokens,
    completionTokens,
    totalTokens,
    tokensPerPage: pages > 0 ? Math.round(totalTokens / pages) : null,
    tokensPerMaterial: materialIds.length > 0 ? Math.round(totalTokens / materialIds.length) : null,
    paidEquivalentCostUsd: getPaidEquivalentCostUsd(filteredRows),
  };
}

export async function obtenerConsumoPdfIAAdministrador(): Promise<{
  success: boolean;
  stats?: AdminPdfAiUsageStats;
  message?: string;
}> {
  try {
    await requireAdminAccess();
    const admin = createAdminClient();

    const { data: usageData, error: usageError } = await admin
      .from('student_material_ai_usage')
      .select(
        'student_material_id, provider, model, prompt_tokens, completion_tokens, total_tokens, created_at'
      )
      .order('created_at', { ascending: false })
      .limit(USAGE_ROW_LIMIT);

    if (usageError) throw usageError;

    const rows = (usageData ?? []) as UsageRow[];
    const materialIds = Array.from(new Set(rows.map((row) => row.student_material_id)));
    const materialsResult =
      materialIds.length > 0
        ? await admin.from('student_materials').select('id, page_count').in('id', materialIds)
        : { data: [], error: null };

    if (materialsResult.error) throw materialsResult.error;

    const materialById = new Map(
      ((materialsResult.data ?? []) as MaterialRow[]).map((material) => [material.id, material])
    );
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setUTCHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7);

    const modelMap = new Map<
      string,
      { provider: string; model: string; calls: number; totalTokens: number }
    >();
    for (const row of rows) {
      const key = `${row.provider}::${row.model}`;
      const current = modelMap.get(key) ?? {
        provider: row.provider,
        model: row.model,
        calls: 0,
        totalTokens: 0,
      };
      current.calls += 1;
      current.totalTokens += row.total_tokens ?? 0;
      modelMap.set(key, current);
    }

    return {
      success: true,
      stats: {
        model: PINNED_GEMINI_SUMMARY_MODEL,
        inputUsdPerMillion: GEMINI_INPUT_USD_PER_MILLION,
        outputUsdPerMillion: GEMINI_OUTPUT_USD_PER_MILLION,
        freeTierTokenCostUsd: 0,
        allTime: buildWindow(rows, materialById),
        last7Days: buildWindow(rows, materialById, sevenDaysAgo),
        today: buildWindow(rows, materialById, todayStart),
        otherProviderCalls: rows.filter((row) => row.provider !== 'gemini').length,
        historicalModels: Array.from(modelMap.values()).sort((a, b) => b.calls - a.calls),
        lastUsageAt: rows[0]?.created_at ?? null,
        truncated: rows.length >= USAGE_ROW_LIMIT,
      },
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'No pudimos calcular el consumo de IA de los materiales.',
    };
  }
}
