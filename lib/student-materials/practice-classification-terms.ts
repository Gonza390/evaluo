import type { CanonicalPedagogicalModel } from './types';
import { normalizedAnswer } from './practice-modes';

/**
 * Canonical model concepts don't always include classification members.
 * The original extraction does retain them as "Label: definition" items.
 * Only these explicit labeled items qualify as new possible answers; never
 * infer labels from bare unordered lists, and never synthesize terms.
 */
export function sourceBackedPracticeTerms(model: CanonicalPedagogicalModel | null): string[] {
  if (!model) return [];
  const candidates: string[] = [];
  for (const c of Array.isArray(model.concepts) ? model.concepts : []) {
    if (typeof c?.term === 'string') candidates.push(c.term);
  }
  for (const group of Array.isArray(model.classifications) ? model.classifications : []) {
    for (const item of Array.isArray(group.items) ? group.items : []) {
      if (typeof item !== 'string') continue;
      const colon = item.indexOf(':');
      if (colon < 4 || colon > 62) continue;
      const term = item.slice(0, colon).trim();
      const definition = item.slice(colon + 1).trim();
      if (definition.length < 25 || term.length > 65 ||
        /^(?:grupo|etapa|tema)\s*\d+$/i.test(term)) continue;
      candidates.push(term);
    }
  }
  const terms: string[] = [];
  const seen = new Set<string>();
  for (const term of candidates) {
    const key = normalizedAnswer(term);
    if (key.length < 4 || seen.has(key)) continue;
    seen.add(key); terms.push(term);
    if (terms.length >= 105) break;
  }
  return terms;
}
