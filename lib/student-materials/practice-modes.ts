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
  return normalizedAnswer(value).replace(/^(?:el|la|los|las|un|una)\\s+/, '');
}
function explicitAnswers(pair: PracticePair): string[] {
  const variants = [pair.term];
  if (pair.englishTerm?.trim()) variants.push(pair.englishTerm.trim());
  // A source term such as "Responsabilidad social empresaria (RSE)" already
  // declares both a full label and an abbreviation. Require matching initials.
  const alias = /^(.*?)\\s*\\(([A-ZÁÉÍÓÚÑ]{2,8})\\)\\s*$/u.exec(pair.term.trim());
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
  const variants = explicitAnswers(pair).slice(1);
  const canonical = new Set(allPairs.filter(p => p !== pair).flatMap(p =>
    explicitAnswers(p).map(writtenForm)));
  return variants.filter(alias => {
    const key = writtenForm(alias);
    return key.length >= 2 && !canonical.has(key);
  });
}
/** A shared long definition stem can make two options pedagogically equivalent. */
export function hasAmbiguousDistractors(question: PracticeQuestion): boolean {
  const answer = normalizedAnswer(question.answer);
  if (answer.length < 44) return false;
  return question.options.some(choice => {
    const candidate = normalizedAnswer(choice);
    return candidate !== answer && candidate.length >= 44 &&
      candidate.slice(0, 42) === answer.slice(0, 42);
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
  // A classification lookup is understanding, not a transfer/application case.
  const chosen = actualApplications.length
    ? actualApplications[round % actualApplications.length]!
    : available.length ? available[round % available.length]! : null;
  if (chosen && base.length >= 5) base.pop(); // Keep task count bounded.
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
  let row = 0;
  while (selected.length < limit && row < eligible.length) {
    let added = false;
    for (let i = 0; i < keys.length; i++) {
      const key = keys[(i + round) % keys.length]!;
      const bucket = buckets.get(key)!;
      const candidate = bucket[(row + round) % bucket.length];
      if (candidate && !used.has(candidate.id)) {
        used.add(candidate.id); selected.push(candidate); added = true;
        if (selected.length >= limit) break;
      }
    }
    if (!added && row >= eligible.length) break;
    row++;
  }
  // If some buckets are exhausted, complete with other distinct questions.
  for (const item of eligible) {
    if (selected.length >= limit) break;
    if (!used.has(item.id)) { selected.push(item); used.add(item.id); }
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
      const name = item.slice(0, colon).trim(), evidence = item.slice(colon + 1).trim();
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
