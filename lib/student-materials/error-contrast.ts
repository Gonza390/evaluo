import type { StudyGlossaryItem } from './types';

function norm(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/gu, '')
    .toLowerCase().replace(/[^a-z0-9]+/gu, ' ').trim();
}
function uniqueMatchingConcept(text: string, glossary: StudyGlossaryItem[]) {
  const needle = norm(text);
  if (needle.length < 16) return null;
  const matches = glossary.filter(item => norm(item.definition) === needle);
  return matches.length === 1 ? matches[0] : null;
}
/**
 * Contraste explicativo anclado en definiciones existentes.
 * No atribuye el distractor a un concepto si hay múltiples coincidencias.
 */
export function buildGroundedErrorContrast(
  selected: string | null | undefined,
  correct: string | null | undefined,
  glossary: StudyGlossaryItem[]
): string | null {
  const chosen = selected?.trim() ?? '';
  const expected = correct?.trim() ?? '';
  if (!chosen || !expected || norm(chosen) === norm(expected)) return null;
  const wrong = uniqueMatchingConcept(chosen, glossary);
  const right = uniqueMatchingConcept(expected, glossary);
  if (!wrong || !right || norm(wrong.term) === norm(right.term)) return null;
  return `Elegiste una definición de “${wrong.term}”, que en el material significa: ${wrong.definition}. La respuesta corresponde a “${right.term}”: ${right.definition}. El punto a recordar es que son conceptos distintos, aunque pertenezcan al mismo tema.`;
}
