import type { StudyFlashcard, StudyQuestion } from './pedagogy';
import type { StudyGlossaryItem, StudySummarySection } from './types';
import { findSummarySectionForQuestion } from './summary-checks';
import { getTopicStudyResources } from './topic-study-resources';

/**
 * Alcance académico de una práctica lanzada desde el plan de estudio.
 *
 * Una actividad del plan se registra como hecha para un tema concreto, así que
 * sus ejercicios tienen que salir de ESE tema. La pertenencia se decide solo con
 * evidencia verificable (páginas citadas por la sección o título de apartado):
 * ante la duda, el contenido se descarta y nunca se reparte por posición.
 */
export type PlanTopicScope = {
  index: number;
  title: string;
  /** Páginas del PDF que cita únicamente este tema. Vacío en documentos Word. */
  pages: ReadonlySet<number>;
};

const CITATION =
  /(?:Ver en PDF|View in PDF)\s*·\s*(?:p[aá]ginas?|pages?)\s+([\d,\s]+(?:(?:y|and)\s*\d+)?)/giu;

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/^(?:seccion|capitulo|tema|section|chapter|topic)\s+(?:de\s+|of\s+)?/, '')
    .replace(/^\d+\s+/, '')
    .trim();
}

function citedPages(body: string): number[] {
  const pages = [...body.matchAll(CITATION)]
    .flatMap((match) => (match[1] ?? '').match(/\d+/gu) ?? [])
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0);
  return [...new Set(pages)];
}

/**
 * Devuelve null si el índice no existe. Una página citada por más de un tema no
 * sirve como evidencia de pertenencia y se excluye del alcance.
 */
export function resolvePlanTopicScope(
  sections: StudySummarySection[],
  index: number | undefined
): PlanTopicScope | null {
  if (index === undefined || !Number.isInteger(index) || index < 0) return null;
  const section = sections[index];
  if (!section) return null;
  const shared = new Set<number>();
  sections.forEach((other, otherIndex) => {
    if (otherIndex !== index) citedPages(other.body).forEach((page) => shared.add(page));
  });
  return {
    index,
    title: section.title,
    pages: new Set(citedPages(section.body).filter((page) => !shared.has(page))),
  };
}

/** Fragmentos del documento (PDF por página, Word por título de apartado). */
export function fragmentInPlanTopic(
  scope: PlanTopicScope,
  fragment: { pageStart: number | null; sectionTitle?: string | null }
): boolean {
  if (fragment.pageStart !== null) return scope.pages.has(fragment.pageStart);
  const title = fragment.sectionTitle ? normalize(fragment.sectionTitle) : '';
  return title !== '' && title === normalize(scope.title);
}

/** Ejercicios ya construidos (casos, preguntas, pares) con página o capítulo. */
export function practiceItemInPlanTopic(
  scope: PlanTopicScope,
  item: { pageStart?: number | null; chapterTitle?: string | null }
): boolean {
  if (typeof item.pageStart === 'number') return scope.pages.has(item.pageStart);
  const title = item.chapterTitle ? normalize(item.chapterTitle) : '';
  return title !== '' && title === normalize(scope.title);
}

export function questionsForPlanTopic(
  questions: StudyQuestion[],
  sections: StudySummarySection[],
  scope: PlanTopicScope
): StudyQuestion[] {
  return questions.filter((question) => findSummarySectionForQuestion(question, sections) === scope.index);
}

/** Conceptos y tarjetas del tema; las tarjetas conservan identidad de objeto. */
export function resourcesForPlanTopic(
  sections: StudySummarySection[],
  glossary: StudyGlossaryItem[],
  flashcards: StudyFlashcard[],
  scope: PlanTopicScope
): { concepts: StudyGlossaryItem[]; flashcards: StudyFlashcard[] } {
  return getTopicStudyResources(sections, glossary, flashcards, scope.index);
}

/** Entrada validada de `topicIndex` en cuerpos JSON (0 a 399, como el plan). */
export function readTopicIndex(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 399
    ? value
    : undefined;
}
