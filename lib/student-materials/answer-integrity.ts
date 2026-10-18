/**
 * Conservador: sólo detecta inversiones causales explícitas frente a la fuente
 * textual disponible. No certifica la corrección semántica del resto del banco.
 */
export type SourceCausalRelation = {
  source: string;
  target: string;
  description: string;
  pageReferences?: number[];
};

export type SourceCausalChunk = {
  text: string;
  pageStart: number | null;
  pageEnd?: number | null;
};

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function firstAnchor(value: string) {
  return normalize(value)
    .split(' ')
    .find((term) => term.length >= 5 && !['entre', 'sobre', 'desde', 'hasta'].includes(term)) ?? '';
}

function regexTerm(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Detecta el patrón de error: el modelo afirma que A *fue consecuencia*,
 * mientras el fragmento original afirma que B fue consecuencia de A.
 * Se exige coincidencia de ambos anclajes en la misma página referenciada.
 * En caso de duda, no se infiere ninguna dirección.
 */
export function hasSourceContradictedCausalDirection(
  relation: SourceCausalRelation,
  chunks: SourceCausalChunk[]
): boolean {
  const cause = firstAnchor(relation.source);
  const effect = firstAnchor(relation.target);
  if (!cause || !effect || cause === effect) return false;

  const claim = normalize(relation.description);
  const wronglyReversed = new RegExp(
    `\\b${regexTerm(cause)}\\b.{0,80}\\b(?:fue|fueron|era|eran|es|son)\\b.{0,45}\\bconsecuencia\\b`
  );
  if (!wronglyReversed.test(claim)) return false;

  const evidenceDirection = new RegExp(
    `\\b${regexTerm(effect)}\\b.{0,45}\\b(?:fue|fueron|era|eran|es|son)\\b.{0,55}\\bconsecuencia\\b.{0,120}\\b${regexTerm(cause)}\\b`
  );
  const pages = new Set((relation.pageReferences ?? []).filter((page) => Number.isInteger(page) && page > 0));

  return chunks.some((chunk) => {
    if (pages.size && (chunk.pageStart === null || !pages.has(chunk.pageStart))) return false;
    return evidenceDirection.test(normalize(chunk.text));
  });
}
