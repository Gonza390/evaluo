import type { StudyFlashcard } from '@/lib/student-materials/pedagogy';
import type { StudyGlossaryItem, StudySummarySection } from '@/lib/student-materials/types';

/**
 * Cuenta solamente recursos que declaran exactamente el capítulo al que pertenecen.
 * Si hay ambigüedad o faltan referencias, no presenta cantidades como si fueran del tema 1.
 */
function chapterKey(value: string | null | undefined) {
  return (value ?? '')
    .replace(/^\s*\d+(?:\.\d+)*[.)]?\s*/u, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, ' ')
    .trim();
}

export type FirstTopicResourceInfo = {
  /** Totales reales del material, no necesariamente del primer tema. */
  totalFlashcards: number;
  totalGlossaryTerms: number;
  flashcardCount: number | null;
  glossaryCount: number | null;
  hasFlashcards: boolean;
  hasGlossary: boolean;
};

export function getFirstTopicResourceInfo(
  sections: StudySummarySection[],
  flashcards: StudyFlashcard[],
  glossary: StudyGlossaryItem[]
): FirstTopicResourceInfo {
  const firstKey = chapterKey(sections[0]?.title);
  const unambiguous = Boolean(firstKey) &&
    sections.filter((section) => chapterKey(section.title) === firstKey).length === 1;

  const flashcardMatches = unambiguous
    ? flashcards.filter((item) => chapterKey(item.reference.sectionTitle) === firstKey).length
    : 0;
  const glossaryMatches = unambiguous
    ? glossary.filter((item) => chapterKey(item.chapterTitle) === firstKey).length
    : 0;

  return {
    totalFlashcards: flashcards.length,
    totalGlossaryTerms: glossary.length,
    flashcardCount: flashcardMatches > 0 ? flashcardMatches : null,
    glossaryCount: glossaryMatches > 0 ? glossaryMatches : null,
    hasFlashcards: flashcards.length > 0,
    hasGlossary: glossary.length > 0,
  };
}
