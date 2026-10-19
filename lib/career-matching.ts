export type CareerMatchCandidate = {
  id: string;
  nombre: string;
  universidad_id?: string | null;
};

export type CareerMatch<T extends CareerMatchCandidate = CareerMatchCandidate> = {
  career: T;
  score: number;
  reason: 'exact' | 'prefix' | 'token' | 'typo';
};

const STOP_WORDS = new Set(['de', 'del', 'la', 'las', 'el', 'los', 'en', 'y', 'e']);

export function normalizeCareerName(value: string) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function significantTokens(value: string) {
  return normalizeCareerName(value)
    .split(' ')
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token));
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

function typoSimilarity(left: string, right: string) {
  const maxLength = Math.max(left.length, right.length);
  if (!maxLength) return 1;
  return 1 - levenshtein(left, right) / maxLength;
}

function tokenPrefixMatches(queryTokens: string[], candidateTokens: string[]) {
  return queryTokens.filter((queryToken) =>
    candidateTokens.some((candidateToken) => {
      if (candidateToken.startsWith(queryToken)) return true;
      if (candidateToken.length >= 5 && queryToken.startsWith(candidateToken)) return true;
      return false;
    })
  ).length;
}

export function scoreCareerMatch(query: string, candidateName: string) {
  const normalizedQuery = normalizeCareerName(query);
  const normalizedCandidate = normalizeCareerName(candidateName);

  if (normalizedQuery.length < 3 || normalizedCandidate.length < 3) {
    return { score: 0, reason: 'typo' as const };
  }

  if (normalizedQuery === normalizedCandidate) {
    return { score: 1, reason: 'exact' as const };
  }

  if (
    normalizedCandidate.startsWith(`${normalizedQuery} `) ||
    normalizedCandidate.includes(` ${normalizedQuery} `) ||
    normalizedCandidate.endsWith(` ${normalizedQuery}`)
  ) {
    return { score: 0.94, reason: 'prefix' as const };
  }

  const queryTokens = significantTokens(normalizedQuery);
  const candidateTokens = significantTokens(normalizedCandidate);

  if (queryTokens.length) {
    const exactTokenMatches = queryTokens.filter((token) => candidateTokens.includes(token)).length;
    const prefixMatches = tokenPrefixMatches(queryTokens, candidateTokens);
    const fuzzyTokenMatches = queryTokens.filter((queryToken) =>
      candidateTokens.some((candidateToken) => {
        if (queryToken === candidateToken) return true;
        if (Math.min(queryToken.length, candidateToken.length) < 5) return false;
        return typoSimilarity(queryToken, candidateToken) >= 0.82;
      })
    ).length;
    const coverage = Math.max(exactTokenMatches, prefixMatches, fuzzyTokenMatches) / queryTokens.length;

    if (coverage === 1 && queryTokens.length <= candidateTokens.length) {
      if (exactTokenMatches === queryTokens.length) {
        return { score: 0.91, reason: 'token' as const };
      }
      if (prefixMatches === queryTokens.length) {
        return { score: 0.89, reason: 'prefix' as const };
      }
      return { score: 0.86, reason: 'token' as const };
    }

    if (coverage >= 0.67) {
      return { score: 0.72 + coverage * 0.1, reason: 'token' as const };
    }
  }

  const wholeNameSimilarity = typoSimilarity(normalizedQuery, normalizedCandidate);
  if (wholeNameSimilarity >= 0.72) {
    return { score: wholeNameSimilarity, reason: 'typo' as const };
  }

  if (queryTokens.length === 1) {
    const bestTokenSimilarity = candidateTokens.reduce(
      (best, token) => Math.max(best, typoSimilarity(queryTokens[0], token)),
      0
    );
    if (bestTokenSimilarity >= 0.78) {
      return { score: Math.min(0.88, bestTokenSimilarity), reason: 'typo' as const };
    }
  }

  return { score: 0, reason: 'typo' as const };
}

export function findCareerMatches<T extends CareerMatchCandidate>(
  query: string,
  candidates: T[],
  options: { limit?: number; minScore?: number } = {}
): CareerMatch<T>[] {
  const { limit = 3, minScore = 0.66 } = options;
  if (normalizeCareerName(query).length < 3) return [];

  return candidates
    .map((career) => {
      const match = scoreCareerMatch(query, career.nombre);
      return { career, ...match };
    })
    .filter((match) => match.score >= minScore)
    .sort(
      (left, right) =>
        right.score - left.score || left.career.nombre.localeCompare(right.career.nombre, 'es')
    )
    .slice(0, limit);
}

export function findStrongCareerMatch<T extends CareerMatchCandidate>(query: string, candidates: T[]) {
  return findCareerMatches(query, candidates, { limit: 1, minScore: 0.84 })[0] ?? null;
}
