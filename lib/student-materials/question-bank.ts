import type { StudyQuestion } from '@/lib/student-materials/pedagogy';

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
      const score =
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
    if (item.reference.pageStart) usedPages.add(item.reference.pageStart);
    perKind.set(item.kind, (perKind.get(item.kind) ?? 0) + 1);
    if (item.type === 'open') openCount += 1;
  }
  return selected;
}
