import type { CanonicalPedagogicalModel } from './types';

export type PracticePair = { term: string; definition: string; chapterTitle: string | null; englishTerm?: string | null };
export type PracticeQuestion = {
  id: string; prompt: string; options: string[]; answer: string; explanation: string;
  level: string; pageStart: number | null; chapterTitle?: string | null; kind?: string;
};
export function normalizedAnswer(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}
/** Only unambiguous, non-generic one-to-one term-definition pairs qualify. */
export function selectPracticePairs(items: PracticePair[], limit = 50): PracticePair[] {
  const valid = items.filter(item => {
    if (!item || typeof item.term !== 'string' || typeof item.definition !== 'string') return false;
    const t = normalizedAnswer(item.term), d = normalizedAnswer(item.definition);
    return t.length >= 4 && t.length <= 65 && d.length >= 30 && d.length <= 330 &&
      t !== d && !/^(?:concepto|definicion|introduccion|conclusion|idea principal)$/.test(t) &&
      !item.term.includes('↔') && // A compound relation isn't a fair one-term cloze answer.
      !d.startsWith('clasificacion que incluye') && !d.startsWith('proceso cuyos pasos') &&
      !/^(?:carrera a la que pertenece|institucion universitaria que imparte|materia correspondiente|documento original|material compartido|universidad de origen)/.test(d) &&
      !(t.length > 11 && d.includes(t)); // Never show the answer in its own definition.
  });
  const termCounts = new Map<string, number>(), defCounts = new Map<string, number>();
  for (const item of valid) {
    const t = normalizedAnswer(item.term), d = normalizedAnswer(item.definition);
    termCounts.set(t, (termCounts.get(t) ?? 0) + 1);
    defCounts.set(d, (defCounts.get(d) ?? 0) + 1);
  }
  return valid.filter(item => termCounts.get(normalizedAnswer(item.term)) === 1 &&
      defCounts.get(normalizedAnswer(item.definition)) === 1 &&
      !valid.some(other => other !== item &&
        normalizedAnswer(other.definition).slice(0, 48) === normalizedAnswer(item.definition).slice(0, 48)))
    .slice(0, limit);
}
/** Equivalences are accepted only when explicitly present in the glossary.
 * No fuzzy/semantic matching: that could incorrectly award another concept.
 */
function writtenForm(value: string): string {
  return normalizedAnswer(value).replace(/^(?:el|la|los|las|un|una)\s+/, '');
}
function grammaticalVariants(term: string): string[] {
  const words = writtenForm(term).split(' ').filter(Boolean);
  if (!words.length || words.length > 8) return [];
  const stop = new Set(['de','del','en','al','y','e','o','por','para','con','sin','el','la','las','los']);
  const variants: string[] = [];
  const plural = (word: string): string | null => {
    if (stop.has(word) || word.length < 4 || word.endsWith('s')) return null;
    if (word.endsWith('z')) return word.slice(0,-1)+'ces';
    if (/[aeiou]$/.test(word)) return word+'s';
    return word+'es';
  };
  // Single-word changes cover "Desarrollo de mercados" as well as fully
  // plural phrases. Nothing semantic or approximate is accepted.
  const changed = words.map(plural);
  for (let i=0;i<words.length;i++) {
    if (!changed[i]) continue;
    const variant=[...words];
    variant[i]=changed[i]!;
    variants.push(variant.join(' '));
  }
  if (changed.some(Boolean)) variants.push(words.map((word,i)=>changed[i]??word).join(' '));
  return [...new Set(variants)];
}
function explicitAnswers(pair: PracticePair): string[] {
  const variants = [pair.term];
  if (pair.englishTerm?.trim()) variants.push(pair.englishTerm.trim());
  // A source term such as "Responsabilidad social empresaria (RSE)" already
  // declares both a full label and an abbreviation. Require matching initials.
  const alias = /^(.*?)\s*\(([A-ZÁÉÍÓÚÑ]{2,8})\)\s*$/u.exec(pair.term.trim());
  if (alias) {
    const long = alias[1]!.trim(), acronym = alias[2]!;
    const initials = normalizedAnswer(long).split(' ')
      .filter(word => !['de','del','la','las','los','el','en','y'].includes(word))
      .map(word => word[0] ?? '').join('').toUpperCase();
    if (initials === normalizedAnswer(acronym).toUpperCase()) {
      variants.push(long, acronym);
    }
  }
  return variants;
}
export function isCorrectWrittenAnswer(answer: string, expected: string, aliases: readonly string[] = []): boolean {
  const response = writtenForm(answer);
  if (!response) return false;
  return [expected, ...aliases].some(candidate => writtenForm(candidate) === response);
}
/** Don't accept a glossary alias if it could also be a different answer
 * within the same exercise set. Ambiguous alternatives are simply disabled.
 */
export function allowedWrittenVariants(pair: PracticePair, allPairs: readonly PracticePair[]): string[] {
  const variants = [...explicitAnswers(pair).slice(1),...grammaticalVariants(pair.term)];
  const canonical = new Set(allPairs.filter(p => p !== pair).flatMap(p =>
    [...explicitAnswers(p),...grammaticalVariants(p.term)].map(writtenForm)));
  return [...new Set(variants)].filter(alias => {
    const key = writtenForm(alias);
    return key.length >= 2 && !canonical.has(key);
  });
}
/**
 * A key academic integrity failure: some generated distractors are near-
 * paraphrases of the designated correct answer. Distinct strings can still
 * express the same proposition. This lexical screen is conservative and
 * sends such questions to rejection, not automatic rewriting of the grade.
 * It is not a substitute for semantic or faculty review.
 */
const ambiguousStopwords = new Set([
  'de','del','la','las','el','los','un','una','unos','unas','al','con','en','que',
  'por','para','como','sobre','su','sus','donde','cuyo','cual','cuando','entre',
  'cada','todo','todos','todas','este','esta','estas','estos','desde','hacia',
  'forma','mismo','misma','sera','ser','son','es','fue','han','hay','debe',
  'deben','tener','tiene','tienen','junto','acompanado','acompanada',
]);
function meaningfulOptionWords(value: string): Set<string> {
  return new Set(normalizedAnswer(value).split(' ').filter(w =>
    w.length >= 4 && !ambiguousStopwords.has(w)));
}
export function hasAmbiguousDistractors(question: Pick<PracticeQuestion,'answer' | 'options'>): boolean {
  const answer = normalizedAnswer(question.answer);
  if (answer.length < 40) return false;
  const expected = meaningfulOptionWords(answer);
  return question.options.some(choice => {
    const alternative = normalizedAnswer(choice);
    if (alternative === answer) return false;
    if (alternative.length >= 44 && alternative.slice(0,42) === answer.slice(0,42)) return true;
    if (alternative.length < 38 || expected.size < 5) return false;
    const other = meaningfulOptionWords(alternative);
    if (other.size < 5) return false;
    const shared = [...expected].filter(word => other.has(word)).length;
    const minSize = Math.min(expected.size,other.size);
    const union = expected.size + other.size - shared;
    // High overlap AND high containment. These are review thresholds,
    // not claims that the two statements are mathematically equivalent.
    return shared >= 5 && shared/minSize >= 0.7 && shared/union >= 0.45;
  });
}
export function qualifiedQuestions(questions: PracticeQuestion[]): PracticeQuestion[] {
  const seen = new Set<string>();
  return questions.filter(question => {
    const choices = question.options.map(normalizedAnswer);
    const key = normalizedAnswer(question.prompt);
    if (!key || seen.has(key) || question.prompt.trim().length < 18 || choices.length < 2 ||
      choices.length > 6 || new Set(choices).size !== choices.length ||
      choices.some(choice => !choice) || !choices.includes(normalizedAnswer(question.answer)) ||
      question.explanation.trim().length < 20 || hasAmbiguousDistractors(question)) return false;
    seen.add(key); return true;
  });
}
/** Keep application separate from recognition and never repeat a question in Mixto. */
export function selectMixedQuestions(
  options: PracticeQuestion[], cases: PracticeQuestion[], round = 0,
): { questions: PracticeQuestion[]; application: PracticeQuestion | null } {
  const base = balancedQuestions(options, 5, round);
  const used = new Set(base.map(q => q.id));
  const available = qualifiedQuestions(cases).filter(q => !used.has(q.id) &&
    !base.some(original => normalizedAnswer(original.prompt) === normalizedAnswer(q.prompt)));
  const actualApplications = available.filter(q => q.level === 'aplicar');
  // Prefer genuinely new cases over options already present elsewhere in the
  // bank. This prevents a "mixed" task from merely recycling an MCQ.
  const optionIds = new Set(options.map(q => q.id));
  const novelApplications = actualApplications.filter(q => !optionIds.has(q.id));
  const novelContexts = available.filter(q => !optionIds.has(q.id));
  const pool = novelApplications.length ? novelApplications :
    actualApplications.length ? actualApplications :
    novelContexts.length ? novelContexts : available;
  // A classification lookup is understanding, not a transfer/application case.
  const chosen = pool.length ? pool[round % pool.length]! : null;
  return { questions:base, application:chosen };
}

/** Distribute exams across chapters instead of consuming the first ten generated questions. */
export function balancedQuestions(questions: PracticeQuestion[], limit = 10, round = 0): PracticeQuestion[] {
  const buckets = new Map<string, PracticeQuestion[]>();
  const eligible = qualifiedQuestions(questions);
  const maxPage = Math.max(1, ...eligible.map(q => q.pageStart ?? 0));
  const pageBand = Math.max(4, Math.ceil(maxPage / 4));
  for (const question of eligible) {
    // No atribuir un tema por cercanía léxica: cuando no hay capítulo verificado,
    // distribuir por posición del documento como proxy y no presentarlo como tema.
    const topic = question.chapterTitle
      ? 'chapter:' + normalizedAnswer(question.chapterTitle)
      : question.pageStart
        ? 'page-band:' + Math.floor((question.pageStart - 1) / pageBand)
        : 'uncited:' + normalizedAnswer(question.kind || 'general');
    const bucket = buckets.get(topic) ?? [];
    bucket.push(question); buckets.set(topic, bucket);
  }
  const keys = [...buckets.keys()].sort();
  if (!keys.length) return [];
  const selected: PracticeQuestion[] = [];
  const used = new Set<string>();
  const usedLevels = new Set<string>();
  // First distribute across chapters; within each chapter, give priority to
  // an as-yet-unrepresented cognitive level. This never upgrades a question's
  // claimed depth and does not invent application exercises when absent.
  const positions = new Map(keys.map(key => [key, 0]));
  for (let cycle = 0; selected.length < limit && cycle < eligible.length; cycle++) {
    let added = false;
    for (let k = 0; k < keys.length && selected.length < limit; k++) {
      const key = keys[(k + round) % keys.length]!;
      const bucket = buckets.get(key)!;
      const unused = bucket.filter(q => !used.has(q.id));
      if (!unused.length) continue;
      const offset = (positions.get(key)! + round) % unused.length;
      const rotated = [...unused.slice(offset),...unused.slice(0,offset)];
      const candidate = rotated.find(q => !usedLevels.has(q.level)) ?? rotated[0]!;
      selected.push(candidate);
      used.add(candidate.id);
      usedLevels.add(candidate.level);
      positions.set(key,positions.get(key)!+1);
      added = true;
    }
    if (!added) break;
  }
  // Remaining items: keep a bounded selection, do not repeat a question.
  for (const q of eligible) {
    if (selected.length >= limit) break;
    if (!used.has(q.id)) {selected.push(q); used.add(q.id);}
  }
  return selected;
}
/**
 * Construct limited, source-backed contextual classification exercises.
 * Never invent a scenario or interpret an unlabeled list as having definitions.
 */
export function buildSourceBackedCases(model: CanonicalPedagogicalModel | null): PracticeQuestion[] {
  if (!model || !Array.isArray(model.classifications)) return [];
  const result: PracticeQuestion[] = [];
  for (const [index, group] of model.classifications.entries()) {
    if (!group.title || !Array.isArray(group.items)) continue;
    const parsed = group.items.map(item => {
      const colon = item.indexOf(':');
      if (colon < 4 || colon > 58) return null;
      const name = item.slice(0, colon).trim();
      // Source notes can contain disputed relative-risk labels (e.g. Ansoff).
      // Classification practice should test the *defining characteristic*,
      // not promote an unreviewed risk ranking as an academic fact.
      const evidence = item.slice(colon + 1).trim()
        .replace(/\s*\(\s*riesgo\s+(?:muy\s+)?(?:bajo|medio|alto)\s*\)/giu, '').trim();
      if (name.length < 4 || evidence.length < 25 || evidence.length > 240) return null;
      return { name, evidence };
    }).filter((entry): entry is { name: string; evidence: string } => Boolean(entry));
    const labels = [...new Set(parsed.map(entry => normalizedAnswer(entry.name)))];
    if (parsed.length < 2 || labels.length !== parsed.length || parsed.length > 6 ||
        parsed.some(entry => /^grupo\s*\d+$/i.test(entry.name))) continue;
    if (new Set(parsed.map(entry => normalizedAnswer(entry.evidence))).size !== parsed.length) continue;
    for (const [i, entry] of parsed.entries()) {
      result.push({
        id: `source-case-${index}-${i}`,
        prompt: `En «${group.title}», se presenta esta situación: ${entry.evidence} ¿A cuál de estas categorías corresponde?`,
        options: parsed.map(choice => choice.name),
        answer: entry.name,
        explanation: `El material relaciona «${entry.name}» con: ${entry.evidence}`,
        level: 'comprender', kind: 'classification-scenario',
        chapterTitle: group.title,
        pageStart: group.pageReferences?.[0] ?? null,
      });
    }
  }
  return qualifiedQuestions(result);
}

/** Explain a wrong alternative only when both meanings can be uniquely
 * identified from source glossary definitions. Otherwise show the original
 * verified explanation without inventing the student's misconception.
 */
export function groundedPracticeContrast(
  selected: string, expected: string, pairs: readonly PracticePair[],
): string | null {
  if (!selected.trim() || !expected.trim() || normalizedAnswer(selected) === normalizedAnswer(expected)) return null;
  const lookup = (value:string): PracticePair | null => {
    const key = normalizedAnswer(value);
    const matches = pairs.filter(p => normalizedAnswer(p.term) === key ||
      normalizedAnswer(p.definition) === key ||
      (p.englishTerm ? normalizedAnswer(p.englishTerm) === key : false));
    return matches.length === 1 ? matches[0]! : null;
  };
  const wrong = lookup(selected), right = lookup(expected);
  if (!wrong || !right || normalizedAnswer(wrong.term) === normalizedAnswer(right.term)) return null;
  return 'La alternativa elegida corresponde a «' + wrong.term + '»: ' +
    wrong.definition.trim() + ' En cambio, «' + right.term + '» se reconoce por: ' +
    right.definition.trim();
}

/**
 * Replace formulaic "other options are wrong" explanations only when the
 * correct answer and a competing alternative both map uniquely to the
 * student's own glossary. Never invent semantic equivalences or new facts.
 */
export function groundedPracticeExplanation(
  question: Pick<PracticeQuestion,'answer' | 'options' | 'explanation'>,
  pairs: readonly PracticePair[],
): string {
  const original = question.explanation.trim();
  if (original.length >= 105 &&
      !/(?:las dem[aá]s opciones|se define como|se caracteriza por:|significa:|la relaci[oó]n presentada en el pdf|entre .+ se da esta relaci[oó]n)/iu.test(original)) return original;
  const findUnique = (value:string): PracticePair | null => {
    const key = normalizedAnswer(value);
    const matches = pairs.filter(pair =>
      normalizedAnswer(pair.definition) === key || normalizedAnswer(pair.term) === key);
    return matches.length === 1 ? matches[0]! : null;
  };
  const correct = findUnique(question.answer);
  if (!correct) return original;
  const other = question.options
    .filter(option => normalizedAnswer(option) !== normalizedAnswer(question.answer))
    .map(findUnique)
    .find((pair): pair is PracticePair => Boolean(pair) &&
      normalizedAnswer(pair!.term) !== normalizedAnswer(correct.term));
  if (!other) return original;
  return 'La opción correcta corresponde a «' + correct.term +
    '»: ' + correct.definition.trim().replace(/[.!?]+$/u,'') +
    '. No debe confundirse con «' + other.term +
    '», que se refiere a ' + other.definition.trim().replace(/[.!?]+$/u,'') + '.';
}
