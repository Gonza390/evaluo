import pdf from 'pdf-parse-fork';
import { createAdminClient } from '@/lib/supabase-admin';

export type RagChunkRow = {
  chunk_text: string | null;
  source_title: string | null;
};

export function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function splitIntoChunks(text: string, chunkSize = 1400, overlap = 200) {
  const chunks: string[] = [];
  const clean = text.replace(/\s+/g, ' ').trim();
  let index = 0;

  while (index < clean.length) {
    const end = Math.min(clean.length, index + chunkSize);
    chunks.push(clean.slice(index, end));
    if (end >= clean.length) break;
    index = Math.max(0, end - overlap);
  }

  return chunks;
}

export function scoreChunk(chunkText: string, query: string) {
  const chunkTokens = new Set(normalizeText(chunkText).split(' '));
  const queryTokens = normalizeText(query).split(' ');

  let score = 0;
  for (const token of queryTokens) {
    if (token.length < 4) continue;
    if (chunkTokens.has(token)) score += 1;
  }

  return score;
}

export function selectTopRagContextChunks(
  chunks: RagChunkRow[],
  query: string,
  limit = 4
) {
  return chunks
    .map((chunk) => ({
      text: chunk.chunk_text ?? '',
      score: scoreChunk(chunk.chunk_text ?? '', query),
      title: chunk.source_title,
    }))
    .sort((a, b) => b.score - a.score)
    .filter((item) => item.score > 0)
    .slice(0, limit)
    .map((item) => `${item.title ? `[${item.title}] ` : ''}${item.text}`);
}

export async function hydrateChunksForMateria(materiaId: string) {
  const admin = createAdminClient();

  const { count } = await admin
    .from('rag_document_chunks')
    .select('*', { count: 'exact', head: true })
    .eq('materia_id', materiaId);

  if ((count ?? 0) > 0) return;

  const { data: recursos } = await admin
    .from('recursos')
    .select('id, materia_id, url_archivo, tipo, nombre')
    .eq('materia_id', materiaId)
    .ilike('tipo', '%pdf%')
    .order('creado_at', { ascending: false })
    .limit(6);

  for (const recurso of recursos ?? []) {
    const path = (recurso.url_archivo ?? '').trim();
    if (!path) continue;

    const { data: fileData, error: downloadError } = await admin.storage
      .from('biblioteca')
      .download(path);
    if (downloadError || !fileData) continue;

    const buffer = Buffer.from(await fileData.arrayBuffer());
    const pdfData = await pdf(buffer);
    const text = (pdfData.text ?? '').trim();
    if (text.length < 120) continue;

    const rows = splitIntoChunks(text).map((chunk, index) => ({
      materia_id: materiaId,
      source_table: 'recursos',
      source_id: recurso.id,
      source_title: recurso.nombre,
      chunk_index: index,
      chunk_text: chunk,
    }));

    if (rows.length > 0) {
      await admin.from('rag_document_chunks').insert(rows);
    }
  }
}
