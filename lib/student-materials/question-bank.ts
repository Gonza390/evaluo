import type { StudyQuestion } from '@/lib/student-materials/pedagogy';
import type { StudySummarySection } from '@/lib/student-materials/types';
import { findSummarySectionForQuestion } from '@/lib/student-materials/summary-checks';
import { getDistinctEligibleExamQuestions, isEligibleExamQuestion, normalizeAnswer } from '@/lib/student-materials/practice-questions';

type QuestionBankContext = { pageCount?: number | null; topicCount: number };

export const MIN_TOPIC_AUTO_CORRECTABLE_QUESTIONS = 6;

/** No contar preguntas con opciones duplicadas o sin respaldo verificable. */
function isReliableTopicQuestion(question: StudyQuestion) {
  if (question.type !== 'multiple_choice' || !isEligibleExamQuestion(question)) return false;
  const options = question.options.map((option) =>
    normalizeAnswer(option).replace(/[^a-z0-9\s]/g, '').trim()
  );
  if (options.some((option) => !option) || new Set(options).size !== options.length) return false;
  return (question.reference.pageStart !== null && question.reference.pageStart > 0) ||
    question.reference.excerpt.trim().length >= 20;
}

function chapterQuestionScore(
  question: StudyQuestion,
  picked: StudyQuestion[]
) {
  const usedTopics = new Set(picked.map((item) => normalizeAnswer(item.topic ?? '')));
  const usedKinds = new Set(picked.map((item) => item.kind));
  const usedPages = new Set(picked.map((item) => item.reference.pageStart));
  return (usedKinds.has(question.kind) ? 0 : 30) +
    (usedTopics.has(normalizeAnswer(question.topic ?? '')) ? 0 : 24) +
    (usedPages.has(question.reference.pageStart) ? 0 : 8) +
    (question.level === 'aplicar' ? 3 : question.level === 'comprender' ? 2 : 1);
}

/** Reserva una ronda por capítulo antes de repetir; sólo ítems corregibles y trazables. */
function reserveTopicQuestions(
  questions: StudyQuestion[],
  sections: StudySummarySection[],
  targetCount: number
): StudyQuestion[] {
  if (sections.length === 0 || targetCount <= 0) return [];
  const distinct = getDistinctEligibleExamQuestions(questions);
  const buckets = sections.map(() => [] as StudyQuestion[]);
  for (const question of distinct) {
    if (!isReliableTopicQuestion(question)) continue;
    const chapter = findSummarySectionForQuestion(question, sections);
    if (chapter >= 0) buckets[chapter]!.push(question);
  }
  const chosen: StudyQuestion[] = [];
  const used = new Set<StudyQuestion>();
  for (let round = 0; round < MIN_TOPIC_AUTO_CORRECTABLE_QUESTIONS; round += 1) {
    for (const bucket of buckets) {
      if (chosen.length >= targetCount) return chosen;
      const pickedHere = chosen.filter((question) => bucket.includes(question));
      const candidate = bucket
        .filter((question) => !used.has(question))
        .sort((a, b) => chapterQuestionScore(b, pickedHere) - chapterQuestionScore(a, pickedHere))[0];
      if (!candidate) continue;
      chosen.push(candidate);
      used.add(candidate);
    }
  }
  return chosen;
}

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
  targetCount: number,
  sections: StudySummarySection[] = []
) {
  if (questions.length <= targetCount) return questions;
  const selected = reserveTopicQuestions(questions, sections, targetCount);
  const reserved = new Set(selected);
  const pending = questions.filter((question) => !reserved.has(question));
  const usedTopics = new Set<string>();
  const usedChapters = new Set<string>();
  const usedPages = new Set<number>();
  const perKind = new Map<StudyQuestion['kind'], number>();
  let openCount = 0;
  const maxOpen = Math.max(4, Math.round(targetCount * 0.18));
  for (const item of selected) {
    if (item.topic) usedTopics.add(item.topic.trim().toLocaleLowerCase('es'));
    if (item.chapterTitle) usedChapters.add(item.chapterTitle.trim().toLocaleLowerCase('es'));
    if (item.reference.pageStart) usedPages.add(item.reference.pageStart);
    perKind.set(item.kind, (perKind.get(item.kind) ?? 0) + 1);
    if (item.type === 'open') openCount += 1;
  }

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
  minimumAutoCorrectablePerChapter: number;
  chaptersMeetingMinimum: number;
  chaptersBelowMinimum: string[];
  chaptersWithLowDiversity: string[];
  chapterAssessments: Array<{
    title: string;
    validAutoCorrectable: number;
    distinctKinds: number;
    distinctConcepts: number;
    sourceBacked: number;
  }>;
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
  const robust = getDistinctEligibleExamQuestions(questions).filter(isReliableTopicQuestion);
  const chapterBuckets = sections.map(() => [] as StudyQuestion[]);
  for (const question of robust) {
    const chapterIndex = findSummarySectionForQuestion(question, sections);
    if (chapterIndex >= 0) chapterBuckets[chapterIndex]!.push(question);
  }
  const chapterAssessments = sections.map((section, index) => {
    const bucket = chapterBuckets[index]!;
    return {
      title: section.title,
      validAutoCorrectable: bucket.length,
      distinctKinds: new Set(bucket.map((item) => item.kind)).size,
      distinctConcepts: new Set(bucket.map((item) => normalizeAnswer(item.topic ?? ''))).size,
      sourceBacked: bucket.filter((item) =>
        item.reference.pageStart !== null || item.reference.excerpt.trim().length >= 20
      ).length,
    };
  });
  const chaptersBelowMinimum = chapterAssessments
    .filter((chapter) => chapter.validAutoCorrectable < MIN_TOPIC_AUTO_CORRECTABLE_QUESTIONS)
    .map((chapter) => chapter.title);
  // Advertencia informativa: seis preguntas del mismo concepto y formato no equivalen
  // a seis oportunidades independientes de aprendizaje.
  const chaptersWithLowDiversity = chapterAssessments
    .filter((chapter) => chapter.validAutoCorrectable >= MIN_TOPIC_AUTO_CORRECTABLE_QUESTIONS &&
      chapter.distinctKinds < 2 && chapter.distinctConcepts < 2)
    .map((chapter) => chapter.title);
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
    minimumAutoCorrectablePerChapter: MIN_TOPIC_AUTO_CORRECTABLE_QUESTIONS,
    chaptersMeetingMinimum: chapterAssessments.length - chaptersBelowMinimum.length,
    chaptersBelowMinimum,
    chaptersWithLowDiversity,
    chapterAssessments,
  };
}
