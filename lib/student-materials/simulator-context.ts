import { normalizeText, scoreChunk, type RagChunkRow } from '@/lib/rag';
import type { Database } from '@/types/supabase';
import type { AdminClient, StoredSummaryRow } from '@/lib/student-materials/types';

type StudentMaterialRow = Pick<
  Database['public']['Tables']['student_materials']['Row'],
  | 'id'
  | 'user_id'
  | 'materia_id'
  | 'carrera_id'
  | 'universidad_id'
  | 'title'
  | 'visibility'
  | 'processing_status'
>;

type StudentMaterialChunkRow = {
  student_material_id: string;
  chunk_text: string;
};

type QuestionContextInput = {
  id: string;
  enunciado: string;
  respuesta_correcta: string;
  opciones: unknown;
  material_id?: string | null;
  carrera_id?: string | null;
  universidad_id?: string | null;
};

type MaterialSummarySource = {
  studentMaterialId: string;
  shortSummary: string;
  keyPoints: string[];
  sections: Array<{ title: string; body: string }>;
};

export type StudentMaterialQuestionContext = {
  context: string[];
  matchedMaterialIds: string[];
};

function cleanLine(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function parseKeyPoints(value: StoredSummaryRow['key_points']) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => cleanLine(String(item ?? '')))
    .filter(Boolean)
    .slice(0, 5);
}

function parseSections(value: StoredSummaryRow['summary_sections']) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
      const title = 'title' in item ? cleanLine(String(item.title ?? '')) : '';
      const body = 'body' in item ? String(item.body ?? '').trim() : '';
      if (!body) return null;
      return {
        title: title || 'Seccion',
        body: body.replace(/\s+\n/g, '\n').trim(),
      };
    })
    .filter((item): item is { title: string; body: string } => Boolean(item))
    .slice(0, 4);
}

function buildSummarySources(rows: Array<StoredSummaryRow & { student_material_id: string }>) {
  return rows.map((row) => ({
    studentMaterialId: row.student_material_id,
    shortSummary: cleanLine(row.summary_short ?? ''),
    keyPoints: parseKeyPoints(row.key_points),
    sections: parseSections(row.summary_sections),
  }));
}

function serializeSummarySource(summary: MaterialSummarySource, title: string) {
  const parts: string[] = [];

  if (summary.shortSummary) {
    parts.push(`[${title}] Resumen breve: ${summary.shortSummary}`);
  }

  if (summary.keyPoints.length > 0) {
    parts.push(`[${title}] Puntos clave: ${summary.keyPoints.join(' | ')}`);
  }

  for (const section of summary.sections.slice(0, 2)) {
    parts.push(`[${title}] ${section.title}: ${cleanLine(section.body).slice(0, 700)}`);
  }

  return parts;
}

function buildQuestionQuery(question: QuestionContextInput) {
  const options = Array.isArray(question.opciones)
    ? question.opciones.filter((option) => typeof option === 'string').join(' ')
    : '';

  return cleanLine(`${question.enunciado} ${question.respuesta_correcta} ${options}`);
}

function computeMaterialPriority(material: StudentMaterialRow, question: QuestionContextInput, userId: string) {
  let score = 0;

  if (material.user_id === userId) score += 6;
  if (material.visibility === 'shared') score += 1;
  if (question.material_id && material.id === question.material_id) score += 10;
  if (question.carrera_id && material.carrera_id === question.carrera_id) score += 3;
  if (question.universidad_id && material.universidad_id === question.universidad_id) score += 2;

  const queryTokens = new Set(normalizeText(buildQuestionQuery(question)).split(' ').filter(Boolean));
  const titleTokens = normalizeText(material.title).split(' ').filter(Boolean);

  for (const token of titleTokens) {
    if (token.length >= 4 && queryTokens.has(token)) {
      score += 0.5;
    }
  }

  return score;
}

function selectTopChunksForMaterial(chunks: RagChunkRow[], query: string, limit = 2) {
  return chunks
    .map((chunk) => ({
      text: chunk.chunk_text ?? '',
      title: chunk.source_title ?? null,
      score: scoreChunk(chunk.chunk_text ?? '', query),
    }))
    .filter((chunk) => chunk.score > 0 && chunk.text)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((chunk) => `${chunk.title ? `[${chunk.title}] ` : ''}${chunk.text}`);
}

export async function buildStudentMaterialContextsForQuestions(input: {
  admin: AdminClient;
  materiaId: string;
  userId: string;
  questions: QuestionContextInput[];
}) {
  if (input.questions.length === 0) {
    return new Map<string, StudentMaterialQuestionContext>();
  }

  const { data: materialRows, error: materialsError } = await input.admin
    .from('student_materials')
    .select('id, user_id, materia_id, carrera_id, universidad_id, title, visibility, processing_status')
    .eq('materia_id', input.materiaId)
    .eq('processing_status', 'ready')
    .or(`user_id.eq.${input.userId},visibility.eq.shared`)
    .order('updated_at', { ascending: false })
    .limit(20);

  if (materialsError) {
    throw materialsError;
  }

  const materials = (materialRows ?? []) as StudentMaterialRow[];
  if (materials.length === 0) {
    return new Map<string, StudentMaterialQuestionContext>();
  }

  const materialIds = materials.map((material) => material.id);

  const [{ data: chunkRows, error: chunksError }, { data: summaryRows, error: summariesError }] = await Promise.all([
    input.admin
      .from('student_material_chunks')
      .select('student_material_id, chunk_text')
      .in('student_material_id', materialIds),
    input.admin
      .from('student_material_summaries')
      .select('student_material_id, summary_short, key_points, summary_sections, status, provider, source_chunks_count, error_message')
      .in('student_material_id', materialIds)
      .eq('status', 'ready'),
  ]);

  if (chunksError) {
    throw chunksError;
  }

  if (summariesError) {
    throw summariesError;
  }

  const chunksByMaterial = new Map<string, RagChunkRow[]>();
  for (const row of (chunkRows ?? []) as StudentMaterialChunkRow[]) {
    const current = chunksByMaterial.get(row.student_material_id) ?? [];
    current.push({
      chunk_text: row.chunk_text,
      source_title: materials.find((material) => material.id === row.student_material_id)?.title ?? null,
    });
    chunksByMaterial.set(row.student_material_id, current);
  }

  const summariesByMaterial = new Map<string, MaterialSummarySource>();
  for (const summary of buildSummarySources((summaryRows ?? []) as Array<StoredSummaryRow & { student_material_id: string }>)) {
    summariesByMaterial.set(summary.studentMaterialId, summary);
  }

  const contextByQuestion = new Map<string, StudentMaterialQuestionContext>();

  for (const question of input.questions) {
    const query = buildQuestionQuery(question);
    const rankedMaterials = materials
      .map((material) => ({
        material,
        priority: computeMaterialPriority(material, question, input.userId),
      }))
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 6);

    const serializedContext: Array<{ text: string; materialId: string; score: number }> = [];

    for (const ranked of rankedMaterials) {
      const summary = summariesByMaterial.get(ranked.material.id);
      if (summary) {
        const summaryParts = serializeSummarySource(summary, ranked.material.title);
        for (const text of summaryParts) {
          serializedContext.push({
            text,
            materialId: ranked.material.id,
            score: ranked.priority + scoreChunk(text, query) + 1,
          });
        }
      }

      const materialChunks = chunksByMaterial.get(ranked.material.id) ?? [];
      const topChunks = selectTopChunksForMaterial(materialChunks, query, 2);

      for (const text of topChunks) {
        serializedContext.push({
          text,
          materialId: ranked.material.id,
          score: ranked.priority + scoreChunk(text, query),
        });
      }
    }

    const rankedContext = serializedContext
      .filter((item) => item.text && item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    if (rankedContext.length === 0) continue;

    contextByQuestion.set(question.id, {
      context: rankedContext.map((item) => item.text),
      matchedMaterialIds: Array.from(new Set(rankedContext.map((item) => item.materialId))),
    });
  }

  return contextByQuestion;
}
