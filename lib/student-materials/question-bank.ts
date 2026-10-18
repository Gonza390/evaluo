import type { StudyQuestion } from '@/lib/student-materials/pedagogy';
import type { StudySummarySection } from '@/lib/student-materials/types';
import { findSummarySectionForQuestion } from '@/lib/student-materials/summary-checks';
import { getDistinctEligibleExamQuestions } from '@/lib/student-materials/practice-questions';

type QuestionBankContext = { pageCount?: number | null; topicCount: number };

function effectivePageCount(input: QuestionBankContext) {
  const pages = input.pageCount;
  if (typeof pages === 'number' && Number.isFinite(pages) && pages > 0) {
    return Math.min(300, Math.round(pages));
  }
  return Math.max(1, Math.round(input.topicCount / 1.5));
}

/** Multiplicar candidatos sólo en apuntes densos/extensos, sin rellenar con IA. */
export function resolveQuestionCategoryFactor(input: QuestionBankContext) {
  return Math.min(4, Math.max(1, Math.ceil(effectivePageCount(input) / 25)));
}

/** Objetivo orientativo, no cuota: se limita por preguntas distintas verificables. */
export function resolveQuestionBankTarget(input: QuestionBankContext) {
  return Math.min(
    120,
    Math.max(36, Math.round(effectivePageCount(input) * 1.35), Math.round(input.topicCount * 0.85))
  );
}

/**
 * Equilibrar el banco por tipo de conocimiento, tema y página. Evita elegir
 * únicamente los primeros conceptos del PDF cuando hay más candidatos
 * que capacidad para un banco completo.
 */
export function selectBalancedQuestionBank(
  questions: StudyQuestion[],
  targetCount: number
) {
  if (questions.length <= targetCount) return questions;
  const selected: StudyQuestion[] = [];
  const pending = [...questions];
  const usedTopics = new Set<string>();
  const usedChapters = new Set<string>();
  const usedPages = new Set<number>();
  const perKind = new Map<StudyQuestion['kind'], number>();
  let openCount = 0;
  const maxOpen = Math.max(4, Math.round(targetCount * 0.18));

  while (selected.length < targetCount && pending.length > 0) {
    let bestIndex = -1;
    let bestScore = -Infinity;
    for (let index = 0; index < pending.length; index += 1) {
      const item = pending[index]!;
      if (item.type === 'open' && openCount >= maxOpen) continue;
      const topic = item.topic?.trim().toLocaleLowerCase('es') ?? '';
      const page = item.reference.pageStart;
      const kindCount = perKind.get(item.kind) ?? 0;
      const chapter = item.chapterTitle?.trim().toLocaleLowerCase('es') ?? '';
      const score =
        (chapter && !usedChapters.has(chapter) ? 55 : 0) +
        (topic && !usedTopics.has(topic) ? 9 : 0) +
        (page && !usedPages.has(page) ? 7 : 0) +
        (kindCount === 0 ? 6 : 0) -
        kindCount * 1.2 +
        (item.level === 'aplicar' ? 2 : item.level === 'comprender' ? 1 : 0) +
        (item.type === 'multiple_choice' ? 1 : 0);
      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    }
    if (bestIndex < 0) break;
    const [item] = pending.splice(bestIndex, 1);
    if (!item) break;
    selected.push(item);
    if (item.topic) usedTopics.add(item.topic.trim().toLocaleLowerCase('es'));
    if (item.chapterTitle) usedChapters.add(item.chapterTitle.trim().toLocaleLowerCase('es'));
    if (item.reference.pageStart) usedPages.add(item.reference.pageStart);
    perKind.set(item.kind, (perKind.get(item.kind) ?? 0) + 1);
    if (item.type === 'open') openCount += 1;
  }
  return selected;
}


/**
 * Muestreo estratificado por páginas del PDF. El selector anterior terminaba
 * tras encontrar N páginas al principio, aunque hubiera contenido al final.
 * Priorizamos una evidencia por página a lo largo de TODO el documento antes
 * de repetir páginas; el resultado es determinístico para un mismo modelo.
 */
export function selectSourceDistributedItems<T>(
  items: T[],
  limit: number,
  getPages: (item: T) => number[] | undefined
): T[] {
  if (limit <= 0 || items.length === 0) return [];
  if (items.length <= limit) return [...items];

  const byPage = new Map<number, T[]>();
  const noPage: T[] = [];
  for (const item of items) {
    const page = (getPages(item) ?? [])
      .filter((value) => Number.isInteger(value) && value > 0)
      .sort((left, right) => left - right)[0];
    if (!page) {
      noPage.push(item);
      continue;
    }
    const existing = byPage.get(page) ?? [];
    existing.push(item);
    byPage.set(page, existing);
  }

  const pages = [...byPage.keys()].sort((left, right) => left - right);
  if (pages.length === 0) return noPage.slice(0, limit);

  const selected: T[] = [];
  const sampleCount = Math.min(limit, pages.length);
  // Incluir ambos extremos y puntos intermedios incluso con cupos bajos.
  for (let position = 0; position < sampleCount; position += 1) {
    const index = sampleCount === 1
      ? Math.floor((pages.length - 1) / 2)
      : Math.round((position * (pages.length - 1)) / (sampleCount - 1));
    const group = byPage.get(pages[index]!)!;
    const item = group.shift();
    if (item) selected.push(item);
  }
  if (selected.length >= limit) return selected;

  // Repartir las restantes en rondas, no concentrarlas en las primeras páginas.
  let added = true;
  while (selected.length < limit && added) {
    added = false;
    for (const page of pages) {
      if (selected.length >= limit) break;
      const item = byPage.get(page)?.shift();
      if (!item) continue;
      selected.push(item);
      added = true;
    }
  }
  for (const item of noPage) {
    if (selected.length >= limit) break;
    selected.push(item);
  }
  return selected;
}

export type PracticeCoverageAudit = {
  eligibleQuestionCount: number;
  autoCorrectableQuestionCount: number;
  summaryChapterCount: number;
  chaptersWithQuestions: number;
  chaptersWithAutoCorrectableQuestions: number;
  chaptersWithoutAutoCorrectableQuestions: string[];
  questionsWithoutReliableChapter: number;
  distinctReferencedPages: number;
  pageReferenceRatio: number | null;
  quartersWithReferencedQuestions: number;
  status: 'unknown' | 'limited' | 'distributed';
};

/** Cobertura de evaluación, separada del éxito de extracción del PDF. */
export function analyzeQuestionBankCoverage(
  questions: StudyQuestion[],
  sections: StudySummarySection[],
  pageCount: number | null
): PracticeCoverageAudit {
  const eligible = getDistinctEligibleExamQuestions(questions);
  const byChapter = sections.map(() => ({ all: 0, auto: 0 }));
  const pageNumbers = new Set<number>();
  let unassigned = 0;
  let autoCount = 0;
  for (const item of eligible) {
    if (item.type === 'multiple_choice') autoCount += 1;
    const page = item.reference.pageStart;
    if (page !== null && Number.isInteger(page) && page > 0 &&
        (pageCount === null || page <= pageCount)) pageNumbers.add(page);
    const index = findSummarySectionForQuestion(item, sections);
    if (index < 0) {
      unassigned += 1;
      continue;
    }
    byChapter[index]!.all += 1;
    if (item.type === 'multiple_choice') byChapter[index]!.auto += 1;
  }
  const distinctPages = [...pageNumbers];
  const validPageCount = pageCount !== null && Number.isInteger(pageCount) && pageCount > 0;
  const quarters = validPageCount
    ? new Set(distinctPages.map((page) => Math.min(4, Math.ceil(page * 4 / pageCount)))).size
    : 0;
  const evaluatedChapters = byChapter.filter((item) => item.auto > 0).length;
  const ratio = validPageCount ? distinctPages.length / pageCount : null;
  const status =
    sections.length === 0 || !validPageCount
      ? 'unknown'
      : evaluatedChapters / sections.length < 0.75 ||
          (pageCount >= 25 && quarters < 4)
        ? 'limited'
        : 'distributed';

  return {
    eligibleQuestionCount: eligible.length,
    autoCorrectableQuestionCount: autoCount,
    summaryChapterCount: sections.length,
    chaptersWithQuestions: byChapter.filter((item) => item.all > 0).length,
    chaptersWithAutoCorrectableQuestions: evaluatedChapters,
    chaptersWithoutAutoCorrectableQuestions: sections
      .filter((_, index) => byChapter[index]!.auto === 0)
      .map((section) => section.title),
    questionsWithoutReliableChapter: unassigned,
    distinctReferencedPages: pageNumbers.size,
    pageReferenceRatio: ratio === null ? null : Math.round(ratio * 1000) / 1000,
    quartersWithReferencedQuestions: quarters,
    status,
  };
}
