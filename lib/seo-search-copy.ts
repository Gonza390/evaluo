function normalizeSeoLabel(value?: string | null) {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

const SEARCH_TITLE_BUDGET = 58;

export function isSiglo21University(value?: string | null) {
  const normalized = normalizeSeoLabel(value);
  return normalized.includes('siglo 21') || normalized.includes('siglo xxi');
}

function appendSiglo21WhenFits(baseTitle: string, universityName?: string | null) {
  if (!isSiglo21University(universityName)) return baseTitle;
  const withUniversity = `${baseTitle} | Siglo 21`;
  return withUniversity.length <= SEARCH_TITLE_BUDGET ? withUniversity : baseTitle;
}

export function buildMateriaSearchTitle(
  materiaNombre: string,
  universityName?: string | null
) {
  if (isSiglo21University(universityName)) {
    const intentTitle = `${materiaNombre}: parciales y material`;
    const intentWithUniversity = `${intentTitle} | Siglo 21`;

    if (intentWithUniversity.length <= SEARCH_TITLE_BUDGET) {
      return intentWithUniversity;
    }

    return appendSiglo21WhenFits(materiaNombre, universityName);
  }

  return universityName
    ? `${materiaNombre} - ${universityName}`
    : `Guía y recursos de ${materiaNombre}`;
}

export function buildPregunteroSearchTitle(
  materiaNombre: string,
  universityName?: string | null
) {
  return appendSiglo21WhenFits(`Preguntero de ${materiaNombre}`, universityName);
}

export function buildPregunteroParcialSearchTitle(input: {
  materiaNombre: string;
  parcial: '1' | '2' | 'integrador';
  universityName?: string | null;
}) {
  const parcialLabel = input.parcial === 'integrador' ? 'Integrador' : `Parcial ${input.parcial}`;
  return appendSiglo21WhenFits(
    `Preguntero ${parcialLabel}: ${input.materiaNombre}`,
    input.universityName
  );
}
