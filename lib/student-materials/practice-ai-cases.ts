import { normalizedAnswer, qualifiedQuestions, type PracticeQuestion } from './practice-modes';

export type SourceFragment = { pageStart: number; text: string };
type GeneratedCase = {
  scenario: unknown; prompt: unknown; options: unknown; answer: unknown;
  explanation: unknown; evidence: unknown; page: unknown;
};
/**
 * Reject unsourced AI cases. Evidence must be verbatim (allowing typography/spacing
 * differences), on the declared source page; distractors must name concepts
 * actually present in the PDF's canonical model.
 */
export function verifyGeneratedPracticeCases(
  raw: unknown, source: SourceFragment[], knownTerms: string[],
): PracticeQuestion[] {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return [];
  const record = raw as Record<string, unknown>;
  if (!Array.isArray(record.cases)) return [];
  const names = new Set(knownTerms.map(normalizedAnswer).filter(Boolean));
  const verified: PracticeQuestion[] = [];
  for (const [index, entry] of record.cases.slice(0, 6).entries()) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;
    const c = entry as GeneratedCase;
    if (typeof c.scenario !== 'string' || typeof c.prompt !== 'string' ||
        typeof c.answer !== 'string' || typeof c.explanation !== 'string' ||
        typeof c.evidence !== 'string' || !Array.isArray(c.options) ||
        !Number.isInteger(c.page) || typeof c.page !== 'number') continue;
    const scenario = c.scenario.trim(), prompt = c.prompt.trim(), evidence = c.evidence.trim();
    if (scenario.length < 65 || scenario.length > 430 ||
        prompt.length < 25 || prompt.length > 240 ||
        c.explanation.length < 40 || c.explanation.length > 450 ||
        evidence.length < 28 || evidence.length > 380) continue;
    const onPage = source.some(chunk => chunk.pageStart === c.page &&
      normalizedAnswer(chunk.text).includes(normalizedAnswer(evidence)));
    if (!onPage || source.some(chunk => normalizedAnswer(chunk.text).includes(normalizedAnswer(scenario)))) continue;
    const options = c.options.filter((option): option is string => typeof option === 'string');
    if (options.length !== c.options.length || options.length !== 4 ||
        options.some(option => !names.has(normalizedAnswer(option))) ||
        !options.includes(c.answer) ||
        !normalizedAnswer(evidence).includes(normalizedAnswer(c.answer))) continue;
    const caseQuestion: PracticeQuestion = {
      id: 'ai-case-' + index + '-' + c.page,
      prompt: scenario + '\n\n' + prompt, options,
      answer: c.answer, explanation: c.explanation.trim(),
      level: 'aplicar', kind: 'ai-source-backed', pageStart: c.page,
      chapterTitle: 'Situaciones de aplicación',
    };
    if (qualifiedQuestions([caseQuestion]).length) verified.push(caseQuestion);
  }
  return qualifiedQuestions(verified).slice(0, 4);
}
