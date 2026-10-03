import 'server-only';
import { createHash } from 'node:crypto';
import { createAdminClient } from '@/lib/supabase-admin';
import { scoreChunk } from '@/lib/rag';
import type { StudyErrorSource, StudyErrorPdfRecommendation } from '@/lib/study-errors';

export const reviewIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ReviewErrorRow = {
  id: string;
  user_id: string;
  materia_id: string | null;
  student_material_id: string | null;
  source_type: StudyErrorSource;
  source_key: string;
  prompt: string;
  topic: string | null;
  correct_answer: string | null;
  selected_answer: string | null;
  explanation: string | null;
  reference_excerpt: string | null;
  reference_page_start: number | null;
  reference_page_end: number | null;
  reference_section_title: string | null;
  status: 'pending' | 'resolved';
  last_failed_at: string;
  last_reviewed_at: string | null;
  metadata: Record<string, unknown>;
  updated_at: string;
};

export async function loadReviewContext(
  userId: string,
  errorId: string,
  materialId: string | null
) {
  const admin = createAdminClient();
  // study_errors sigue fuera del snapshot generado; el cast queda limitado a esta consulta.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from('study_errors')
    .select('*')
    .eq('id', errorId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as ReviewErrorRow;
  const selectedMaterialId =
    materialId ??
    row.student_material_id ??
    (typeof row.metadata?.review_material_id === 'string' ? row.metadata.review_material_id : null);
  let source: StudyErrorPdfRecommendation | null = null;

  if (selectedMaterialId) {
    const { data: material, error: materialError } = await admin
      .from('student_materials')
      .select('id, title, processing_status')
      .eq('id', selectedMaterialId)
      .eq('user_id', userId)
      .maybeSingle();
    if (materialError) throw materialError;
    if (!material || material.processing_status !== 'ready') return null;
    source = {
      materialId: material.id,
      materialTitle: material.title,
      pageStart: null,
      pageEnd: null,
      sectionTitle: null,
      excerpt: null,
      relation: material.id === row.student_material_id ? 'origin' : 'best',
    };
    if (material.id === row.student_material_id && row.reference_excerpt?.trim()) {
      source = {
        ...source,
        excerpt: row.reference_excerpt.trim().slice(0, 3000),
        pageStart: row.reference_page_start,
        pageEnd: row.reference_page_end,
        sectionTitle: row.reference_section_title,
      };
    } else {
      const { data: chunks, error: chunksError } = await admin
        .from('student_material_chunks')
        .select('chunk_text, page_start, page_end, section_title')
        .eq('student_material_id', material.id)
        .order('chunk_index')
        .limit(400);
      if (chunksError) throw chunksError;
      const query = `${row.topic ?? ''} ${row.prompt} ${row.correct_answer ?? ''}`;
      const best = (chunks ?? [])
        .map((chunk) => ({ ...chunk, score: scoreChunk(chunk.chunk_text, query) }))
        .filter((chunk) => chunk.score >= 2)
        .sort((a, b) => b.score - a.score)[0];
      if (best)
        source = {
          ...source,
          excerpt: best.chunk_text.slice(0, 3000),
          pageStart: best.page_start,
          pageEnd: best.page_end,
          sectionTitle: best.section_title,
        };
    }
  }
  const contextKey = createHash('sha256')
    .update(
      JSON.stringify([
        row.last_failed_at,
        row.prompt,
        row.correct_answer,
        row.selected_answer,
        source?.materialId,
        source?.excerpt,
      ])
    )
    .digest('hex');
  // Repetir un fallo no cambia la explicación del mismo concepto y fuente.
  // La comprobación sí conserva la revisión para impedir reutilizar un acierto viejo.
  const helpContextKey = createHash('sha256')
    .update(
      JSON.stringify([
        row.prompt,
        row.correct_answer,
        row.selected_answer,
        source?.materialId,
        source?.excerpt,
      ])
    )
    .digest('hex');
  return { row, source, contextKey, helpContextKey };
}
