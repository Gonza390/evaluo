import { normalizeText, scoreChunk } from '@/lib/rag';
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
  page_start: number | null;
  page_end: number | null;
  section_title: string | null;
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

export type StudentMaterialQuestionMatch = {
  materialId: string;
  materialTitle: string;
  pageStart: number | null;
  pageEnd: number | null;
  sectionTitle: string | null;
  excerpt: string;
  score: number;
  relation: 'origin' | 'best';
};

export type StudentMaterialQuestionContext = {
  context: string[];
  matchedMaterialIds: string[];
  matches: StudentMaterialQuestionMatch[];
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

function buildQuestionQuery(question: QuestionContextInput) {
  const options = Array.isArray(question.opciones)
    ? question.opciones.filter((option) => typeof option === 'string').join(' ')
    : '';

  return cleanLine(`${question.enunciado} ${question.respuesta_correcta} ${options}`);
}

function computeMaterialPriority(
  material: StudentMaterialRow,
  question: QuestionContextInput,
  userId: string | null
) {
  let score = 0;

  if (userId && material.user_id === userId) score += 6;
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

function selectTopChunksForMaterial(
  chunks: StudentMaterialChunkRow[],
  query: string,
  material: StudentMaterialRow,
  basePriority: number,
  relation: 'origin' | 'best',
  limit = 2
) {
  return chunks
    .map((chunk) => {
      const excerpt = cleanLine(chunk.chunk_text ?? '');
      return {
        text: `${chunk.section_title ? `[${chunk.section_title}] ` : ''}${excerpt}`,
        materialId: material.id,
        materialTitle: material.title,
        pageStart: chunk.page_start,
        pageEnd: chunk.page_end,
        sectionTitle: chunk.section_title,
        excerpt: excerpt.slice(0, 700),
        score: basePriority + scoreChunk(excerpt, query),
        relation,
      };
    })
    .filter((chunk) => chunk.score > 0 && chunk.excerpt)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function summaryContextForMaterial(input: {
  summary: MaterialSummarySource;
  material: StudentMaterialRow;
  query: string;
  priority: number;
  relation: 'origin' | 'best';
}) {
  const items: Array<{
    text: string;
    materialId: string;
    materialTitle: string;
    pageStart: number | null;
    pageEnd: number | null;
    sectionTitle: string | null;
    excerpt: string;
    score: number;
    relation: 'origin' | 'best';
  }> = [];

  if (input.summary.shortSummary) {
    const excerpt = input.summary.shortSummary;
    items.push({
      text: `[${input.material.title}] Resumen breve: ${excerpt}`,
      materialId: input.material.id,
      materialTitle: input.material.title,
      pageStart: null,
      pageEnd: null,
      sectionTitle: null,
      excerpt,
      score: input.priority + scoreChunk(excerpt, input.query) + 1,
      relation: input.relation,
    });
  }

  if (input.summary.keyPoints.length > 0) {
    const excerpt = input.summary.keyPoints.join(' | ');
    items.push({
      text: `[${input.material.title}] Puntos clave: ${excerpt}`,
      materialId: input.material.id,
      materialTitle: input.material.title,
      pageStart: null,
      pageEnd: null,
      sectionTitle: 'Puntos clave',
      excerpt,
      score: input.priority + scoreChunk(excerpt, input.query) + 1,
      relation: input.relation,
    });
  }

  for (const section of input.summary.sections.slice(0, 2)) {
    const excerpt = cleanLine(section.body).slice(0, 700);
    items.push({
      text: `[${input.material.title}] ${section.title}: ${excerpt}`,
      materialId: input.material.id,
      materialTitle: input.material.title,
      pageStart: null,
      pageEnd: null,
      sectionTitle: section.title,
      excerpt,
      score: input.priority + scoreChunk(excerpt, input.query) + 1,
      relation: input.relation,
    });
  }

  return items;
}

export async function buildStudentMaterialContextsForQuestions(input: {
  admin: AdminClient;
  materiaId: string;
  userId: string;
  questions: QuestionContextInput[];
  ownedOnly?: boolean;
}) {
  if (input.questions.length === 0) {
    return new Map<string, StudentMaterialQuestionContext>();
  }

  const userId = input.userId.trim() || null;
  let materialsQuery = input.admin
    .from('student_materials')
    .select('id, user_id, materia_id, carrera_id, universidad_id, title, visibility, processing_status')
    .eq('materia_id', input.materiaId)
    .eq('processing_status', 'ready');

  if (input.ownedOnly) {
    if (!userId) return new Map<string, StudentMaterialQuestionContext>();
    materialsQuery = materialsQuery.eq('user_id', userId);
  } else {
    materialsQuery = userId
      ? materialsQuery.or(`user_id.eq.${userId},visibility.eq.shared`)
      : materialsQuery.eq('visibility', 'shared');
  }

  const { data: materialRows, error: materialsError } = await materialsQuery
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

  const [{ data: chunkRows, error: chunksError }, { data: summaryRows, error: summariesError }] =
    await Promise.all([
      input.admin
        .from('student_material_chunks')
        .select('student_material_id, chunk_text, page_start, page_end, section_title')
        .in('student_material_id', materialIds),
      input.admin
        .from('student_material_summaries')
        .select(
          'student_material_id, summary_short, key_points, summary_sections, status, provider, source_chunks_count, error_message'
        )
        .in('student_material_id', materialIds)
        .eq('status', 'ready'),
    ]);

  if (chunksError) {
    throw chunksError;
  }

  if (summariesError) {
    throw summariesError;
  }

  const chunksByMaterial = new Map<string, StudentMaterialChunkRow[]>();
  for (const row of (chunkRows ?? []) as StudentMaterialChunkRow[]) {
    const current = chunksByMaterial.get(row.student_material_id) ?? [];
    current.push(row);
    chunksByMaterial.set(row.student_material_id, current);
  }

  const summariesByMaterial = new Map<string, MaterialSummarySource>();
  for (const summary of buildSummarySources(
    (summaryRows ?? []) as Array<StoredSummaryRow & { student_material_id: string }>
  )) {
    summariesByMaterial.set(summary.studentMaterialId, summary);
  }

  const contextByQuestion = new Map<string, StudentMaterialQuestionContext>();

  for (const question of input.questions) {
    const query = buildQuestionQuery(question);
    const rankedMaterials = materials
      .map((material) => ({
        material,
        priority: computeMaterialPriority(material, question, userId),
      }))
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 6);

    const serializedContext: Array<{
      text: string;
      materialId: string;
      materialTitle: string;
      pageStart: number | null;
      pageEnd: number | null;
      sectionTitle: string | null;
      excerpt: string;
      score: number;
      relation: 'origin' | 'best';
    }> = [];

    for (const ranked of rankedMaterials) {
      const relation: 'origin' | 'best' =
        question.material_id && ranked.material.id === question.material_id ? 'origin' : 'best';

      const summary = summariesByMaterial.get(ranked.material.id);
      if (summary) {
        serializedContext.push(
          ...summaryContextForMaterial({
            summary,
            material: ranked.material,
            query,
            priority: ranked.priority,
            relation,
          })
        );
      }

      const materialChunks = chunksByMaterial.get(ranked.material.id) ?? [];
      serializedContext.push(
        ...selectTopChunksForMaterial(
          materialChunks,
          query,
          ranked.material,
          ranked.priority,
          relation,
          2
        )
      );
    }

    const rankedContext = serializedContext
      .filter((item) => item.text && item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);

    if (rankedContext.length === 0) continue;

    const bestByMaterial = new Map<string, (typeof rankedContext)[number]>();
    for (const item of rankedContext) {
      if (!bestByMaterial.has(item.materialId)) {
        bestByMaterial.set(item.materialId, item);
      }
    }

    const matches: StudentMaterialQuestionMatch[] = Array.from(bestByMaterial.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((item, index) => ({
        materialId: item.materialId,
        materialTitle: item.materialTitle,
        pageStart: item.pageStart,
        pageEnd: item.pageEnd,
        sectionTitle: item.sectionTitle,
        excerpt: item.excerpt,
        score: item.score,
        relation: item.relation === 'origin' || index === 0 ? item.relation : 'best',
      }));

    contextByQuestion.set(question.id, {
      context: rankedContext.slice(0, 5).map((item) => item.text),
      matchedMaterialIds: matches.map((item) => item.materialId),
      matches,
    });
  }

  return contextByQuestion;
}
