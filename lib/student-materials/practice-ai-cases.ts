import { normalizedAnswer, qualifiedQuestions, type PracticeQuestion } from './practice-modes';

export type SourceFragment = { pageStart: number | null; sectionTitle?: string | null; text: string };
type GeneratedCase = {
  scenario: unknown; prompt: unknown; options: unknown; answer: unknown;
  explanation: unknown; evidence: unknown; page: unknown; sectionTitle?: unknown;
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
  for (const [index, entry] of record.cases.slice(0, 12).entries()) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;
    const c = entry as GeneratedCase;
    if (typeof c.scenario !== 'string' || typeof c.prompt !== 'string' ||
        typeof c.answer !== 'string' || typeof c.explanation !== 'string' ||
        typeof c.evidence !== 'string' || !Array.isArray(c.options) ||
        !(c.page === null || (Number.isInteger(c.page) && typeof c.page === 'number'))) continue;
    const scenario = c.scenario.trim(), prompt = c.prompt.trim(), evidence = c.evidence.trim();
    if (scenario.length < 65 || scenario.length > 430 ||
        prompt.length < 25 || prompt.length > 240 ||
        c.explanation.length < 80 || c.explanation.length > 450 ||
        evidence.length < 28 || evidence.length > 380) continue;
    // A scenario that supplies its own answer, or a definition disguised
    // as a case, does not measure transfer to a new situation.
    const answerKey = normalizedAnswer(c.answer);
    const promptKey = normalizedAnswer(prompt);
    if (answerKey.length < 4 ||
        normalizedAnswer(scenario).includes(answerKey) ||
        promptKey.includes(answerKey) ||
        /^(?:que significa|como se define|cual es la definicion|segun el pdf)/.test(promptKey) ||
        !normalizedAnswer(c.explanation).includes(answerKey)) continue;
    // PDF has stable physical page numbers; DOCX is located by its exact heading,
    // never by a fabricated page. Require a heading matching a supplied fragment.
    const isWord = c.page === null;
    if (isWord && (typeof c.sectionTitle !== 'string' ||
        !c.sectionTitle.trim() || c.sectionTitle.length > 220)) continue;
    const sameLocation = (chunk: SourceFragment) => isWord
      ? chunk.pageStart === null && chunk.sectionTitle === c.sectionTitle
      : chunk.pageStart === c.page && typeof c.page === 'number' && c.page > 0;
    // Some uploaded notes reproduce inconsistent Ansoff risk rankings.
    // A literal PDF quote does not prove that a risk ranking is accurate.
    // Reject new relative-risk exercises on those pages; product/market
    // categorization remains allowed and source-backed.
    const conflictOnPage = source.some(chunk => {
      if (!sameLocation(chunk)) return false;
      const text = normalizedAnswer(chunk.text);
      return text.includes('penetracion de mercado') &&
        text.includes('desarrollo de mercados') &&
        text.includes('riesgo medio') && text.includes('riesgo bajo');
    });
    if (conflictOnPage &&
        /\b(?:riesgo|arriesgada|arriesgado|seguridad|segura|seguro)\b/.test(
          normalizedAnswer(scenario + ' ' + prompt + ' ' + c.explanation)
        )) continue;
    const onPage = source.some(chunk => sameLocation(chunk) &&
      normalizedAnswer(chunk.text).includes(normalizedAnswer(evidence)));
    if (!onPage || source.some(chunk => normalizedAnswer(chunk.text).includes(normalizedAnswer(scenario)))) continue;
    const options = c.options.filter((option): option is string => typeof option === 'string');
    if (options.length !== c.options.length || options.length !== 4 ||
        options.some(option => !names.has(normalizedAnswer(option))) ||
        !options.includes(c.answer) ||
        !normalizedAnswer(evidence).includes(normalizedAnswer(c.answer))) continue;
    const caseQuestion: PracticeQuestion = {
      id: 'ai-case-' + index + '-' + (isWord ? normalizedAnswer(c.sectionTitle as string).slice(0,30) : c.page),
      prompt: scenario + '\n\n' + prompt, options,
      answer: c.answer, explanation: c.explanation.trim(),
      level: 'aplicar', kind: 'ai-source-backed', pageStart: isWord ? null : c.page as number,
      chapterTitle: isWord ? c.sectionTitle as string : 'Situaciones de aplicación',
    };
    if (qualifiedQuestions([caseQuestion]).length) verified.push(caseQuestion);
  }
  return qualifiedQuestions(verified).slice(0, 10);
}


/** AI-generated applied cases require an independent solution without seeing
 * the generator's chosen correct answer. Matching a literal PDF quote does
 * not prove that a scenario uniquely implies a chosen strategy. */
export function applyIndependentCaseReview(
  cases: PracticeQuestion[],
  review: unknown,
  sources: SourceFragment[],
): PracticeQuestion[] {
  if (!review || typeof review !== 'object' || Array.isArray(review) ||
      !('judgments' in review) || !Array.isArray(review.judgments)) return [];
  const judgments = (review.judgments as unknown[])
    .filter((value):value is Record<string,unknown> =>
      Boolean(value) && typeof value === 'object' && !Array.isArray(value));
  return cases.filter(q => {
    const matches = judgments.filter(j => j.id === q.id);
    if (matches.length !== 1) return false;
    const judge = matches[0]!;
    if (judge.verdict !== 'supported' ||
        typeof judge.selectedAnswer !== 'string' ||
        normalizedAnswer(judge.selectedAnswer) !== normalizedAnswer(q.answer) ||
        typeof judge.explanation !== 'string' ||
        judge.explanation.trim().length < 90 ||
        !normalizedAnswer(judge.explanation).includes(normalizedAnswer(q.answer)) ||
        typeof judge.evidence !== 'string' ||
        judge.evidence.trim().length < 28 ||
        !normalizedAnswer(judge.evidence).includes(normalizedAnswer(q.answer))) return false;
    const sourceMatches = sources.some(s =>
      (q.pageStart === null
        ? s.pageStart === null && s.sectionTitle === q.chapterTitle
        : s.pageStart === q.pageStart) &&
      normalizedAnswer(s.text).includes(normalizedAnswer(judge.evidence as string)));
    return sourceMatches;
  });
}
