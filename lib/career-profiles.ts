import { getSiglo21CareerProfile } from '@/lib/siglo21-career-profiles';

type OfficialCareerProfileInput = {
  universidadNombre?: string | null;
  carreraNombre?: string | null;
};

export type OfficialCareerProfile = {
  description: string;
  duration?: string;
  level?: string;
  title?: string;
  officialUrl: string;
  sourceName: string;
};

function normalizeLookupValue(value?: string | null) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function deriveCareerLevel(normalizedCareer: string) {
  if (
    normalizedCareer === 'procurador' ||
    normalizedCareer === 'martillero, corredor publico y corredor inmobiliario' ||
    normalizedCareer.startsWith('tecnicatura ')
  ) {
    return 'Pregrado';
  }

  return 'Grado';
}

function deriveCareerTitle(careerName: string, normalizedCareer: string) {
  if (normalizedCareer === 'abogacia') {
    return 'Abogado/a';
  }

  if (normalizedCareer === 'contador publico') {
    return 'Contador/a Publico/a';
  }

  if (normalizedCareer === 'medicina') {
    return 'Medico/a';
  }

  if (normalizedCareer === 'procurador') {
    return 'Procurador/a';
  }

  if (normalizedCareer === 'martillero, corredor publico y corredor inmobiliario') {
    return 'Martillero/a, Corredor/a Publico/a y Corredor/a Inmobiliario/a';
  }

  if (normalizedCareer.startsWith('ingenieria en ')) {
    return `Ingeniero/a en ${careerName.slice('Ingeniería en '.length)}`;
  }

  if (normalizedCareer.startsWith('lic. en ')) {
    return `Licenciado/a en ${careerName.slice('Lic. en '.length)}`;
  }

  if (normalizedCareer.startsWith('licenciatura en ')) {
    return `Licenciado/a en ${careerName.slice('Licenciatura en '.length)}`;
  }

  if (normalizedCareer.startsWith('tecnicatura universitaria en ')) {
    return `Tecnico/a Universitario/a en ${careerName.slice('Tecnicatura Universitaria en '.length)}`;
  }

  if (normalizedCareer.startsWith('tecnicatura en ')) {
    return `Tecnico/a en ${careerName.slice('Tecnicatura en '.length)}`;
  }

  return careerName;
}

export function getOfficialCareerProfile({
  universidadNombre,
  carreraNombre,
}: OfficialCareerProfileInput): OfficialCareerProfile | null {
  const normalizedUniversity = normalizeLookupValue(universidadNombre);
  const normalizedCareer = normalizeLookupValue(carreraNombre);

  if (!normalizedUniversity.includes('siglo 21') || !normalizedCareer || !carreraNombre) {
    return null;
  }

  const siglo21Profile = getSiglo21CareerProfile(carreraNombre);
  if (!siglo21Profile) {
    return null;
  }

  return {
    description: siglo21Profile.description,
    duration: siglo21Profile.duration ?? undefined,
    level: deriveCareerLevel(normalizedCareer),
    title: deriveCareerTitle(carreraNombre, normalizedCareer),
    officialUrl: siglo21Profile.url,
    sourceName: 'Universidad Siglo 21',
  };
}
