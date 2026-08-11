import { rawSiglo21Profiles } from '@/lib/siglo21-career-profiles.data';

type RawSiglo21CareerProfile = {
  name: string;
  duration: string;
  modality: string;
  url: string;
};

export type Siglo21CareerProfile = {
  description: string;
  duration: string | null;
  modality: string | null;
  url: string;
};

function normalizeLookupValue(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

const curatedDescriptions: Record<string, string> = {
  abogacia:
    'Formación jurídica orientada al análisis legal, la argumentación y la práctica profesional.',
  'contador publico':
    'Formación en contabilidad, auditoría, impuestos y gestión financiera para organizaciones.',
  'ingenieria en software':
    'Carrera enfocada en desarrollo de software, arquitectura de sistemas y liderazgo tecnológico.',
  'lic. en administracion':
    'Formación en gestión, estrategia, finanzas y liderazgo para el mundo de los negocios.',
  'licenciatura en ciencia de datos':
    'Formación en análisis de datos, inteligencia artificial y programación aplicada a la innovación.',
  'licenciatura en comercializacion – marketing':
    'Carrera orientada a estrategia comercial, marcas, consumo y marketing digital.',
  'licenciatura en comercio internacional':
    'Formación en negocios globales, exportación, importación y gestión internacional.',
  'licenciatura en criminologia y seguridad':
    'Carrera centrada en prevención, investigación criminal y gestión de la seguridad.',
  'licenciatura en diseño grafico':
    'Formación en identidad visual, comunicación gráfica y producción de piezas digitales e impresas.',
  'licenciatura en gestion de recursos humanos':
    'Formación para liderar talento, clima, desarrollo organizacional y relaciones laborales.',
  'licenciatura en informatica':
    'Carrera orientada a sistemas, desarrollo, infraestructura y gestión de tecnología.',
  'licenciatura en inteligencia artificial y robotica':
    'Formación en inteligencia artificial, automatización y aplicaciones de robótica.',
  'licenciatura en nutricion':
    'Carrera enfocada en alimentación, salud, prevención y acompañamiento nutricional.',
  'licenciatura en psicologia':
    'Formación en salud mental, conducta humana, evaluación e intervenciones psicológicas.',
  'licenciatura en publicidad':
    'Carrera orientada a creatividad, estrategia de marca, medios y campañas publicitarias.',
  'licenciatura en relaciones internacionales':
    'Formación en política internacional, geopolítica, negociación y cooperación global.',
  'licenciatura en relaciones publicas e institucionales':
    'Carrera enfocada en comunicación institucional, imagen, prensa y vínculos estratégicos.',
  'licenciatura en seguridad informatica':
    'Formación en ciberseguridad, protección de datos y gestión de riesgos digitales.',
  'martillero, corredor publico y corredor inmobiliario':
    'Formación en operaciones inmobiliarias, tasación, corretaje y normativa del sector.',
  medicina:
    'Formación con foco en excelencia clínica, sensibilidad humana y ética profesional.',
  procurador:
    'Carrera orientada a la práctica procesal, la gestión jurídica y el acompañamiento judicial.',
  'tecnicatura en administracion y gestion tributaria':
    'Formación en gestión impositiva, administración tributaria y operatoria fiscal.',
  'tecnicatura en atencion prehospitalaria de emergencias':
    'Carrera centrada en respuesta inicial, urgencias y asistencia prehospitalaria.',
  'tecnicatura en direccion de equipos de ventas':
    'Formación en liderazgo comercial, negociación y gestión estratégica de ventas.',
  'tecnicatura en direccion de protocolo, organizacion de eventos y relaciones publicas':
    'Formación en protocolo, ceremonial, eventos y comunicación institucional.',
  'tecnicatura en gestion contable e impositiva':
    'Carrera orientada a registración contable, impuestos y gestión administrativa.',
  'tecnicatura en gestion de empresas familiares':
    'Formación para profesionalizar empresas familiares, liderazgo y procesos de sucesión.',
  'tecnicatura en gestion de moda':
    'Carrera enfocada en negocios de moda, tendencias, branding y desarrollo de proyectos.',
  'tecnicatura en gestion y auditorias ambientales':
    'Formación en gestión ambiental, sustentabilidad y auditorías para organizaciones.',
  'tecnicatura en hidrocarburos y geociencia':
    'Carrera centrada en recursos energéticos, exploración y procesos hidrocarburíferos.',
  'tecnicatura en higiene y seguridad laboral':
    'Formación en prevención de riesgos, seguridad ocupacional y normativa laboral.',
  'tecnicatura en investigacion de la escena del crimen':
    'Carrera orientada a criminalística, indicios y análisis de la escena del crimen.',
  'tecnicatura en relaciones laborales':
    'Formación en vínculos laborales, negociación y gestión de personas.',
  'tecnicatura en responsabilidad y gestion social':
    'Carrera enfocada en impacto social, proyectos comunitarios y responsabilidad organizacional.',
  'tecnicatura universitaria en administracion publica y gestion de politicas publicas':
    'Formación en gestión pública, planificación estatal y políticas públicas.',
  'tecnicatura universitaria en diseño y animacion digital':
    'Carrera orientada a animación, ilustración digital y producción visual.',
  'tecnicatura universitaria en diseño y desarrollo de videojuegos':
    'Formación en diseño, programación y desarrollo de videojuegos.',
  'tecnicatura universitaria en enfermeria':
    'Carrera centrada en cuidados, práctica asistencial y acompañamiento de pacientes.',
  'tecnicatura universitaria en gestion administrativa de servicios de salud':
    'Formación en administración, procesos y gestión operativa de servicios de salud.',
  'tecnicatura universitaria en gestion de recursos turisticos':
    'Carrera orientada a gestión, desarrollo y aprovechamiento de recursos turísticos.',
  'tecnicatura universitaria en marketing y publicidad digital':
    'Formación en marketing digital, contenidos, medios y performance online.',
  'tecnicatura universitaria en promocion comunitaria en niñez y adolescencia':
    'Carrera enfocada en trabajo comunitario, cuidado y promoción de derechos en niñez y adolescencia.',
  'tecnicatura universitaria en redes informaticas y telecomunicaciones':
    'Formación en redes, conectividad, infraestructura y telecomunicaciones.',
};

const profiles = (rawSiglo21Profiles as readonly RawSiglo21CareerProfile[]).reduce<Record<string, Siglo21CareerProfile>>(
  (acc, profile) => {
    const key = normalizeLookupValue(profile.name);
    acc[key] = {
      description:
        curatedDescriptions[key] ?? 'Conoce el plan de estudios y el perfil profesional de esta carrera.',
      duration: profile.duration?.trim() ? profile.duration.trim() : null,
      modality: profile.modality?.trim() ? profile.modality.trim() : null,
      url: profile.url,
    };

    return acc;
  },
  {}
);

export function getSiglo21CareerProfile(careerName: string): Siglo21CareerProfile | null {
  return profiles[normalizeLookupValue(careerName)] ?? null;
}
