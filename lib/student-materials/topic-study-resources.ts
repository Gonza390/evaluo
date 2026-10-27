import type { StudyFlashcard } from './pedagogy';
import type { StudyGlossaryItem, StudySummarySection } from './types';

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function topicLabel(value: string) {
  return normalize(value)
    .replace(/^(?:seccion|capitulo|tema)\s+(?:de\s+)?/, '')
    .replace(/^\d+\s+/, '')
    .trim();
}

function containsPhrase(text: string, phrase: string) {
  const term = normalize(phrase);
  return term.length >= 4 && ` ${normalize(text)} `.includes(` ${term} `);
}

function exactTopics(label: string, sections: StudySummarySection[]) {
  return sections.flatMap((section, index) =>
    topicLabel(label) && topicLabel(label) === topicLabel(section.title) ? [index] : []
  );
}

/**
 * Los extractos del resumen y del glosario conservan páginas del PDF.
 * Sólo usar las páginas como evidencia cuando una sección es única.
 * Una misma página en dos capítulos NO permite atribuir el término.
 */
function citedPages(value: string): number[] {
  const pages = [...value.matchAll(/Ver en PDF\s*·\s*p[aá]ginas?\s+([\d,\s]+(?:y\s*\d+)?)/giu)]
    .flatMap(match => (match[1] ?? '').match(/\d+/gu) ?? [])
    .map(Number)
    .filter(n => Number.isInteger(n) && n > 0);
  return [...new Set(pages)];
}

/** Resuelve por título explícito o mención inequívoca; nunca por posición. */
export function findConceptTopic(
  concept: Pick<StudyGlossaryItem, 'term' | 'context' | 'englishTerm'>,
  sections: StudySummarySection[]
) {
  const explicit = [
    ...exactTopics('chapterTitle' in concept ? String(concept.chapterTitle ?? '') : '', sections),
    ...exactTopics(concept.context.split(' · Ver en PDF')[0] ?? '', sections),
  ].filter((value, index, all) => all.indexOf(value) === index);
  // Un título repetido no es una identidad de tema válida.
  if (explicit.length > 1) return -1;
  const mentions = sections.flatMap((section, index) =>
    [concept.term, concept.englishTerm ?? ''].some((term) =>
      containsPhrase(`${section.title} ${section.body}`, term)
    )
      ? [index]
      : []
  );
  if (explicit.length === 1 && mentions.length === 1 && explicit[0] !== mentions[0]) return -1;
  if (explicit.length === 1) return explicit[0];

  const pages = citedPages(concept.context);
  const byPage = pages.length > 0
    ? sections.flatMap((section, index) => {
        const sectionPages = citedPages(section.body);
        return pages.every(page => sectionPages.includes(page)) ? [index] : [];
      })
    : [];
  // Si sólo se menciona en un capítulo, descartar una contradicción con
  // las referencias del PDF, pero no inventar una pertenencia sin evidencia.
  if (mentions.length === 1) {
    return byPage.length === 1 && mentions[0] !== byPage[0] ? -1 : mentions[0];
  }
  // Pertenencia basada en páginas solamente si hay una sección candidata.
  return byPage.length === 1 && (mentions.length === 0 || mentions.includes(byPage[0]!))
    ? byPage[0]!
    : -1;
}

/** Agrega pertenencia verificable sin repartir conceptos arbitrariamente. */
export function tagGlossaryChapters(
  glossary: StudyGlossaryItem[],
  sections: StudySummarySection[]
): StudyGlossaryItem[] {
  return glossary.map(concept => {
    const index = findConceptTopic(concept, sections);
    return {
      ...concept,
      chapterTitle: index >= 0 ? sections[index]?.title ?? null : null,
    };
  });
}

/**
 * La invitación adicional es sólo para glosarios largos consultados desde un tema.
 * No se muestra en el glosario general ni sin preguntas fiables disponibles.
 */
export function shouldOfferTopicGlossaryPractice(
  topicIndex: number | null,
  conceptCount: number,
  availableQuestions: number
): boolean {
  return topicIndex !== null && conceptCount > 10 && availableQuestions > 0;
}

/** No repartir conceptos por posición ni usar similitud vaga como asociación académica. */
export function getTopicStudyResources(
  sections: StudySummarySection[],
  glossary: StudyGlossaryItem[],
  flashcards: StudyFlashcard[],
  sectionIndex: number
) {
  if (!Number.isInteger(sectionIndex) || !sections[sectionIndex])
    return { concepts: [], flashcards: [] };
  const conceptTopics = glossary.map((concept) => findConceptTopic(concept, sections));
  const body = normalize(sections[sectionIndex]?.body ?? '');
  const concepts = glossary
    .filter((_, index) => conceptTopics[index] === sectionIndex)
    .sort((left, right) => {
      const score = (concept: StudyGlossaryItem) => {
        const term = normalize(concept.term);
        const first = body.indexOf(term);
        // Priorizar conceptos que el alumno encuentra en el comienzo del tema,
        // no el orden alfabético ni un 'alta' genérico.
        const early = first >= 0 && first <= 600 ? 5 : 0;
        const heading = normalize(sections[sectionIndex]?.title ?? '').includes(term) ? 5 : 0;
        return early + heading + (concept.importance === 'alta' ? 1 : 0);
      };
      return score(right) - score(left) || left.term.localeCompare(right.term, 'es');
    });
  const seenCards = new Set<string>();
  const cards = flashcards.filter((card) => {
    const subjectTopics = new Set<number>();
    glossary.forEach((concept, index) => {
      if (conceptTopics[index] < 0) return;
      if (
        containsPhrase(card.front, concept.term) ||
        (concept.englishTerm && containsPhrase(card.front, concept.englishTerm)) ||
        normalize(card.back) === normalize(concept.definition)
      )
        subjectTopics.add(conceptTopics[index]);
    });
    const explicit =
      card.reference.pageStart && card.reference.excerpt.trim()
        ? exactTopics(card.reference.sectionTitle ?? '', sections)
        : [];
    if (explicit.length > 1) return false;
    if (explicit.length === 1 && subjectTopics.size === 1 && !subjectTopics.has(explicit[0]))
      return false;
    const target =
      explicit.length === 1 ? explicit[0] : subjectTopics.size === 1 ? [...subjectTopics][0] : -1;
    const key = normalize(`${card.front} ${card.back}`);
    if (target !== sectionIndex || seenCards.has(key)) return false;
    seenCards.add(key);
    return true;
  });
  return { concepts, flashcards: cards };
}
