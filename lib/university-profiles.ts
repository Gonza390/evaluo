export type UniversityProfile = {
  subtitle: string;
  description?: string;
  badges?: string[];
  highlightStats?: Array<{
    label: string;
    value: string;
  }>;
  facts?: Array<{
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
  'universidad de buenos aires': {
    subtitle: 'Universidad pública, gratuita, autónoma y cogobernada, fundada en Buenos Aires en 1821.',
    description:
      'La Universidad de Buenos Aires fue fundada el 12 de agosto de 1821. Es una universidad pública, gratuita, autónoma y cogobernada, con una comunidad académica masiva y una fuerte tradición en docencia, investigación y compromiso social. Su estructura reúne 13 facultades y el Ciclo Básico Común, además de una amplia oferta de grado y posgrado.',
    badges: ['Fundada en 1821', 'Universidad pública y gratuita'],
    highlightStats: [
      { label: 'Estudiantes', value: '+330.000' },
      { label: 'Facultades', value: '13' },
      { label: 'Carreras de grado', value: '+110' },
      { label: 'Premios Nobel vinculados a la UBA', value: '5' },
    ],
    facts: [
      { label: 'Fundación', value: '12 de agosto de 1821' },
      { label: 'Carácter', value: 'Pública, gratuita, autónoma y cogobernada' },
      { label: 'Facultades', value: '13' },
      { label: 'Carreras de grado', value: 'Más de 110' },
      { label: 'Carreras de posgrado', value: 'Más de 550' },
      { label: 'Estudiantes', value: 'Más de 330.000' },
    ],
    officialUrl: 'https://www.uba.ar/datosuba',
    sourceName: 'Universidad de Buenos Aires',
  },
};

export function getUniversityProfile(universityName?: string | null): UniversityProfile | null {
  const normalizedName = normalizeLookupValue(universityName);
  if (!normalizedName) {
    return null;
  }

  return UNIVERSITY_PROFILES[normalizedName] ?? null;
}
