import type { StudyQuestion } from './pedagogy';
import type { StudySummarySection } from './types';
import { findSummarySectionForQuestion } from '@/lib/student-materials/summary-checks';
import { normalizeAnswer } from '@/lib/student-materials/practice-questions';

export const REVIEW_DELAY_MS = 24 * 60 * 60 * 1000;

export type ReviewFollowup = {
  errorId: string;
  topic: string;
  correctAnswer: string;
  originalPrompt: string;
  reviewPrompt: string;
  reinforcedAt: string;
};

export type IndependentPracticeAnswer = { itemKey: string; answeredAt: string };

/** Selección conservadora: mismo tema y respuesta conceptual específica, otro caso aún no visto. */
export function selectDelayedReviewQuestion({
  questions,
  sections,
  followups,
  answers,
  answeredIds,
  now,
}: {
  questions: StudyQuestion[];
  sections: StudySummarySection[];
  followups: ReviewFollowup[];
  answers: IndependentPracticeAnswer[];
  answeredIds: Set<string>;
  now: number;
}): StudyQuestion | undefined {
  for (const followup of [...followups].sort((a, b) =>
    a.reinforcedAt.localeCompare(b.reinforcedAt)
  )) {
    const reinforcedAt = Date.parse(followup.reinforcedAt);
    if (!Number.isFinite(reinforcedAt) || now < reinforcedAt + REVIEW_DELAY_MS) continue;
    const answer = normalizeAnswer(followup.correctAnswer);
    if (answer.length < 5 || /^(verdadero|falso|correcto|incorrecto|todas|ninguna)$/.test(answer))
      continue;
    const sectionIndex = findSummarySectionForQuestion(
      {
        topic: followup.topic,
        prompt: followup.originalPrompt,
        answer: followup.correctAnswer,
        reference: { sectionTitle: followup.topic, pageStart: null, pageEnd: null, excerpt: '' },
      },
      sections
    );
    if (sectionIndex < 0) continue;
    const alternatives = questions.filter(
      (question) =>
        question.type === 'multiple_choice' &&
        findSummarySectionForQuestion(question, sections) === sectionIndex &&
        normalizeAnswer(question.answer) === answer &&
        normalizeAnswer(question.prompt) !== normalizeAnswer(followup.originalPrompt) &&
        normalizeAnswer(question.prompt) !== normalizeAnswer(followup.reviewPrompt)
    );
    // Un intento posterior sin ayuda (bien o mal) cierra esta oportunidad; si falla, vuelve a errores.
    const alreadyChecked = alternatives.some((question) =>
      answers.some(
        (event) =>
          event.itemKey === `exercise:${question.id}` &&
          Date.parse(event.answeredAt) >= reinforcedAt + REVIEW_DELAY_MS &&
          Date.parse(event.answeredAt) <= now
      )
    );
    if (alreadyChecked) continue;
    const fresh = alternatives.find((question) => !answeredIds.has(question.id));
    if (fresh) return fresh;
  }
}
