export type CareerMatchCandidate = {
  id: string;
  nombre: string;
};

export type CareerMatch = CareerMatchCandidate & {
  score: number;
};

const GENERIC_PREFIXES = [
  'licenciatura en ',
  'licenciatura de ',
  'lic en ',
  'ingenieria en ',
  'ingenieria de ',
  'tecnicatura en ',
  'tecnicatura de ',
  'profesorado en ',
  'profesorado de ',
];

const STOP_WORDS = new Set(['de', 'del', 'la', 'las', 'el', 'los', 'en', 'y']);

function normalize(value: string) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')
    .replace(/&/g, ' y ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function canonical(value: string) {
  let normalized = normalize(value);
  for (const prefix of GENERIC_PREFIXES) {
    if (normalized.startsWith(prefix)) {
      normalized = normalized.slice(prefix.length).trim();
      break;
    }
  }
  return normalized;
}

function significantTokens(value: string) {
  return canonical(value)
    .split(' ')
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function diceCoefficient(a: string[], b: string[]) {
  if (!a.length || !b.length) return 0;
  const left = new Set(a);
  const right = new Set(b);
  let overlap = 0;
  for (const token of left) {
    if (right.has(token)) overlap += 1;
  }
  return (2 * overlap) / (left.size + right.size);
}

function editDistance(a: string, b: string) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  const current = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + cost
      );
    }
    for (let j = 0; j <= b.length; j += 1) previous[j] = current[j];
  }

  return previous[b.length];
}

export function careerSimilarity(query: string, candidate: string) {
  const normalizedQuery = normalize(query);
  const normalizedCandidate = normalize(candidate);
  if (!normalizedQuery || !normalizedCandidate) return 0;
  if (normalizedQuery === normalizedCandidate) return 1;

  const canonicalQuery = canonical(query);
  const canonicalCandidate = canonical(candidate);
  if (canonicalQuery && canonicalQuery === canonicalCandidate) return 0.99;

  const shorter = canonicalQuery.length <= canonicalCandidate.length ? canonicalQuery : canonicalCandidate;
  const longer = canonicalQuery.length > canonicalCandidate.length ? canonicalQuery : canonicalCandidate;
  const containment = shorter.length >= 6 && longer.includes(shorter) ? 0.92 : 0;

  const tokenScore = diceCoefficient(significantTokens(query), significantTokens(candidate));
  const maxLength = Math.max(canonicalQuery.length, canonicalCandidate.length);
  const editScore = maxLength
    ? 1 - editDistance(canonicalQuery, canonicalCandidate) / maxLength
    : 0;

  return Math.max(containment, tokenScore, editScore);
}

export function findCareerMatches<T extends CareerMatchCandidate>(
  query: string,
  candidates: T[],
  options: { threshold?: number; limit?: number } = {}
): Array<T & { score: number }> {
  const threshold = options.threshold ?? 0.72;
  const limit = options.limit ?? 3;
  const normalizedQuery = normalize(query);
  if (normalizedQuery.length < 3) return [];

  return candidates
    .map((candidate) => ({ ...candidate, score: careerSimilarity(query, candidate.nombre) }))
    .filter((candidate) => candidate.score >= threshold)
    .sort((a, b) => b.score - a.score || a.nombre.localeCompare(b.nombre, 'es'))
    .slice(0, limit);
}
