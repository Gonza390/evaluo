import { normalizedAnswer, selectPracticePairs, type PracticePair } from './practice-modes';

type Fragment = { text: string; pageStart: number | null; sectionTitle: string | null };
type TermRecord = { term: string; definition: string; evidence: string; page?: number; sectionTitle?: string };

export function sourceVerifiedPairs(
  items: unknown, fragments: Fragment[], excludedTerms: string[] = [],
): PracticePair[] {
  if (!Array.isArray(items)) return [];
  const excluded = new Set(excludedTerms.map(normalizedAnswer));
  const candidates: PracticePair[] = [];
  for (const item of items.slice(0, 18)) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const v = item as Partial<TermRecord>;
    if (typeof v.term !== 'string' || typeof v.definition !== 'string' ||
        typeof v.evidence !== 'string') continue;
    const term = v.term.trim(), definition = v.definition.trim(), quote = v.evidence.trim();
    if (term.length < 4 || term.length > 65 || definition.length < 30 ||
        definition.length > 260 || quote.length < 40 || quote.length > 400 ||
        excluded.has(normalizedAnswer(term))) continue;
    // Both the term AND its exact definition must belong to a single, correctly
    // located source fragment. Do not grade a paraphrase as a sourced fact.
    const source = fragments.find(f =>
      (f.pageStart === null ? v.sectionTitle === f.sectionTitle : v.page === f.pageStart) &&
      normalizedAnswer(f.text).includes(normalizedAnswer(quote)));
    if (!source || !normalizedAnswer(quote).includes(normalizedAnswer(term)) ||
        !normalizedAnswer(quote).includes(normalizedAnswer(definition))) continue;
    candidates.push({ term, definition, chapterTitle: source.sectionTitle ?? null });
  }
  return selectPracticePairs(candidates, 18);
}

