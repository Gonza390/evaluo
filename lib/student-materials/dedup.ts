import { createAdminClient } from '@/lib/supabase-admin';
import { logError } from '@/lib/observability';
import { normalizeForDedupe } from '@/lib/student-materials/text';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DedupResult = {
  isDuplicate: boolean;
  similarMaterialId?: string;
  similarity: number;
};

type CandidateRow = {
  id: string;
  title: string;
  user_id: string;
  materia_id: string;
};

// ---------------------------------------------------------------------------
// Token-level Jaccard similarity
// ---------------------------------------------------------------------------

function tokenize(text: string): Set<string> {
  return new Set(
    normalizeForDedupe(text)
      .split(' ')
      .filter((token) => token.length > 0)
  );
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  const intersection = [...a].filter((token) => b.has(token)).length;
  const union = new Set([...a, ...b]).size;
  return union > 0 ? intersection / union : 0;
}

/**
 * Similitud ponderada: combina Jaccard con una componente de longitud relativa
 * para penalizar documentos con tamanos muy diferentes (un fragmento corto
 * puede tener Jaccard alto con un documento largo que lo contiene).
 */
function weightedSimilarity(queryTokens: Set<string>, candidateTokens: Set<string>): number {
  const jaccard = jaccardSimilarity(queryTokens, candidateTokens);
  const sizeRatio = Math.min(queryTokens.size, candidateTokens.size) / Math.max(
    Math.max(queryTokens.size, 1),
    Math.max(candidateTokens.size, 1)
  );
  // 80% Jaccard, 20% size balance
  return jaccard * 0.8 + sizeRatio * 0.2;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

const DUPLICATE_THRESHOLD = 0.85;

/**
 * Verifica si un texto extraido es duplicado de un material existente del
 * mismo usuario en la misma materia.
 *
 * Utiliza similitud Jaccard ponderada sobre tokens normalizados. No rechaza
 * automaticamente: retorna la informacion para que el UI muestre un warning.
 *
 * @param content - Texto extraido del PDF a procesar.
 * @param materiaId - UUID de la materia.
 * @param userId - UUID del usuario que sube el material.
 * @param excludeMaterialId - UUID de un material a excluir de la comparacion (para re-procesamiento).
 * @returns DedupResult con el nivel de similitud y el material similar si existe.
 */
export async function checkDuplicate(
  content: string,
  materiaId: string,
  userId: string,
  excludeMaterialId?: string
): Promise<DedupResult> {
  const empty: DedupResult = { isDuplicate: false, similarity: 0 };

  if (!content || content.trim().length < 120) {
    return empty;
  }

  const admin = createAdminClient();
  const queryTokens = tokenize(content);

  // Fetch candidate materials from the same materia + user (or shared in materia)
  try {
    const { data: candidates, error } = await admin
      .from('student_materials')
      .select('id, title, user_id, materia_id')
      .eq('materia_id', materiaId)
      .eq('processing_status', 'ready')
      .or(`user_id.eq.${userId},visibility.eq.shared`)
      .order('updated_at', { ascending: false })
      .limit(30);

    if (error) throw error;

    if (!candidates || candidates.length === 0) {
      return empty;
    }

    const filteredCandidates = (candidates as CandidateRow[]).filter(
      (candidate) => !excludeMaterialId || candidate.id !== excludeMaterialId
    );

    if (filteredCandidates.length === 0) {
      return empty;
    }

    // For each candidate, fetch a sample of its chunks to compare
    const candidateIds = filteredCandidates.map((c) => c.id);
    const { data: chunkRows, error: chunkError } = await admin
      .from('student_material_chunks')
      .select('student_material_id, chunk_text')
      .in('student_material_id', candidateIds)
      .order('chunk_index', { ascending: true })
      .limit(candidateIds.length * 6);

    if (chunkError) throw chunkError;

    // Group chunks by material and concatenate for comparison
    const textByMaterial = new Map<string, string>();
    for (const row of (chunkRows ?? []) as Array<{
      student_material_id: string;
      chunk_text: string;
    }>) {
      const existing = textByMaterial.get(row.student_material_id) ?? '';
      textByMaterial.set(row.student_material_id, `${existing} ${row.chunk_text}`);
    }

    let bestSimilarity = 0;
    let bestMaterialId: string | undefined;

    for (const candidate of filteredCandidates) {
      const candidateText = textByMaterial.get(candidate.id);
      if (!candidateText) continue;

      const candidateTokens = tokenize(candidateText);
      const similarity = weightedSimilarity(queryTokens, candidateTokens);

      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestMaterialId = candidate.id;
      }
    }

    const roundedSimilarity = Math.round(bestSimilarity * 100) / 100;

    if (roundedSimilarity >= DUPLICATE_THRESHOLD && bestMaterialId) {
      logInfo('dedup.detected', {
        userId,
        materiaId,
        similarity: roundedSimilarity,
        candidateMaterialId: bestMaterialId,
      });
      return {
        isDuplicate: true,
        similarMaterialId: bestMaterialId,
        similarity: roundedSimilarity,
      };
    }

    return { isDuplicate: false, similarity: roundedSimilarity };
  } catch (error) {
    logError('dedup.check', error, { materiaId, userId });
    return empty;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function logInfo(scope: string, details?: Record<string, unknown>) {
  console.info(`[${scope}]`, details ?? {});
}
