import { isAdministrativeMultipleChoice } from './nonacademic-metadata';

type GradedQuestion = {
  prompt: string;
  answer: string;
  options?: readonly string[];
  kind?: string | null;
  sectionTitle?: string | null;
  sourceExcerpt?: string | null;
};

function norm(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/gu, '')
    .toLowerCase().replace(/[^a-z0-9]+/gu, ' ').replace(/\s+/gu,' ').trim();
}

/**
 * A list of resources, attributes or causes is not a chronological procedure.
 * Do not turn it into a "which sequence of steps?" exercise.
 * This gate is intentionally narrow: ambiguous cases are rejected, never
 * relabeled as an application question.
 */
export function isNonSequentialProcess(input: { title: string; steps: readonly string[] }): boolean {
  const title = norm(input.title);
  if (/^(?:recursos|causas|condiciones|caracteristicas|atributos|tipos|elementos|componentes|factores|principios|herramientas|requisitos)\b/u.test(title)) {
    return true;
  }
  const descriptions = input.steps.filter(step =>
    /^(?:es (?:un|una|el|la|integrado|reiterativo|continuo|continua)|son |se caracteriza|consiste en|permite |representa |se trata de )/u.test(norm(step))
  );
  // Multiple properties of a process are not ordered actions of that process.
  return input.steps.length >= 2 && descriptions.length >= 2 &&
    descriptions.length / input.steps.length >= 0.6;
}

function quotedSegments(text: string): string[] {
  const results: string[] = [];
  const regex = /“([^”]*)”/gu;
  for (const match of text.matchAll(regex)) results.push(match[1] ?? '');
  return results;
}

export function malformedClassificationClue(prompt: string): boolean {
  const opening = (prompt.match(/“/gu)??[]).length;
  const closing = (prompt.match(/”/gu)??[]).length;
  if (opening !== closing) return true;
  const clues = quotedSegments(prompt);
  if (!clues.length) return false;
  return clues.some(text => {
    const t=text.trim();
    // OCR lists often leak enumerator from the next bullet into the clue
    // ("análisis de factores internos y externos 4.").
    return /(?:^|\s)\d{1,2}\.\s*$/u.test(t) ||
      /\b(?:analisi|integr[a-z]{0,3})\s*$/u.test(norm(t)) ||
      (t.length>90 && !/[.!?…]$/u.test(t) && /\s(?:de|la|el|los|las|sus|para|por|en)$/u.test(norm(t)));
  });
}

/** Structural QA, not an assertion that all other questions are semantically
 * true. Sources must still be checked separately for factual correctness. */
export function practiceQuestionQualityIssue(q: GradedQuestion): string | null {
  if (isAdministrativeMultipleChoice(q)) return 'nonacademic_document_metadata';

  if (q.kind === 'process') {
    const orderedPrompt = /(?:secuencia|etapas|pasos|proceso|→)/iu.test(q.prompt);
    const quoted = quotedSegments(q.prompt);
    if (orderedPrompt && (
      isNonSequentialProcess({title:q.answer,steps:quoted}) ||
      (quoted.length >= 2 && quoted.some(s=>norm(s).length<9))
    )) return 'nonsequential_process_list';
  }
  if (q.kind === 'classification' && malformedClassificationClue(q.prompt)) {
    return 'malformed_classification_clue';
  }
  return null;
}
