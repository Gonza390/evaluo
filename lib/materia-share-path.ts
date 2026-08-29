import { slugifySeoSegment } from '@/lib/seo-intents';

const UNIVERSITY_NOISE = [
  'universidad',
  'nacional',
  'argentina',
  'de la',
  'del',
  'de',
] as const;

const APPROVED_CREATOR_LABELS: Record<string, string> = {
  tori: 'Tori',
  fox: 'Grupo FOX',
  'tori-fox': 'Tori / Grupo FOX',
};

export function buildUniversityShareSegment(value: string) {
  let cleaned = value.toLowerCase();
  for (const token of UNIVERSITY_NOISE) {
    cleaned = cleaned.replace(new RegExp(`\\b${token}\\b`, 'gi'), ' ');
  }

  return slugifySeoSegment(cleaned)
    .replace(/-(?=\d)/g, '')
    .replace(/(?<=\d)-/g, '');
}

export function buildMateriaShareSlug(materiaNombre: string, universidadNombre?: string | null) {
  const materiaSlug = slugifySeoSegment(materiaNombre);
  const universidadSlug = universidadNombre ? buildUniversityShareSegment(universidadNombre) : '';

  return universidadSlug ? `${materiaSlug}-${universidadSlug}` : materiaSlug;
}

export function buildMateriaSharePath(materiaNombre: string, universidadNombre?: string | null) {
  return `/${buildMateriaShareSlug(materiaNombre, universidadNombre)}`;
}

export function getApprovedShareCreatorLabel(rawCreator?: string | null) {
  if (!rawCreator) return null;
  return APPROVED_CREATOR_LABELS[slugifySeoSegment(rawCreator)] ?? null;
}
