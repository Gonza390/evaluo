import { prepareTextForSummary } from '@/lib/student-materials/text';

const DEFAULT_DOCUMENT_CHUNK_MAX_CHARS = 1_200;
const DEFAULT_OVERLAP_PARAGRAPHS = 1;
const OVERSIZED_CHUNK_OVERLAP_CHARS = 180;

export type CompleteDocumentChunk = {
  text: string;
  pageStart: number | null;
  pageEnd: number | null;
};

/**
 * Construye el universo COMPLETO de chunks de un documento.
 *
 * A diferencia de buildSummaryChunks(), esta función no aplica un límite global
 * de cantidad de chunks. Los presupuestos de costo/tamaño pertenecen a cada
 * consumidor, no a la representación base.
 */
export function buildCompleteDocumentChunks(
  text: string,
  options?: {
    maxChars?: number;
    overlapParagraphs?: number;
  }
) {
  const cleaned = prepareTextForSummary(text);
  if (!cleaned) return [];

  const maxChars = Math.max(
    200,
    Math.floor(options?.maxChars ?? DEFAULT_DOCUMENT_CHUNK_MAX_CHARS)
  );
  const overlapParagraphs = Math.max(
    0,
    Math.floor(options?.overlapParagraphs ?? DEFAULT_OVERLAP_PARAGRAPHS)
  );

  const paragraphs = cleaned
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\n{3,}/g, '\n\n').trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let currentParagraphs: string[] = [];

  const flush = () => {
    const chunk = currentParagraphs.join('\n\n').trim();
    if (chunk) chunks.push(chunk);
  };

  for (const paragraph of paragraphs) {
    if (paragraph.length > maxChars) {
      if (currentParagraphs.length > 0) {
        flush();
        currentParagraphs = [];
      }

      chunks.push(
        ...splitOversizedText(
          paragraph,
          maxChars,
          OVERSIZED_CHUNK_OVERLAP_CHARS
        )
      );
      continue;
    }

    const candidate = [...currentParagraphs, paragraph].join('\n\n');

    if (candidate.length > maxChars && currentParagraphs.length > 0) {
      const overlap =
        overlapParagraphs > 0
          ? currentParagraphs.slice(-overlapParagraphs)
          : [];

      flush();
      currentParagraphs = [...overlap];

      const withOverlap = [...currentParagraphs, paragraph].join('\n\n');

      if (withOverlap.length > maxChars) {
        currentParagraphs = [];
      }
    }

    currentParagraphs.push(paragraph);
  }

  if (currentParagraphs.length > 0) {
    flush();
  }

  return chunks
    .map((chunk) => chunk.trim())
    .filter(Boolean);
}

/**
 * Construye chunks completos preservando el número de página física.
 *
 * Cada página se chunkifica de forma independiente para que ningún chunk cruce
 * silenciosamente de una página a otra. Las páginas vacías no generan chunks,
 * pero no alteran la numeración de las páginas posteriores.
 */
export function buildCompleteTraceableDocumentChunks(
  pages: string[] | null | undefined,
  fallbackText: string,
  options?: {
    maxChars?: number;
    overlapParagraphs?: number;
  }
): CompleteDocumentChunk[] {
  if (Array.isArray(pages)) {
    const traceable: CompleteDocumentChunk[] = [];

    pages.forEach((pageText, pageIndex) => {
      const pageChunks = buildCompleteDocumentChunks(pageText, options);

      for (const text of pageChunks) {
        traceable.push({
          text,
          pageStart: pageIndex + 1,
          pageEnd: pageIndex + 1,
        });
      }
    });

    if (traceable.length > 0 || pages.length > 0) {
      return traceable;
    }
  }

  return buildCompleteDocumentChunks(fallbackText, options).map((text) => ({
    text,
    pageStart: null,
    pageEnd: null,
  }));
}

function splitOversizedText(
  text: string,
  maxChars: number,
  overlapChars: number
) {
  const chunks: string[] = [];
  const clean = text.trim();

  if (!clean) return chunks;

  let start = 0;

  while (start < clean.length) {
    const hardEnd = Math.min(clean.length, start + maxChars);
    let end = hardEnd;

    if (hardEnd < clean.length) {
      const lastSpace = clean.lastIndexOf(' ', hardEnd);

      if (lastSpace > start + Math.floor(maxChars * 0.6)) {
        end = lastSpace;
      }
    }

    const chunk = clean.slice(start, end).trim();
    if (chunk) chunks.push(chunk);

    if (end >= clean.length) break;

    const nextStart = Math.max(0, end - overlapChars);
    start = nextStart > start ? nextStart : end;
  }

  return chunks;
}
