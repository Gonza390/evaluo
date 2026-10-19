import {
  buildSummaryCheckPlan,
  findSummarySectionForQuestion,
} from '@/lib/student-materials/summary-checks';
import type { PedagogicalArtifacts } from '@/lib/student-materials/pedagogy';
import type { StudySummarySection } from '@/lib/student-materials/types';

export type MaterialAnswerInput = {
  materialId: string;
  resultId?: string;
  sourceType: 'exercise' | 'diagnostic' | 'flashcard';
  itemKey: string;
  wasCorrect: boolean;
  topic?: string | null;
  prompt: string;
  explanation?: string | null;
  correctAnswer?: string | null;
  selectedAnswer?: string | null;
  reference?: {
    pageStart?: number | null;
    pageEnd?: number | null;
    sectionTitle?: string | null;
    excerpt?: string | null;
  } | null;
};

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Corregir contra el contenido del servidor; nunca aceptar la respuesta correcta del cliente. */
export function resolveMaterialAnswer(
  input: MaterialAnswerInput,
  artifacts: PedagogicalArtifacts,
  sections: StudySummarySection[]
) {
  if (input.sourceType === 'flashcard') {
    const match = /^flashcard:(\d+)$/.exec(input.itemKey);
    const matching = artifacts.flashcards.filter(
      (card) => normalize(card.front) === normalize(input.prompt)
    );
    const card = match && matching.length === 1 ? matching[0] : null;
    if (!card || normalize(card.front) !== normalize(input.prompt)) return null;
    const index = findSummarySectionForQuestion(
      { prompt: card.front, answer: card.back, reference: card.reference },
      sections
    );
    return {
      evidenceKind: 'self_report' as const,
      wasCorrect: input.wasCorrect,
      topic: sections[index]?.title ?? card.reference.sectionTitle,
      prompt: card.front,
      explanation: card.back,
      correctAnswer: card.back,
      selectedAnswer: input.wasCorrect ? card.back : 'No lo sabía',
      reference: card.reference,
    };
  }

  let question;
  if (input.sourceType === 'exercise' && input.itemKey.startsWith('summary-check:')) {
    const match = /^summary-check:(\d+):(.+)$/.exec(input.itemKey);
    const index = match ? Number(match[1]) : -1;
    if (index < 0 || index >= sections.length) return null;
    question = buildSummaryCheckPlan(sections, artifacts)[index]?.questions.find(
      (q) => q.id === match?.[2]
    );
  } else {
    const prefix = input.sourceType === 'diagnostic' ? 'diagnostic:' : 'exercise:';
    if (!input.itemKey.startsWith(prefix)) return null;
    question = artifacts.questions.find((q) => q.id === input.itemKey.slice(prefix.length));
  }
  if (!question || normalize(question.prompt) !== normalize(input.prompt)) return null;
  const assessed = !('type' in question) || question.type === 'multiple_choice';
  if (assessed && !question.options.includes(input.selectedAnswer ?? '')) return null;
  const index = findSummarySectionForQuestion(question, sections);
  return {
    evidenceKind: assessed ? ('assessed' as const) : ('self_report' as const),
    wasCorrect: assessed
      ? normalize(input.selectedAnswer ?? '') === normalize(question.answer)
      : input.wasCorrect,
    topic: sections[index]?.title ?? question.topic ?? question.reference.sectionTitle,
    prompt: question.prompt,
    explanation: question.explanation,
    correctAnswer: question.answer,
    selectedAnswer: (input.selectedAnswer ?? '').slice(0, 4000),
    reference: question.reference,
  };
}
