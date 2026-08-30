function normalizeSeoLabel(value?: string | null) {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function isSiglo21University(value?: string | null) {
  const normalized = normalizeSeoLabel(value);
  return normalized.includes('siglo 21') || normalized.includes('siglo xxi');
}

function appendSiglo21WhenFits(baseTitle: string, universityName?: string | null) {
  if (!isSiglo21University(universityName)) return baseTitle;
  const withUniversity = `${baseTitle} | Siglo 21`;
  return withUniversity.length <= 62 ? withUniversity : baseTitle;
}

export function buildPregunteroSearchTitle(
  materiaNombre: string,
  universityName?: string | null
) {
  return appendSiglo21WhenFits(`${materiaNombre} – Preguntero`, universityName);
}

export function buildPregunteroParcialSearchTitle(input: {
  materiaNombre: string;
  parcial: '1' | '2' | 'integrador';
  universityName?: string | null;
}) {
  const parcialLabel = input.parcial === 'integrador' ? 'Integrador' : `Parcial ${input.parcial}`;
  return appendSiglo21WhenFits(
    `${input.materiaNombre} – Preguntero ${parcialLabel}`,
    input.universityName
  );
}
