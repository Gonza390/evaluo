/**
 * Selección acotada de evidencia para repreguntar un error.
 * Sólo recibimos chunks persistidos del mismo PDF; nunca buscamos en otro usuario.
 */
export type ReviewEvidenceChunk = {
  chunk_index: number;
  chunk_text: string | null;
  page_start: number | null;
  page_end: number | null;
};

type Input = {
  originalExcerpt: string | null;
  topic: string | null;
  question: string;
  correctAnswer: string | null;
  page: number | null;
  chunks: ReviewEvidenceChunk[];
};

const MAX_EVIDENCE_CHARS = 2_900;

const IGNORE = new Set([
  'donde', 'cuando', 'como', 'cual', 'cuales', 'segun', 'sobre', 'entre',
  'desde', 'hasta', 'para', 'este', 'esta', 'estos', 'estas', 'texto',
  'material', 'pregunta', 'respuesta', 'correcta', 'explicacion',
  'concepto', 'situacion', 'interviene', 'coincide', 'explicado',
  'permite', 'obtener', 'aplicacion', 'primer', 'nivel', 'mismo',
]);

function significantWords(text: string) {
  return [...new Set(
    text.toLocaleLowerCase('es')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .split(' ')
      .filter((word) => word.length >= 4 && !IGNORE.has(word))
  )];
}

export function selectReviewCheckEvidence(input: Input): {
  excerpt: string | null;
  mode: 'source_chunks' | 'original_reference' | 'missing';
  chunkCount: number;
} {
  const original = input.originalExcerpt?.trim().slice(0, MAX_EVIDENCE_CHARS) ?? '';
  const queryWords = significantWords(
    [input.topic, input.question, input.correctAnswer, original].filter(Boolean).join(' ')
  );
  const candidates = input.chunks
    .filter((chunk) => (chunk.chunk_text?.trim().length ?? 0) >= 60)
    .map((chunk) => {
      const text = chunk.chunk_text!.trim();
      const words = new Set(significantWords(text));
      const matches = queryWords.filter((word) => words.has(word)).length;
      const samePage = input.page !== null &&
        chunk.page_start !== null &&
        chunk.page_start <= input.page &&
        (chunk.page_end ?? chunk.page_start) >= input.page;
      return { ...chunk, text, matches, samePage };
    })
    // Los vecinos sólo entran si el tema realmente coincide.
    .filter((chunk) => chunk.matches >= (chunk.samePage ? 2 : 3))
    .sort((left, right) =>
      Number(right.samePage) - Number(left.samePage) ||
      right.matches - left.matches ||
      left.chunk_index - right.chunk_index
    );

  // Mantener la misma página si tiene evidencia relevante: no introducir
  // datos del capítulo vecino cuando la página original es suficiente.
  const samePage = candidates.filter((chunk) => chunk.samePage);
  const selected = (samePage.length ? samePage : candidates)
    .slice(0, 2)
    .sort((a, b) => a.chunk_index - b.chunk_index);
  const selectedText = selected.map((chunk) => chunk.text).join('\n\n');
  if (selectedText.length >= 60 && selectedText.length > original.length) {
    return {
      excerpt: selectedText.slice(0, MAX_EVIDENCE_CHARS),
      mode: 'source_chunks',
      chunkCount: selected.length,
    };
  }
  return {
    excerpt: original || null,
    mode: original ? 'original_reference' : 'missing',
    chunkCount: 0,
  };
}
