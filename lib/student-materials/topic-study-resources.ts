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

/** No repartir conceptos por posición ni usar similitud vaga como asociación académica. */
export function getTopicStudyResources(
  sections: StudySummarySection[],
  glossary: StudyGlossaryItem[],
  flashcards: StudyFlashcard[],
  sectionIndex: number
) {
  if (!Number.isInteger(sectionIndex) || !sections[sectionIndex])
    return { concepts: [], flashcards: [] };
  const conceptTopics = glossary.map((concept) => {
    const explicit = exactTopics(concept.context, sections);
    const mentions = sections.flatMap((section, index) =>
      [concept.term, concept.englishTerm ?? ''].some((term) =>
        containsPhrase(`${section.title} ${section.body}`, term)
      )
        ? [index]
        : []
    );
    // Una referencia explícita que contradice la mención única requiere revisión.
    if (explicit.length === 1 && mentions.length === 1 && explicit[0] !== mentions[0]) return -1;
    if (explicit.length === 1) return explicit[0];
    return mentions.length === 1 ? mentions[0] : -1;
  });
  const concepts = glossary.filter((_, index) => conceptTopics[index] === sectionIndex);
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
