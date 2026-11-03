import { normalizedAnswer } from './practice-modes';
import type { SourceFragment } from './practice-ai-cases';

export type CaseSourceSelection = {
  sources: SourceFragment[];
  allowedTerms: string[];
};

/**
 * Select evidence over the WHOLE document, not its first 100 chunks.
 * Rotating by entire batches and preferring distinct pages/sections prevents
 * retries from sending Gemini the same first few passages repeatedly.
 *
 * No source is invented. This only chooses the excerpts supplied to Gemini;
 * the existing literal-citation and independent-adjudication gates still run.
 */
export function selectPracticeCaseSources(
  fragments: readonly SourceFragment[],
  terms: readonly string[],
  round = 0,
  limit = 10,
): CaseSourceSelection {
  const safeLimit = Math.max(1, Math.min(12, Math.trunc(limit) || 10));
  const seenTerms = new Set<string>();
  const cleanTerms = terms.filter(term => {
    const key = normalizedAnswer(term);
    if (key.length < 4 || seenTerms.has(key)) return false;
    seenTerms.add(key);
    return true;
  });
  const pageType = fragments.find(fragment =>
    typeof fragment.text === 'string' && fragment.text.length >= 90)?.pageStart === null;
  const matching = fragments.flatMap((source, index) => {
    if (!source || typeof source.text !== 'string' || source.text.length < 90 ||
        (source.pageStart === null) !== pageType) return [];
    const normalized = normalizedAnswer(source.text);
    const matches = cleanTerms.filter(term => normalized.includes(normalizedAnswer(term)));
    if (!matches.length) return [];
    return [{ source, index, matches }];
  }).sort((a,b) => b.matches.length - a.matches.length || a.index - b.index);

  // The first evidence set includes multiple pages rather than ten passages
  // from one dense page. The remaining chunks remain available on retries.
  const pageKeys = new Set<string>();
  const primary: typeof matching = [];
  const remaining: typeof matching = [];
  for (const candidate of matching) {
    const key = candidate.source.pageStart === null
      ? 'section:' + (candidate.source.sectionTitle ?? '')
      : 'page:' + candidate.source.pageStart;
    if (pageKeys.has(key)) remaining.push(candidate);
    else { pageKeys.add(key); primary.push(candidate); }
  }
  const ordered = [...primary, ...remaining];
  if (!ordered.length) return { sources: [], allowedTerms: [] };
  const shift = ((Math.max(0,Math.trunc(round)||0) * safeLimit) % ordered.length);
  const rotated = [...ordered.slice(shift), ...ordered.slice(0,shift)];
  const picked: typeof matching = [];
  const represented = new Set<string>();
  for (const candidate of rotated) {
    if (picked.length >= safeLimit) break;
    picked.push(candidate);
    candidate.matches.forEach(term=>represented.add(normalizedAnswer(term)));
  }
  // Reject an evidence set with fewer than 4 answer labels. Do not pad with
  // terms absent from the supplied source fragments.
  const allowedTerms = cleanTerms.filter(term => represented.has(normalizedAnswer(term))).slice(0,60);
  return allowedTerms.length >= 4
    ? { sources: picked.map(row => ({
        pageStart: row.source.pageStart,
        sectionTitle: row.source.sectionTitle,
        text: row.source.text.slice(0,1400),
      })), allowedTerms }
    : { sources: [], allowedTerms: [] };
}
