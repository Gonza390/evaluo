/**
 * A PDF cover, LMS wrapper or generated study-space header is document
 * metadata, not university subject matter. Its labels may legitimately occur
 * in the source, but must not become graded conceptual answers/distractors.
 *
 * This is deliberately a narrow deterministic fail-closed gate for obvious
 * administrative filler, not a semantic grader for all academic questions.
 */
function normalized(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/gu, '')
    .toLowerCase().replace(/[^a-z0-9]+/gu, ' ').trim();
}

export function isAdministrativeStudyDescription(value: string): boolean {
  const text = normalized(value);
  return /^(?:materia|asignatura) correspondiente (?:a|al|a los|al) (?:modulos?|materia|plan|programa|material)/u.test(text) ||
    /^(?:institucion universitaria|universidad) que imparte (?:la|el|esta) (?:materia|asignatura|curso)/u.test(text) ||
    /^carrera a la que pertenece (?:el|este) material (?:de estudio)?/u.test(text) ||
    /^(?:titulo|nombre) (?:del archivo|de la materia|de la asignatura|del documento)/u.test(text) ||
    /^documento original (?:de|con|en|para|:|\d)/u.test(text) ||
    /^material compartido para estudiar/u.test(text) ||
    /^universidad de origen del material/u.test(text) ||
    /^plan de estudios al que pertenece (?:el|este) (?:material|documento)/u.test(text);
}

export function isAdministrativeConcept(input: {
  term: string;
  detail: string;
  modelTitle?: string | null;
}): boolean {
  const term = normalized(input.term);
  const title = normalized(input.modelTitle ?? '');
  const detail = normalized(input.detail);
  if (!term || !detail) return true;
  // The name of a course (unlike a substantive topic in its syllabus) isn't
  // automatically a teachable definition when it matches the model's title.
  if (title && (term === title || (term.length >= 12 && title.includes(term)))) return true;
  return isAdministrativeStudyDescription(detail);
}

export function isAdministrativeMultipleChoice(input: {
  prompt: string;
  answer: string;
  options?: readonly string[];
  kind?: string | null;
  sectionTitle?: string | null;
  sourceExcerpt?: string | null;
}): boolean {
  if (isAdministrativeStudyDescription(input.answer)) return true;
  const administrativeOptions = (input.options ?? [])
    .filter(isAdministrativeStudyDescription).length;
  // False distractors built from a cover page make *any* nearby conceptual
  // question unreliable, even when the keyed answer itself looks plausible.
  if (administrativeOptions >= 2) return true;

  const section = normalized(input.sectionTitle ?? '');
  const excerpt = normalized(input.sourceExcerpt ?? '');
  const coverSection = /^(?:tu espacio academico|portada|ficha (?:del|de) material|datos (?:del|de) material|informacion (?:del|de) documento)$/u.test(section);
  const coverExcerpt =
    excerpt.includes('material compartido para estudiar') ||
    (excerpt.includes('materia') && excerpt.includes('carrera') &&
      excerpt.includes('universidad') && excerpt.includes('documento original'));
  const definitionPrompt = /^(?:que significa|que es|cual de estas opciones define|que caracteristica (?:define|permite reconocer)|como se describe)/u.test(normalized(input.prompt));
  return input.kind === 'concept' && definitionPrompt && (coverSection || coverExcerpt);
}
