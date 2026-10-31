import type { CanonicalPedagogicalModel } from './types';

export type PracticePair = { term: string; definition: string; chapterTitle: string | null };
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
      !d.startsWith('clasificacion que incluye') && !d.startsWith('proceso cuyos pasos');
  });
  const termCounts = new Map<string, number>(), defCounts = new Map<string, number>();
  for (const item of valid) {
    const t = normalizedAnswer(item.term), d = normalizedAnswer(item.definition);
    termCounts.set(t, (termCounts.get(t) ?? 0) + 1);
    defCounts.set(d, (defCounts.get(d) ?? 0) + 1);
  }
  return valid.filter(item => termCounts.get(normalizedAnswer(item.term)) === 1 &&
      defCounts.get(normalizedAnswer(item.definition)) === 1)
    .slice(0, limit);
}
/** A wrong choice in matching is not counted correct merely because its definition is similar. */
export function isCorrectWrittenAnswer(answer: string, expected: string): boolean {
  const response = normalizedAnswer(answer), term = normalizedAnswer(expected);
  if (!response || !term) return false;
  return response === term || response === 'el ' + term || response === 'la ' + term ||
    response === 'los ' + term || response === 'las ' + term;
}
export function qualifiedQuestions(questions: PracticeQuestion[]): PracticeQuestion[] {
  const seen = new Set<string>();
  return questions.filter(question => {
    const choices = question.options.map(normalizedAnswer);
    const key = normalizedAnswer(question.prompt);
    if (!key || seen.has(key) || question.prompt.trim().length < 18 || choices.length < 2 ||
      choices.length > 6 || new Set(choices).size !== choices.length ||
      choices.some(choice => !choice) || !choices.includes(normalizedAnswer(question.answer)) ||
      question.explanation.trim().length < 20) return false;
    seen.add(key); return true;
  });
}
/** Distribute exams across chapters instead of consuming the first ten generated questions. */
export function balancedQuestions(questions: PracticeQuestion[], limit = 10, round = 0): PracticeQuestion[] {
  const buckets = new Map<string, PracticeQuestion[]>();
  const eligible = qualifiedQuestions(questions);
  for (const question of eligible) {
    const topic = normalizedAnswer(question.chapterTitle || question.kind || 'general');
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
    if (parsed.length < 2 || labels.length !== parsed.length || parsed.length > 6) continue;
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
