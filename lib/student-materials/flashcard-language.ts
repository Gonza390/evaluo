import type { PedagogicalArtifacts, StudyFlashcard } from './pedagogy';
import type { StudyGlossaryItem } from './types';

function key(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Only localizes instructional templates. Original source excerpts, pages,
 * grading IDs and question-answer pairs are deliberately never changed.
 */
function localizeFront(front: string, equivalent: Map<string, StudyGlossaryItem>) {
  const patterns: Array<[RegExp, (match: RegExpMatchArray) => string]> = [
    [/^¿Qué significa “([^”]+)”\?$/iu, m => {
      const word = m[1]!;
      const english = equivalent.get(key(word))?.englishTerm?.trim();
      const term = english && key(english) !== key(word) ? english + ' (' + word + ')' : word;
      return 'What does “' + term + '” mean?';
    }],
    [/^¿Cómo se relacionan “([^”]+)” (?:con|y) “([^”]+)”\?$/iu, m =>
      'How are “' + m[1] + '” and “' + m[2] + '” related?'],
    [/^¿Qué elementos incluye “([^”]+)”\?$/iu, m =>
      'Which elements belong to “' + m[1] + '”?'],
    [/^Reconstruí el proceso “([^”]+)” en el orden explicado por el material\.?$/iu, m =>
      'Reconstruct the process “' + m[1] + '” in the order explained by your notes.'],
    [/^¿Qué representa “([^”]+)” en este material\?$/iu, m =>
      'What does “' + m[1] + '” represent in your notes?'],
  ];
  for (const [pattern, replace] of patterns) {
    const match = front.match(pattern);
    if (match) return replace(match);
  }
  return front;
}

/** Source-grounded English cards for a newly uploaded document, after QA.
 * English terminology comes only from the validated glossary translation.
 * For unknown or unsupported expressions we preserve source language rather
 * than invent an English answer.
 */
export function localizePedagogicalFlashcards(
  artifacts: PedagogicalArtifacts,
  glossary: StudyGlossaryItem[]
): PedagogicalArtifacts {
  const bySourceTerm = new Map(glossary.map(item => [key(item.term), item]));
  const cards: StudyFlashcard[] = artifacts.flashcards.map(card => {
    const match = card.front.match(/^¿Qué significa “([^”]+)”\?$/iu);
    const glossaryItem = match ? bySourceTerm.get(key(match[1]!)) : undefined;
    return {
      ...card,
      front: localizeFront(card.front, bySourceTerm),
      back: glossaryItem?.englishTerm && glossaryItem.definition
        ? glossaryItem.definition : card.back,
      // Keep reference.excerpt and sectionTitle verbatim in source language.
      reference: card.reference,
    };
  });
  return { ...artifacts, flashcards: cards };
}
