import { normalizedAnswer, qualifiedQuestions, type PracticeQuestion } from './practice-modes';

export type FeedbackSource = {
  id: string;
  pageStart: number | null;
  sectionTitle?: string | null;
  excerpt: string;
  answer: string;
  options: string[];
};
type FeedbackEdit = { sourceId: unknown; explanation: unknown; evidence: unknown; page: unknown; sectionTitle?: unknown };
const genericFeedback = /(?:las dem[aá]s opciones (?:expresan|son)|se define como|seg[uú]n el (?:pdf|material)|la respuesta correcta es|se caracteriza por:|la relaci[oó]n presentada en el pdf)/iu;

export function needsPedagogicalFeedback(explanation: string): boolean {
  const content = explanation.trim();
  return content.length < 105 || genericFeedback.test(content);
}
const meaningful = (text: string): string[] => normalizedAnswer(text)
  .split(' ').filter(word => word.length >= 5 && !new Set([
    'porque','cuando','sobre','entre','desde','hasta','donde','puede',
    'deben','tiene','tienen','estas','estos','todos','forma','mismo',
  ]).has(word));

/**
 * AI is allowed to IMPROVE an explanation, never to alter the correct answer,
 * alternatives, page, or grading contract of a source question.
 *
 * A literal excerpt from the declared page is necessary, but not proof of
 * semantic entailment. Unsupported/boilerplate feedback is dropped.
 */
export function applyVerifiedFeedbackEdits(
  questions: PracticeQuestion[], raw: unknown, sources: FeedbackSource[],
): PracticeQuestion[] {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return questions;
  const edits = (raw as Record<string, unknown>).feedback;
  if (!Array.isArray(edits)) return questions;
  const indexed = new Map<string, FeedbackSource>();
  for (const src of sources) if (!indexed.has(src.id)) indexed.set(src.id, src);
  const approved = new Map<string, string>();
  for (const item of edits.slice(0, 5)) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const edit = item as FeedbackEdit;
    if (typeof edit.sourceId !== 'string' || typeof edit.explanation !== 'string' ||
      typeof edit.evidence !== 'string' ||
      !(edit.page === null || (Number.isInteger(edit.page) && typeof edit.page === 'number'))) continue;
    const src = indexed.get(edit.sourceId);
    const explanation = edit.explanation.trim(), evidence = edit.evidence.trim();
    if (!src || src.pageStart !== edit.page ||
      (src.pageStart === null && (!src.sectionTitle || edit.sectionTitle !== src.sectionTitle)) ||
      approved.has(edit.sourceId) ||
      evidence.length < 28 || evidence.length > 350 ||
      !normalizedAnswer(src.excerpt).includes(normalizedAnswer(evidence)) ||
      explanation.length < 110 || explanation.length > 550 ||
      genericFeedback.test(explanation) ||
      normalizedAnswer(explanation) === normalizedAnswer(src.answer)) continue;
    const explanationWords = new Set(meaningful(explanation));
    const answerWords = meaningful(src.answer);
    // The reasoning must actually talk about the right concept, not just a
    // generic learning tip, even if it supplied a valid copied citation.
    if (answerWords.length && !answerWords.some(w => explanationWords.has(w))) continue;
    approved.set(edit.sourceId, explanation);
  }
  return qualifiedQuestions(questions.map(q =>
    approved.has(q.id) ? { ...q, explanation: approved.get(q.id)! } : q
  ));
}

export function feedbackSourceFromArtifact(raw: unknown): FeedbackSource | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const q = raw as Record<string, unknown>;
  const ref = q.reference && typeof q.reference === 'object' && !Array.isArray(q.reference)
    ? q.reference as Record<string, unknown> : {};
  if (typeof q.id !== 'string' || typeof q.answer !== 'string' ||
      !Array.isArray(q.options) || !q.options.every(x => typeof x === 'string') ||
      !(ref.pageStart === null || (Number.isInteger(ref.pageStart) && typeof ref.pageStart === 'number' && ref.pageStart > 0)) ||
      (ref.pageStart === null && (typeof ref.sectionTitle !== 'string' || !ref.sectionTitle.trim())) ||
      typeof ref.excerpt !== 'string' || ref.excerpt.trim().length < 70) return null;
  return { id:q.id,pageStart:ref.pageStart as number | null,
    sectionTitle:typeof ref.sectionTitle === 'string' ? ref.sectionTitle : null,
    excerpt:ref.excerpt.slice(0,650),
    answer:q.answer,options:q.options };
}
