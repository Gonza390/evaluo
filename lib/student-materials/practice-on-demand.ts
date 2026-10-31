import {
  buildSourceBackedCases, qualifiedQuestions, type PracticeQuestion,
} from './practice-modes';
import type { CanonicalPedagogicalModel } from './types';
import { needsPedagogicalFeedback } from './practice-feedback-quality';

/** Never included in the upload/processing pipeline. Only an explicit Practicar action uses it. */
export const PRACTICE_BANK_VERSION = 2; // invalidates pre-editorial cached banks
export const ON_DEMAND_PRACTICE_MODES = ['unir','completar','casos','mixto','simulacro'] as const;
export type OnDemandPracticeMode = typeof ON_DEMAND_PRACTICE_MODES[number];
export type PracticeBankPayload = {
  questions: PracticeQuestion[];
  cases: PracticeQuestion[];
  version: number;
};
export function isPracticeMode(value: unknown): value is OnDemandPracticeMode {
  return typeof value === 'string' &&
    (ON_DEMAND_PRACTICE_MODES as readonly string[]).includes(value);
}
export function sourceFingerprint(content: string | null, materialId: string, artifactVersion: number | null) {
  return (content || 'legacy:' + materialId) + ':artifacts:' + (artifactVersion ?? 0);
}
function plainQuestion(value: unknown): value is PracticeQuestion {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const q = value as Record<string, unknown>;
  return typeof q.id === 'string' && q.id.length <= 140 &&
    typeof q.prompt === 'string' && typeof q.answer === 'string' &&
    typeof q.explanation === 'string' && Array.isArray(q.options) &&
    q.options.every(x => typeof x === 'string' && x.length <= 400) &&
    (q.pageStart === null || (typeof q.pageStart === 'number' &&
      Number.isInteger(q.pageStart) && q.pageStart > 0)) &&
    (q.chapterTitle == null || typeof q.chapterTitle === 'string') &&
    typeof q.level === 'string';
}
export function safePracticeBank(raw: unknown): PracticeBankPayload | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  if (r.version !== PRACTICE_BANK_VERSION || !Array.isArray(r.questions) || !Array.isArray(r.cases)) return null;
  // Never trust stored JSONB blindly, even if inserted via an authenticated route.
  const questions = qualifiedQuestions(r.questions.filter(plainQuestion)).slice(0, 35);
  const cases = qualifiedQuestions(r.cases.filter(plainQuestion)).slice(0, 14);
  return { version: PRACTICE_BANK_VERSION, questions, cases };
}
export function buildPracticeBank(
  raw: unknown,
  model: CanonicalPedagogicalModel | null,
  enhancedCases: PracticeQuestion[] = [],
  mode?: OnDemandPracticeMode,
): PracticeBankPayload {
  const row = raw && typeof raw === 'object' && !Array.isArray(raw)
    ? raw as Record<string, unknown> : {};
  const rawQuestions = Array.isArray(row.questions) ? row.questions : [];
  const mapped: unknown[] = rawQuestions.map((q: unknown) => {
    const a = q && typeof q === 'object' && !Array.isArray(q) ? q as Record<string, unknown> : {};
    const ref = a.reference && typeof a.reference === 'object' && !Array.isArray(a.reference)
      ? a.reference as Record<string, unknown> : {};
    return {
      id: a.id, prompt: a.prompt, options: a.options, answer: a.answer,
      explanation: a.explanation, level: a.level, pageStart: ref.pageStart ?? null,
      chapterTitle: a.chapterTitle ?? null, kind: a.kind,
    };
  });
  const questions = qualifiedQuestions(mapped.filter(plainQuestion)).slice(0, 35);
  // Persist the smallest mode-specific payload. Especially avoid duplicating
  // 35 questions into Unir/Completar caches that use only glossary pairs.
  const needsQuestions = !mode || mode === 'simulacro' || mode === 'mixto';
  const needsCases = !mode || mode === 'casos' || mode === 'mixto';
  const cases = needsCases
    ? qualifiedQuestions([...enhancedCases, ...buildSourceBackedCases(model)]).slice(0, 14)
    : [];
  return { version: PRACTICE_BANK_VERSION, questions: needsQuestions ? questions : [], cases };
}
/** Do not substitute fabricated exercises when source coverage is inadequate. */
export function sufficientPracticeBank(bank: PracticeBankPayload, mode: OnDemandPracticeMode, matchingPairs = 0) {
  if (mode === 'unir' || mode === 'completar') return matchingPairs >= 3;
  if (mode === 'casos') return bank.cases.length >= 2;
  if (mode === 'mixto') return bank.questions.length >= 4 || matchingPairs >= 4;
  return bank.questions.filter(q => q.pageStart !== null).length >= 4;
}

/**
 * QA diagnostics, not an automatic pedagogical certification.
 * Recognition from a definition is NOT evidence of application.
 * This report is deliberately separate from student grades and progress.
 */
export function assessPracticeBankQuality(
  bank: PracticeBankPayload, mode: OnDemandPracticeMode,
): {
  questionCount: number;
  contextualRecognitionCount: number;
  applicationCount: number;
  weakFeedbackCount: number;
  uncitedQuestionCount: number;
  depth: 'not_evaluated' | 'recognition_only' | 'includes_application';
} {
  const contextualRecognitionCount = bank.cases.filter(q => q.level === 'comprender').length;
  const applicationCount = [...bank.questions, ...bank.cases]
    .filter(q => q.level === 'aplicar').length;
  return {
    questionCount: bank.questions.length,
    contextualRecognitionCount,
    applicationCount,
    weakFeedbackCount: bank.questions.filter(q => needsPedagogicalFeedback(q.explanation)).length,
    uncitedQuestionCount: bank.questions.filter(q => q.pageStart === null).length,
    // Unir/Completar are sourced from glossary, which this question bank does
    // not load; reporting zero as quality would be misleading.
    depth: mode === 'unir' || mode === 'completar'
      ? 'not_evaluated'
      : applicationCount ? 'includes_application' : 'recognition_only',
  };
}
