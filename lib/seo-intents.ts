const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const INVALID_SEO_ENTITY_ID = '00000000-0000-0000-0000-000000000000';

export function isValidSeoEntityId(value: string) {
  return UUID_PATTERN.test(value.trim());
}

export function slugifySeoSegment(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

export function buildSeoEntitySlug(name: string, id: string) {
  return `${slugifySeoSegment(name)}--${id}`;
}

export function parseSeoEntitySlug(value: string) {
  const delimiterIndex = value.lastIndexOf('--');
  const rawId = delimiterIndex === -1 ? value : value.slice(delimiterIndex + 2);
  const labelSlug = delimiterIndex === -1 ? value : value.slice(0, delimiterIndex);

  return {
    id: isValidSeoEntityId(rawId) ? rawId : INVALID_SEO_ENTITY_ID,
    labelSlug,
  };
}

export function buildCareerStudyDescription(input: {
  carreraNombre: string;
  universidadNombre: string;
  summary?: string | null;
}) {
  if (input.summary?.trim()) {
    return `Conoce cómo estudiar ${input.carreraNombre} en ${input.universidadNombre}. ${input.summary.trim()}`;
  }

  return `Conoce cómo estudiar ${input.carreraNombre} en ${input.universidadNombre}, qué materias vas a cursar y cómo prepararte con resúmenes, recursos y simuladores en Evaluo.`;
}

export function buildSummaryLandingDescription(input: {
  materiaNombre: string;
  carreraNombre?: string | null;
  universidadNombre?: string | null;
}) {
  const context = [input.carreraNombre, input.universidadNombre].filter(Boolean).join(' en ');

  return context
    ? `Accede a resúmenes de ${input.materiaNombre} para ${context}, con material ordenado para estudiar mejor en Evaluo.`
    : `Accede a resúmenes de ${input.materiaNombre}, con material ordenado para estudiar mejor en Evaluo.`;
}

export function buildSimulatorLandingDescription(input: {
  carreraNombre: string;
  universidadNombre: string;
  materiasCount: number;
}) {
  const materiasLabel =
    input.materiasCount > 0
      ? `Explora ${input.materiasCount} materias disponibles`
      : 'Explora las materias disponibles';

  return `${materiasLabel} y practica con simuladores de parcial de ${input.carreraNombre} en ${input.universidadNombre} desde Evaluo.`;
}
