export type FacultyProfile = {
  displayName?: string;
  subtitle: string;
  description: string;
  facts: Array<{
    label: string;
    value: string;
  }>;
  officialUrl: string;
  sourceName: string;
};

function normalize(value?: string | null) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const FACULTY_PROFILES: Record<string, FacultyProfile> = {
  'universidad de buenos aires::ciencias medicas': {
    displayName: 'Facultad de Ciencias Médicas',
    subtitle:
      'Unidad académica de la UBA dedicada a la formación, investigación y extensión en el campo de las ciencias de la salud.',
    description:
      'La Facultad de Ciencias Médicas de la Universidad de Buenos Aires fue constituida formalmente como Facultad en 1852, sobre una tradición de enseñanza médica que se remonta a los primeros años de la Universidad. Su misión institucional es formar profesionales de la salud con compromiso social, espíritu crítico, capacidad de adaptación a los cambios científicos y tecnológicos, y responsabilidad en la promoción, mantenimiento y recuperación de la salud. También desarrolla investigación, docencia, extensión y servicios vinculados con las ciencias médicas.',
    facts: [
      { label: 'Creación formal como Facultad', value: '1852' },
      { label: 'Sede principal', value: 'Paraguay 2155, Ciudad Autónoma de Buenos Aires' },
      { label: 'Área académica', value: 'Ciencias médicas y de la salud' },
      { label: 'Edificio actual', value: 'Finalizado en 1944' },
    ],
    officialUrl: 'https://www.fmed.uba.ar/la-facultad/mision',
    sourceName: 'Facultad de Ciencias Médicas - UBA',
  },
  'universidad de buenos aires::facultad de ciencias medicas': {
    displayName: 'Facultad de Ciencias Médicas',
    subtitle:
      'Unidad académica de la UBA dedicada a la formación, investigación y extensión en el campo de las ciencias de la salud.',
    description:
      'La Facultad de Ciencias Médicas de la Universidad de Buenos Aires fue constituida formalmente como Facultad en 1852, sobre una tradición de enseñanza médica que se remonta a los primeros años de la Universidad. Su misión institucional es formar profesionales de la salud con compromiso social, espíritu crítico, capacidad de adaptación a los cambios científicos y tecnológicos, y responsabilidad en la promoción, mantenimiento y recuperación de la salud. También desarrolla investigación, docencia, extensión y servicios vinculados con las ciencias médicas.',
    facts: [
      { label: 'Creación formal como Facultad', value: '1852' },
      { label: 'Sede principal', value: 'Paraguay 2155, Ciudad Autónoma de Buenos Aires' },
      { label: 'Área académica', value: 'Ciencias médicas y de la salud' },
      { label: 'Edificio actual', value: 'Finalizado en 1944' },
    ],
    officialUrl: 'https://www.fmed.uba.ar/la-facultad/mision',
    sourceName: 'Facultad de Ciencias Médicas - UBA',
  },
};

export function getFacultyProfile(
  universityName?: string | null,
  facultyName?: string | null
): FacultyProfile | null {
  const university = normalize(universityName);
  const faculty = normalize(facultyName);
  if (!university || !faculty) return null;
  return FACULTY_PROFILES[`${university}::${faculty}`] ?? null;
}
