export type UniversityMatchCandidate = {
  id: string;
  nombre: string;
};

export type UniversityMatch<T extends UniversityMatchCandidate = UniversityMatchCandidate> = {
  university: T;
  score: number;
  reason: 'exact' | 'acronym' | 'token' | 'typo';
};

const STOP_WORDS = new Set(['de', 'del', 'la', 'las', 'el', 'los', 'y', 'e', 'en']);

export function normalizeUniversityName(value: string) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function compact(value: string) {
  return normalizeUniversityName(value).replace(/\s/g, '');
}

function significantTokens(value: string) {
  return normalizeUniversityName(value)
    .split(' ')
    .filter((token) => token.length >= 2 && !STOP_WORDS.has(token));
}

function acronym(value: string) {
  return significantTokens(value)
    .map((token) => token[0])
    .join('');
}

function levenshtein(left: string, right: string) {
  if (left === right) return 0;
  if (!left.length) return right.length;
  if (!right.length) return left.length;

  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  const current = new Array<number>(right.length + 1);

  for (let i = 1; i <= left.length; i += 1) {
    current[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      current[j] = Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + cost);
    }
    for (let j = 0; j <= right.length; j += 1) previous[j] = current[j];
  }

  return previous[right.length];
}

function similarity(left: string, right: string) {
  const maxLength = Math.max(left.length, right.length);
  if (!maxLength) return 1;
  return 1 - levenshtein(left, right) / maxLength;
}

export function scoreUniversityMatch(query: string, candidateName: string) {
  const normalizedQuery = normalizeUniversityName(query);
  const normalizedCandidate = normalizeUniversityName(candidateName);
  if (normalizedQuery.length < 2 || normalizedCandidate.length < 2) {
    return { score: 0, reason: 'typo' as const };
  }

  if (normalizedQuery === normalizedCandidate || compact(query) === compact(candidateName)) {
    return { score: 1, reason: 'exact' as const };
  }

  const compactQuery = compact(query);
  const candidateAcronym = acronym(candidateName);
  if (compactQuery.length >= 2 && compactQuery.length <= 8 && compactQuery === candidateAcronym) {
    return { score: 0.99, reason: 'acronym' as const };
  }

  const queryTokens = significantTokens(query);
  const candidateTokens = significantTokens(candidateName);
  if (queryTokens.length) {
    const matches = queryTokens.filter((queryToken) =>
      candidateTokens.some((candidateToken) =>
        queryToken === candidateToken ||
        (Math.min(queryToken.length, candidateToken.length) >= 5 && similarity(queryToken, candidateToken) >= 0.82)
      )
    ).length;
    const coverage = matches / queryTokens.length;
    if (coverage === 1) return { score: 0.93, reason: 'token' as const };
    if (coverage >= 0.67) return { score: 0.78 + coverage * 0.1, reason: 'token' as const };
  }

  const wholeSimilarity = similarity(compactQuery, compact(candidateName));
  if (wholeSimilarity >= 0.72) return { score: wholeSimilarity, reason: 'typo' as const };

  return { score: 0, reason: 'typo' as const };
}

export function findUniversityMatches<T extends UniversityMatchCandidate>(
  query: string,
  candidates: T[],
  options: { limit?: number; minScore?: number } = {}
): UniversityMatch<T>[] {
  const { limit = 3, minScore = 0.7 } = options;
  if (normalizeUniversityName(query).length < 2) return [];

  return candidates
    .map((university) => ({ university, ...scoreUniversityMatch(query, university.nombre) }))
    .filter((match) => match.score >= minScore)
    .sort(
      (left, right) =>
        right.score - left.score || left.university.nombre.localeCompare(right.university.nombre, 'es')
    )
    .slice(0, limit);
}

export function findStrongUniversityMatch<T extends UniversityMatchCandidate>(query: string, candidates: T[]) {
  return findUniversityMatches(query, candidates, { limit: 1, minScore: 0.86 })[0] ?? null;
}
