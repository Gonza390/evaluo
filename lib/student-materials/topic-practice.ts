import type { StudyQuestion } from './pedagogy';
import type { StudySummarySection } from './types';
import {
  selectDelayedReviewQuestion,
  type ReviewFollowup,
  type IndependentPracticeAnswer,
} from '@/lib/student-materials/delayed-review';
import { findSummarySectionForQuestion } from '@/lib/student-materials/summary-checks';
import {
  buildPdfProgress,
  topicAssessmentCount,
  type PdfTopicEvidence,
} from '@/lib/student-materials/progress';
import {
  isEligibleExamQuestion,
  normalizeAnswer,
  resolveExamQuestions,
} from '@/lib/student-materials/practice-questions';

export type TopicPracticeContext = {
  evidence: PdfTopicEvidence[];
  answeredItemKeys: string[];
  pendingTopics: string[];
  reviewFollowups?: ReviewFollowup[];
  independentAnswers?: IndependentPracticeAnswer[];
  loadError?: boolean;
};

export const emptyTopicPracticeContext: TopicPracticeContext = {
  evidence: [],
  answeredItemKeys: [],
  pendingTopics: [],
};

export function readPracticeSummarySections(value: unknown): StudySummarySection[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((section) =>
    section &&
    typeof section === 'object' &&
    typeof section.title === 'string' &&
    section.title.trim()
      ? [
          {
            title: section.title.trim(),
            body: typeof section.body === 'string' ? section.body : '',
          },
        ]
      : []
  );
}

/** Solo preguntas corregibles automáticamente sirven como primera evaluación de un tema. */
export function getTopicQuestionCounts(
  sections: StudySummarySection[],
  questions: StudyQuestion[]
) {
  const counts = sections.map(() => 0);
  const identities = new Set<string>();
  for (const question of questions) {
    if (question.type !== 'multiple_choice' || !isEligibleExamQuestion(question)) continue;
    const identity = `${normalizeAnswer(question.prompt)}|${normalizeAnswer(question.answer)}`;
    if (identities.has(identity)) continue;
    const index = findSummarySectionForQuestion(question, sections);
    if (index < 0) continue;
    identities.add(identity);
    counts[index] += 1;
  }
  return counts;
}

/** Priorizar oportunidades de evaluación, sin convertir un tema no preguntado en un fallo. */
export function selectTopicPracticeQuestions({
  questions,
  preferredQuestionIds = [],
  targetCount,
  sections,
  context = emptyTopicPracticeContext,
  now = Date.now(),
}: {
  questions: StudyQuestion[];
  preferredQuestionIds?: string[];
  targetCount: number;
  sections: StudySummarySection[];
  context?: TopicPracticeContext;
  now?: number;
}) {
  const eligible = questions.filter(isEligibleExamQuestion);
  if (!sections.length) return resolveExamQuestions(eligible, preferredQuestionIds, targetCount);
  const progress = buildPdfProgress(sections, [], context.loadError ? [] : context.evidence);
  const answered = new Set(
    context.answeredItemKeys.map((key) =>
      key.replace(/^(?:exercise|diagnostic):/, '').replace(/^summary-check:\d+:artifact:/, '')
    )
  );
  const pending = new Set(context.pendingTopics.map(normalizeAnswer));
  const groups = sections.map(() => [] as StudyQuestion[]);
  const extra: StudyQuestion[] = [];
  const identities = new Set<string>();
  for (const question of eligible) {
    const identity = `${normalizeAnswer(question.prompt)}|${normalizeAnswer(question.answer)}`;
    if (identities.has(identity)) continue;
    identities.add(identity);
    const index = findSummarySectionForQuestion(question, sections);
    if (index < 0) extra.push(question);
    else groups[index].push(question);
  }
  const assessmentCount = (index: number) => topicAssessmentCount(progress.topics[index]);
  const order = sections
    .map((_, index) => index)
    .sort((left, right) => {
      const leftCount = assessmentCount(left);
      const rightCount = assessmentCount(right);
      return (
        Number(leftCount > 0) - Number(rightCount > 0) ||
        Number(pending.has(normalizeAnswer(sections[right].title))) -
          Number(pending.has(normalizeAnswer(sections[left].title))) ||
        leftCount - rightCount ||
        left - right
      );
    });
  const preferred = new Set(preferredQuestionIds);
  const selected: StudyQuestion[] = [];
  const delayedQuestion =
    !context.loadError && targetCount > 0
      ? selectDelayedReviewQuestion({
          questions: groups.flat(),
          sections,
          followups: context.reviewFollowups ?? [],
          answers: context.independentAnswers ?? [],
          answeredIds: answered,
          now,
        })
      : undefined;
  if (delayedQuestion) {
    selected.push(delayedQuestion);
    for (let index = 0; index < groups.length; index++) {
      groups[index] = groups[index].filter((question) => question.id !== delayedQuestion.id);
    }
  }
  const levels: StudyQuestion['level'][] = [
    'recordar',
    'comprender',
    'aplicar',
    'comprender',
    'aplicar',
  ];
  const maxOpen = Math.max(1, Math.round(targetCount * 0.15));
  let openCount = 0;
  while (selected.length < targetCount) {
    let added = false;
    for (const index of order) {
      if (selected.length >= targetCount) break;
      const candidates = groups[index].filter(
        (question) =>
          question.type !== 'open' || (assessmentCount(index) > 0 && openCount < maxOpen)
      );
      const desired = levels[selected.length % levels.length];
      candidates.sort(
        (left, right) =>
          Number(answered.has(left.id)) - Number(answered.has(right.id)) ||
          Number(right.type === 'multiple_choice') - Number(left.type === 'multiple_choice') ||
          Number(right.level === desired) - Number(left.level === desired) ||
          Number(preferred.has(right.id)) - Number(preferred.has(left.id))
      );
      const question = candidates[0];
      if (!question) continue;
      selected.push(question);
      groups[index] = groups[index].filter((item) => item.id !== question.id);
      if (question.type === 'open') openCount += 1;
      added = true;
    }
    if (!added) break;
  }
  // Conservar ejercicios abiertos como práctica declarada, sin hacerlos pasar por cobertura corregida.
  for (const question of groups.flat()) {
    if (selected.length >= targetCount || openCount >= maxOpen) break;
    if (question.type !== 'open') continue;
    selected.push(question);
    openCount += 1;
  }
  // Una pregunta sin asociación puede servir para practicar, pero no cubre un tema arbitrario.
  extra.sort((left, right) => Number(answered.has(left.id)) - Number(answered.has(right.id)));
  for (const question of extra) {
    if (selected.length >= targetCount) break;
    if (question.type === 'open' && openCount >= maxOpen) continue;
    selected.push(question);
    if (question.type === 'open') openCount += 1;
  }
  return selected;
}
