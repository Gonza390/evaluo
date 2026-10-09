export const MIN_REVIEW_EVIDENCE_LENGTH = 60;

export type ReviewEvidenceChunk = {
  chunk_text: string | null;
  page_start: number | null;
  page_end: number | null;
  section_title: string | null;
};

export type ReviewEvidencePreference = {
  pageStart: number | null;
  pageEnd: number | null;
  sectionTitle: string | null;
};

function normalize(value: string | null | undefined) {
  return (value ?? '')
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function overlapsReferencePage(
  chunk: ReviewEvidenceChunk,
  preference: ReviewEvidencePreference
) {
  if (preference.pageStart === null) return false;

  const preferredEnd = preference.pageEnd ?? preference.pageStart;
  const chunkStart = chunk.page_start ?? chunk.page_end;
  const chunkEnd = chunk.page_end ?? chunk.page_start;
  if (chunkStart === null || chunkEnd === null) return false;

  return chunkStart <= preferredEnd && chunkEnd >= preference.pageStart;
}

function matchesReferenceSection(
  chunk: ReviewEvidenceChunk,
  preference: ReviewEvidencePreference
) {
  const preferred = normalize(preference.sectionTitle);
  const candidate = normalize(chunk.section_title);
  if (!preferred || !candidate) return false;

  return (
    candidate === preferred ||
    candidate.includes(preferred) ||
    preferred.includes(candidate)
  );
}

export function selectBestReviewEvidenceChunk(
  chunks: ReviewEvidenceChunk[],
  query: string,
  preference: ReviewEvidencePreference,
  score: (chunkText: string, queryText: string) => number
) {
  return chunks
    .map((chunk) => {
      const text = chunk.chunk_text?.trim() ?? '';
      const lexicalScore = text ? score(text, query) : 0;
      const pageMatch = overlapsReferencePage(chunk, preference);
      const sectionMatch = matchesReferenceSection(chunk, preference);
      const relevanceScore =
        lexicalScore + (pageMatch ? 5 : 0) + (sectionMatch ? 3 : 0);

      return {
        ...chunk,
        text,
        lexicalScore,
        pageMatch,
        sectionMatch,
        relevanceScore,
      };
    })
    .filter(
      (chunk) =>
        chunk.text.length >= MIN_REVIEW_EVIDENCE_LENGTH &&
        (chunk.lexicalScore >= 2 || chunk.pageMatch || chunk.sectionMatch)
    )
    .sort(
      (left, right) =>
        right.relevanceScore - left.relevanceScore ||
        right.lexicalScore - left.lexicalScore ||
        right.text.length - left.text.length
    )[0] ?? null;
}
