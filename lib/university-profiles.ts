export type UniversityProfile = {
  subtitle: string;
  badges?: string[];
  highlightStats?: Array<{
    label: string;
    value: string;
  }>;
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

const UNIVERSITY_PROFILES: Record<string, UniversityProfile> = {
  'universidad siglo 21': {
    subtitle: 'Universidad privada federal con foco en innovación, alcance territorial y proyección internacional.',
    badges: ['30 años innovando la educación', 'Red federal en todo el país'],
    highlightStats: [
      { label: 'Estudiantes', value: '+90.000' },
      { label: 'Convenios internacionales', value: '+250' },
      { label: 'Sedes', value: '4' },
      { label: 'CAUs', value: '+320' },
    ],
    officialUrl: 'https://21.edu.ar/',
    sourceName: 'Universidad Siglo 21',
  },
};

export function getUniversityProfile(universityName?: string | null): UniversityProfile | null {
  const normalizedName = normalizeLookupValue(universityName);
  if (!normalizedName) {
    return null;
  }

  return UNIVERSITY_PROFILES[normalizedName] ?? null;
}
