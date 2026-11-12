import 'server-only';
import { createAdminClient } from '@/lib/supabase-admin';
import { scoreChunk } from '@/lib/rag';
import { loadReviewContext } from '@/lib/study-error-review-context';
import type { EviChatContext } from '@/lib/evi-chat-contract';

export type EviChatGrounding = {
  question: string;
  chosen: string | null;
  correctAnswer: string | null;
  explanation: string | null;
  excerpt: string | null;
  page: number | null;
  materialId: string | null;
};

/**
 * Busca el fragmento del apunte que respalda la conversación. Siempre filtra
 * por el usuario: un materialId o errorId ajeno devuelve null.
 */
export async function loadEviChatGrounding(
  userId: string,
  context: EviChatContext
): Promise<EviChatGrounding | null> {
  if (context.kind === 'error') {
    const review = await loadReviewContext(userId, context.errorId, context.materialId ?? null);
    if (!review) return null;
    const { row, source } = review;
    return {
      question: row.prompt,
      chosen: row.selected_answer ?? null,
      correctAnswer: row.correct_answer ?? null,
      explanation: row.explanation ?? null,
      excerpt: source?.excerpt ?? null,
      page: source?.pageStart ?? null,
      materialId: source?.materialId ?? null,
    };
  }

  const admin = createAdminClient();
  const { data: material, error } = await admin
    .from('student_materials')
    .select('id, processing_status')
    .eq('id', context.materialId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!material || material.processing_status !== 'ready') return null;

  const { data: chunks, error: chunksError } = await admin
    .from('student_material_chunks')
    .select('chunk_text, page_start, page_end')
    .eq('student_material_id', material.id)
    .order('chunk_index')
    .limit(400);
  if (chunksError) throw chunksError;

  const query = `${context.question} ${context.correctAnswer} ${context.chosen ?? ''}`;
  const candidates = (chunks ?? []).filter((chunk) => {
    if (!context.page) return true;
    const start = chunk.page_start ?? 0;
    const end = chunk.page_end ?? start;
    return start <= context.page && context.page <= end;
  });
  const pool = candidates.length ? candidates : (chunks ?? []);
  const best = pool
    .map((chunk) => ({ ...chunk, score: scoreChunk(chunk.chunk_text, query) }))
    .sort((a, b) => b.score - a.score)[0];
  const grounded = best && (candidates.length > 0 || best.score >= 2);

  return {
    question: context.question,
    chosen: context.chosen ?? null,
    correctAnswer: context.correctAnswer,
    explanation: context.explanation ?? null,
    excerpt: grounded ? best.chunk_text.slice(0, 3000) : null,
    page: grounded ? (best.page_start ?? context.page ?? null) : null,
    materialId: material.id,
  };
}
