import { balancedQuestions, normalizedAnswer, qualifiedQuestions, type PracticeQuestion } from './practice-modes';

export type TrueFalseFragment = {
  pageStart: number | null;
  sectionTitle: string | null;
  text: string;
};

type TrueFalseCandidate = {
  statement: string;
  correct: boolean;
  correction: string;
  explanation: string;
  evidence: string;
  page?: number | null;
  sectionTitle?: string;
};

const words = (value: string) => normalizedAnswer(value).split(' ').filter(Boolean);

/**
 * Only accept assertions with a literal source-backed corrected statement.
 * A false assertion must alter a SMALL number of material words in an otherwise
 * identical statement. Mere differences in case, punctuation or accents
 * cannot make a source statement false.
 *
 * This is a mechanical grounding screen, not a replacement for semantic QA.
 */
export function verifyGeneratedTrueFalse(
  raw: unknown, fragments: TrueFalseFragment[],
): PracticeQuestion[] {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) ||
      !('assertions' in raw) || !Array.isArray(raw.assertions)) return [];
  const items = raw.assertions.slice(0, 18);
  const verified: PracticeQuestion[] = [];
  const seen = new Set<string>();
  for (const entry of items) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;
    const a = entry as Partial<TrueFalseCandidate>;
    if (typeof a.statement !== 'string' || typeof a.correct !== 'boolean' ||
        typeof a.correction !== 'string' || typeof a.explanation !== 'string' ||
        typeof a.evidence !== 'string') continue;
    const statement = a.statement.trim(), correction = a.correction.trim();
    const evidence = a.evidence.trim(), explanation = a.explanation.trim();
    if (statement.length < 55 || statement.length > 280 ||
        correction.length < 55 || correction.length > 280 ||
        explanation.length < 85 || explanation.length > 580 ||
        evidence.length < 55 || evidence.length > 420) continue;
    const key = normalizedAnswer(statement);
    if (seen.has(key) || !key || /(?:siempre|nunca|todos|ninguno)/i.test(statement) &&
        !/(?:siempre|nunca|todos|ninguno)/i.test(correction)) continue;
    const source = fragments.find(fragment =>
      (fragment.pageStart === null
        ? a.page == null && typeof a.sectionTitle === 'string' &&
          a.sectionTitle === fragment.sectionTitle
        : a.page === fragment.pageStart) &&
      normalizedAnswer(fragment.text).includes(normalizedAnswer(evidence)) &&
      normalizedAnswer(evidence).includes(normalizedAnswer(correction)));
    if (!source) continue;
    if (!normalizedAnswer(explanation).includes(normalizedAnswer(correction))) continue;

    const actual = words(statement), expected = words(correction);
    if (actual.length < 10 || expected.length < 10) continue;
    if (a.correct) {
      if (key !== normalizedAnswer(correction)) continue;
    } else {
      // Reject one-word synonyms, broad rewrites and unsupported negative
      // assertions: changing a single datum of a documented claim is safer.
      if (key === normalizedAnswer(correction) || actual.length !== expected.length) continue;
      const differences = actual.filter((word, i) => word !== expected[i]).length;
      if (differences < 1 || differences > 3) continue;
      if (normalizedAnswer(source.text).includes(key)) continue;
    }
    const hash = [...key].reduce((h, ch) => ((h * 31) + ch.charCodeAt(0)) >>> 0, 7);
    const q: PracticeQuestion = {
      id: 'tf-' + hash.toString(36),
      prompt: statement,
      options: ['Verdadero', 'Falso'],
      answer: a.correct ? 'Verdadero' : 'Falso',
      explanation: explanation + '\n\nFundamento del material: «' + evidence + '»',
      level: 'comprender',
      kind: 'true-false-source-backed',
      pageStart: source.pageStart,
      chapterTitle: source.sectionTitle ?? 'Afirmaciones del material',
    };
    if (!qualifiedQuestions([q]).length) continue;
    verified.push(q);
    seen.add(key);
  }
  return qualifiedQuestions(verified);
}

/** Select different cited pages/sections for each regeneration attempt.
 * Avoid asking the AI about nearly identical contiguous chunks repeatedly. */
export function selectTrueFalseFragments(
  fragments: readonly TrueFalseFragment[], round: number, maxFragments = 10,
): TrueFalseFragment[] {
  if (!fragments.length || maxFragments <= 0) return [];
  const groups = new Map<string, TrueFalseFragment[]>();
  for (const fragment of fragments) {
    const key = fragment.pageStart === null
      ? 'section:' + fragment.sectionTitle
      : 'page:' + fragment.pageStart;
    const group = groups.get(key) ?? [];
    group.push(fragment);
    groups.set(key, group);
  }
  const entries = [...groups.values()];
  const count = Math.min(maxFragments, entries.length);
  const safeRound = Math.max(0, Math.floor(Number.isFinite(round) ? round : 0));
  const start = (safeRound * count) % entries.length;
  const passage = Math.floor((safeRound * count) / entries.length);
  return Array.from({length:count}, (_,i) => {
    const group = entries[(start+i)%entries.length]!;
    return group[passage % group.length]!;
  });
}

export function verifiedTrueFalsePool(questions: PracticeQuestion[]): PracticeQuestion[] {
  return qualifiedQuestions(questions.filter(q =>
    q.kind === 'true-false-source-backed' &&
    q.options.length === 2 &&
    q.options[0] === 'Verdadero' && q.options[1] === 'Falso' &&
    (q.answer === 'Verdadero' || q.answer === 'Falso')
  ));
}

/** The user should see both kinds of judgments, not six copies of True. */
export function sufficientTrueFalse(questions: PracticeQuestion[], minimum = 6): boolean {
  const pool = verifiedTrueFalsePool(questions);
  return pool.length >= minimum &&
    pool.filter(q => q.answer === 'Verdadero').length >= 2 &&
    pool.filter(q => q.answer === 'Falso').length >= 2;
}

/**
 * Shuffle presentation order independently of the correct answer. The result
 * remains fixed for a React practice round because the caller memoizes the
 * selected questions. Randomness changes on a new session/round, not between
 * answers or UI rerenders.
 *
 * Do not deliberately alternate Verdadero/Falso: that reveals a pattern.
 * A perfectly alternating result can also arise by chance, so reject that
 * particular arrangement without changing any answer keys.
 */
export function shuffleTrueFalseOrder(
  selected: readonly PracticeQuestion[],
  random: () => number = Math.random,
): PracticeQuestion[] {
  const shuffled = [...selected];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const sample = random();
    const j = Math.floor((Number.isFinite(sample) ? Math.max(0, Math.min(sample, 0.999999999999)) : 0) * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  if (shuffled.length >= 4 && shuffled.every((item, i) =>
    i === 0 || item.answer !== shuffled[i-1]!.answer
  )) {
    // In an alternating sequence the first and third items have the same
    // correct answer. Swapping the second and third breaks the pattern while
    // preserving the exact question set and truth-value distribution.
    [shuffled[1], shuffled[2]] = [shuffled[2]!, shuffled[1]!];
  }
  return shuffled;
}

/** Keep both truth values in each round; randomize their display order. */
export function selectBalancedTrueFalse(
  questions: PracticeQuestion[], limit = 8, round = 0,
  random: () => number = Math.random,
): PracticeQuestion[] {
  const pool = verifiedTrueFalsePool(questions);
  const selected = [
    ...balancedQuestions(pool.filter(q => q.answer === 'Verdadero'), 2, round),
    ...balancedQuestions(pool.filter(q => q.answer === 'Falso'), 2, round),
  ];
  const chosen = new Set(selected.map(q => q.id));
  const rest = balancedQuestions(pool.filter(q => !chosen.has(q.id)),
    Math.max(0, limit - selected.length), round);
  return shuffleTrueFalseOrder(balancedQuestions([...selected, ...rest], limit, round), random);
}


/** Independent answer check. A literal quote proves provenance, not that a
 * one-word alteration reverses the meaning. The second adjudication receives
 * no answer key and must independently find a contradiction or entailment.
 * Ambiguous statements fail closed. */
export function applyIndependentTrueFalseReview(
  questions: PracticeQuestion[],
  review: unknown,
  fragments: TrueFalseFragment[],
): PracticeQuestion[] {
  if (!review || typeof review !== 'object' || Array.isArray(review) ||
      !('judgments' in review) || !Array.isArray(review.judgments)) return [];
  const assessments = (review.judgments as unknown[])
    .filter((value): value is Record<string,unknown> =>
      Boolean(value) && typeof value === 'object' && !Array.isArray(value));
  const result: PracticeQuestion[] = [];
  for (const q of verifiedTrueFalsePool(questions)) {
    const matches = assessments.filter(item =>
      typeof item.statement === 'string' &&
      normalizedAnswer(item.statement) === normalizedAnswer(q.prompt));
    if (matches.length !== 1) continue;
    const judgment = matches[0]!;
    const expectedVerdict = q.answer === 'Verdadero' ? 'entailed' : 'contradicted';
    if (judgment.verdict !== expectedVerdict ||
        typeof judgment.explanation !== 'string' ||
        judgment.explanation.trim().length < 70 ||
        typeof judgment.evidence !== 'string' ||
        judgment.evidence.trim().length < 45) continue;
    // The second quote must also be an actual excerpt from the ORIGINAL
    // document at the same location, not a plausible quotation invented by AI.
    const located = fragments.some(fragment =>
      (q.pageStart === null
        ? fragment.pageStart === null && fragment.sectionTitle === q.chapterTitle
        : fragment.pageStart === q.pageStart) &&
      normalizedAnswer(fragment.text).includes(normalizedAnswer(judgment.evidence as string)));
    if (!located) continue;
    result.push(q);
  }
  return result;
}
