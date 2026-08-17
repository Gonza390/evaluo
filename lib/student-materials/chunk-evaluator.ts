import { logError } from '@/lib/observability';
import { requestGroqJson } from '@/lib/ai/providers';
import { createAdminClient } from '@/lib/supabase-admin';
import { normalizeForDedupe } from '@/lib/student-materials/text';
import type { AdminClient } from '@/lib/student-materials/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SuggestedAction = 'keep' | 'split' | 'merge' | 'discard';

export type ChunkEvaluation = {
  chunkIndex: number;
  score: number;
  issues: string[];
  suggestedAction: SuggestedAction;
};

type RawLlmEvaluation = {
  score?: number;
  issues?: string[];
  suggested_action?: string;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MIN_CHUNK_LENGTH = 50;
const MAX_CHUNK_LENGTH = 2000;
const DUPLICATE_OVERLAP_THRESHOLD = 0.85;

const PEDAGOGIC_SIGNALS =
  /(?:definici[oó]n|concepto|principio|teor[ií]a|clasificaci[oó]n|ejemplo|ejercicio|proceso|modelo|etapa|fase|componente|caracter[ií]stica|funci[oó]n|m[eé]todo|an[aá]lisis|clasificaci[oó]n|regla|norma|criterio|implicancia|conclusi[oó]n|resultado|hip[oó]tesis|variable|fórmula|ecuaci[oó]n|ley|postulado)/i;

const NOISE_PATTERNS =
  /^(?:\d+\s*(?:de|\/)\s*\d+|(?:page|pagina|pag\.?)\s*\d+|(?:www\.|https?:\/\/)|[^\s]+@[^\s]+\.[^\s]+|lOMoAR|Descargado por)/i;

// ---------------------------------------------------------------------------
// Heuristic evaluation
// ---------------------------------------------------------------------------

function evaluateHeuristics(chunk: string, allChunks: string[]): {
  score: number;
  issues: string[];
  suggestedAction: SuggestedAction;
} {
  const issues: string[] = [];
  let penalty = 0;

  // --- Length checks ---
  if (chunk.length < MIN_CHUNK_LENGTH) {
    issues.push(`Chunk muy corto (${chunk.length} chars, minimo ${MIN_CHUNK_LENGTH})`);
    penalty += 0.35;
  } else if (chunk.length > MAX_CHUNK_LENGTH) {
    issues.push(`Chunk muy largo (${chunk.length} chars, maximo recomendado ${MAX_CHUNK_LENGTH})`);
    penalty += 0.15;
  }

  // --- Noise detection ---
  const lines = chunk
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const noiseLineCount = lines.filter((line) => NOISE_PATTERNS.test(line)).length;
  if (lines.length > 0 && noiseLineCount / lines.length > 0.4) {
    issues.push('Mayoritariamente ruido (emails, URLs, numeros de pagina)');
    penalty += 0.4;
  }

  // --- Pedagogical content ---
  const hasPedagogicSignal = PEDAGOGIC_SIGNALS.test(chunk);
  if (!hasPedagogicSignal && chunk.length > 200) {
    issues.push('Sin senales pedagogicas detectadas (definiciones, conceptos, ejemplos)');
    penalty += 0.1;
  }

  // --- Coherence: mostly non-letter characters or single repeated word ---
  const letterRatio =
    chunk.length > 0
      ? (chunk.match(/[\p{L}]/gu)?.length ?? 0) / chunk.length
      : 0;
  if (letterRatio < 0.5) {
    issues.push('Baja proporcion de caracteres con sentido (posible ruido de formato)');
    penalty += 0.25;
  }

  // --- Duplicate detection within the same material ---
  const normalized = normalizeForDedupe(chunk);
  let duplicateCount = 0;
  for (let i = 0; i < allChunks.length; i++) {
    if (normalizeForDedupe(allChunks[i] ?? '') === normalized) {
      duplicateCount += 1;
    }
  }
  if (duplicateCount > 1) {
    issues.push(`Chunk duplicado ${duplicateCount} veces dentro del mismo material`);
    penalty += 0.2;
  } else {
    // Check high-overlap duplicates (token Jaccard > 0.85)
    const chunkTokens = new Set(normalized.split(' ').filter(Boolean));
    for (let i = 0; i < allChunks.length; i++) {
      if (normalizeForDedupe(allChunks[i] ?? '') === normalized) continue;
      const otherTokens = new Set(
        normalizeForDedupe(allChunks[i] ?? '')
          .split(' ')
          .filter(Boolean)
      );
      const union = new Set([...chunkTokens, ...otherTokens]);
      const intersection = [...chunkTokens].filter((t) => otherTokens.has(t)).length;
      if (union.size > 0 && intersection / union.size >= DUPLICATE_OVERLAP_THRESHOLD) {
        duplicateCount += 1;
      }
    }
    if (duplicateCount > 0) {
      issues.push('Chunk casi duplicado (alta similitud Jaccard con otro chunk)');
      penalty += 0.15;
    }
  }

  // --- Determine suggested action ---
  let suggestedAction: SuggestedAction = 'keep';
  if (chunk.length < MIN_CHUNK_LENGTH) {
    suggestedAction = 'discard';
  } else if (chunk.length > MAX_CHUNK_LENGTH) {
    suggestedAction = 'split';
  } else if (duplicateCount > 1) {
    suggestedAction = 'merge';
  }

  const rawScore = Math.max(0, Math.min(1, 1 - penalty));
  return { score: Math.round(rawScore * 100) / 100, issues, suggestedAction };
}

// ---------------------------------------------------------------------------
// LLM evaluation (batch, cheapest provider)
// ---------------------------------------------------------------------------

const EVAL_SYSTEM_PROMPT =
  'Sos un evaluador de calidad de fragmentos de texto para material de estudio universitario. Responde unicamente con JSON valido.';

const EVAL_PROMPT_TEMPLATE = (
  chunks: Array<{ index: number; text: string }>,
  materia: string
) =>
  [
    `Evalua la calidad pedagogica de ${chunks.length} fragmentos de texto para la materia "${materia}".`,
    'Para cada fragmento, asigna un score entre 0 y 1, lista los problemas encontrados, y sugiere una accion:',
    '- "keep": el chunk es util y esta bien formado.',
    '- "split": el chunk es demasiado largo o mezcla temas.',
    '- "merge": el chunk deberia combinarse con otro.',
    '- "discard": el chunk es ruido, muy corto, o no tiene valor pedagogico.',
    '',
    'Criterios:',
    '- El chunk debe contener contenido academico util (definiciones, conceptos, procesos, etc.).',
    '- El chunk debe ser coherente por si mismo (entenderse sin contexto adicional).',
    '- Chunks con solo ruido (emails, URLs, numeros de pagina) deben puntuarse bajo.',
    '',
    'Formato de salida:',
    '{"evaluations":[{"index":0,"score":0.85,"issues":["..."],"suggested_action":"keep"}]}',
    '',
    'Fragmentos:',
    ...chunks.map((c) => `--- Fragmento ${c.index} ---\n${c.text}`),
  ].join('\n');

async function evaluateChunksWithLlm(
  chunks: Array<{ index: number; text: string }>,
  materia: string
): Promise<Map<number, { score: number; issues: string[]; suggestedAction: SuggestedAction }>> {
  const resultMap = new Map<number, { score: number; issues: string[]; suggestedAction: SuggestedAction }>();

  // Batch chunks to avoid overly large prompts (max 8 per call)
  const batchSize = 8;
  for (let batchStart = 0; batchStart < chunks.length; batchStart += batchSize) {
    const batch = chunks.slice(batchStart, batchStart + batchSize);
    const prompt = EVAL_PROMPT_TEMPLATE(batch, materia);

    try {
      const result = await requestGroqJson({
        prompt,
        system: EVAL_SYSTEM_PROMPT,
        temperature: 0.05,
        maxTokens: 1200,
      });

      if (!result) continue;

      const parsed = (() => {
        try {
          return JSON.parse(result.content) as Record<string, unknown>;
        } catch {
          return null;
        }
      })();

      if (!parsed) continue;

      const evaluations = Array.isArray(parsed.evaluations) ? parsed.evaluations : [];
      for (const eval_ of evaluations) {
        if (!eval_ || typeof eval_ !== 'object') continue;
        const record = eval_ as RawLlmEvaluation;
        const index = typeof (eval_ as Record<string, unknown>).index === 'number'
          ? ((eval_ as Record<string, unknown>).index as number)
          : -1;
        if (index < 0) continue;

        const score = typeof record.score === 'number' ? Math.max(0, Math.min(1, record.score)) : 0.5;
        const issues = Array.isArray(record.issues)
          ? record.issues.filter((i): i is string => typeof i === 'string')
          : [];
        const actionRaw = typeof record.suggested_action === 'string' ? record.suggested_action : 'keep';
        const suggestedAction: SuggestedAction =
          actionRaw === 'split' || actionRaw === 'merge' || actionRaw === 'discard'
            ? actionRaw
            : 'keep';

        const globalIndex = batchStart + index;
        resultMap.set(globalIndex, { score, issues, suggestedAction });
      }
    } catch (error) {
      logError('chunkEvaluator.llm', error, { materia, batchStart });
    }
  }

  return resultMap;
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

function isMissingTableError(error: unknown) {
  if (!error || typeof error !== 'object') return false;
  const code = 'code' in error ? String((error as { code?: string }).code ?? '') : '';
  const message = 'message' in error ? String((error as { message?: string }).message ?? '') : '';
  return code === '42P01' || /chunk_quality_log/i.test(message);
}

async function persistEvaluations(
  admin: AdminClient,
  materialId: string,
  evaluations: ChunkEvaluation[]
) {
  if (evaluations.length === 0) return;

  const rows = evaluations.map((evaluation) => ({
    material_id: materialId,
    chunk_index: evaluation.chunkIndex,
    score: evaluation.score,
    issues: evaluation.issues,
    suggested_action: evaluation.suggestedAction,
  }));

  try {
    const { error } = await admin.from('chunk_quality_log' as never).insert(rows as never);
    if (error) throw error;
  } catch (error) {
    if (!isMissingTableError(error)) {
      logError('chunkEvaluator.persist', error, { materialId });
    }
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Evalua la calidad pedagogica de cada chunk generado para un material.
 *
 * Combina reglas heuristicas (longitud, ruido, duplicados) con evaluacion LLM
 * para detectar chunks de baja calidad, sin eliminarlos automaticamente.
 *
 * @param chunks - Texto de cada chunk generado.
 * @param materia - Nombre de la materia para contexto LLM.
 * @param materialId - UUID del material (para persistir el log). Opcional.
 * @returns Array de evaluaciones una por chunk.
 */
export async function evaluateChunks(
  chunks: string[],
  materia: string,
  materialId?: string
): Promise<ChunkEvaluation[]> {
  if (chunks.length === 0) return [];

  // Phase 1: heuristic evaluation for every chunk
  const heuristicResults = chunks.map((chunk, index) => ({
    index,
    ...evaluateHeuristics(chunk, chunks),
  }));

  // Phase 2: LLM evaluation for pedagogical quality (skip very short chunks
  // that will likely be discarded anyway).
  const llmCandidates = heuristicResults
    .filter((result) => result.suggestedAction !== 'discard')
    .map((result) => ({ index: result.index, text: chunks[result.index] ?? '' }));

  let llmResults = new Map<number, { score: number; issues: string[]; suggestedAction: SuggestedAction }>();
  if (llmCandidates.length > 0) {
    try {
      llmResults = await evaluateChunksWithLlm(llmCandidates, materia);
    } catch (error) {
      logError('chunkEvaluator.llmPhase', error, { materia, materialId });
    }
  }

  // Phase 3: merge heuristic + LLM results (average score, union of issues,
  // stricter action wins).
  const ACTION_SEVERITY: Record<SuggestedAction, number> = {
    keep: 0,
    merge: 1,
    split: 2,
    discard: 3,
  };

  const evaluations: ChunkEvaluation[] = heuristicResults.map((heuristic) => {
    const llm = llmResults.get(heuristic.index);
    if (!llm) {
      return {
        chunkIndex: heuristic.index,
        score: heuristic.score,
        issues: heuristic.issues,
        suggestedAction: heuristic.suggestedAction,
      };
    }

    const mergedScore = Math.round(((heuristic.score + llm.score) / 2) * 100) / 100;
    const mergedIssues = [...new Set([...heuristic.issues, ...llm.issues])];
    const stricterAction =
      ACTION_SEVERITY[llm.suggestedAction] > ACTION_SEVERITY[heuristic.suggestedAction]
        ? llm.suggestedAction
        : heuristic.suggestedAction;

    return {
      chunkIndex: heuristic.index,
      score: mergedScore,
      issues: mergedIssues,
      suggestedAction: stricterAction,
    };
  });

  // Phase 4: persist log (best-effort, never blocks the pipeline).
  if (materialId) {
    try {
      const admin = createAdminClient();
      await persistEvaluations(admin, materialId, evaluations);
    } catch (error) {
      logError('chunkEvaluator.persistPhase', error, { materialId });
    }
  }

  return evaluations;
}

/**
 * Genera un reporte legible de las evaluaciones de chunks.
 */
export function buildChunkEvaluationReport(evaluations: ChunkEvaluation[]): {
  totalChunks: number;
  averageScore: number;
  actionCounts: Record<SuggestedAction, number>;
  flaggedChunks: Array<{ index: number; score: number; issues: string[]; action: SuggestedAction }>;
} {
  const actionCounts: Record<SuggestedAction, number> = {
    keep: 0,
    split: 0,
    merge: 0,
    discard: 0,
  };

  let totalScore = 0;
  const flaggedChunks: Array<{
    index: number;
    score: number;
    issues: string[];
    action: SuggestedAction;
  }> = [];

  for (const evaluation of evaluations) {
    totalScore += evaluation.score;
    actionCounts[evaluation.suggestedAction] += 1;

    if (evaluation.suggestedAction !== 'keep' || evaluation.score < 0.6) {
      flaggedChunks.push({
        index: evaluation.chunkIndex,
        score: evaluation.score,
        issues: evaluation.issues,
        action: evaluation.suggestedAction,
      });
    }
  }

  return {
    totalChunks: evaluations.length,
    averageScore: evaluations.length > 0
      ? Math.round((totalScore / evaluations.length) * 100) / 100
      : 0,
    actionCounts,
    flaggedChunks,
  };
}
