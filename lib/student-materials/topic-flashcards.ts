import type { StudyFlashcard } from './pedagogy';
import type { StudyGlossaryItem } from './types';

export type TopicFlashcardView = {
  front: string;
  back: string;
  /** 'glossary' = generada desde una definición del glosario del tema. */
  origin: 'glossary' | 'material';
  reference?: StudyFlashcard['reference'];
};

export const TOPIC_FLASHCARD_TARGET = 5;
const GLOSSARY_CARD_LIMIT = 3;

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Arma el mazo de repaso de un tema: primero hasta 3 tarjetas "¿Qué significa X?"
 * sacadas del glosario del propio tema, y luego las tarjetas reales del material
 * hasta completar 5. Nunca repite una definición ya cubierta por una tarjeta real.
 */
export function buildTopicFlashcards(
  concepts: StudyGlossaryItem[],
  flashcards: StudyFlashcard[],
  english = false,
  target = TOPIC_FLASHCARD_TARGET
): TopicFlashcardView[] {
  const covered = new Set(flashcards.map((card) => normalize(card.back)));
  const seen = new Set<string>();
  const fromGlossary: TopicFlashcardView[] = [];
  for (const concept of concepts) {
    if (fromGlossary.length >= GLOSSARY_CARD_LIMIT) break;
    const term = (english && concept.englishTerm ? concept.englishTerm : concept.term).trim();
    const definition = concept.definition.trim();
    const key = normalize(term);
    if (!term || !definition || seen.has(key) || covered.has(normalize(definition))) continue;
    seen.add(key);
    fromGlossary.push({
      front: english
        ? `What does “${term}” mean according to the material?`
        : `¿Qué significa “${term}” según el material?`,
      back: definition,
      origin: 'glossary',
    });
  }
  const fromMaterial: TopicFlashcardView[] = flashcards.map((card) => ({
    front: card.front,
    back: card.back,
    origin: 'material',
    reference: card.reference,
  }));
  return [...fromGlossary, ...fromMaterial].slice(0, Math.max(target, fromGlossary.length));
}
