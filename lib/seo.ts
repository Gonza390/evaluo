import { SITE_NAME, toAbsoluteUrl } from '@/lib/site';

export function buildOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': toAbsoluteUrl('/#organization'),
    name: SITE_NAME,
    // Hay otras empresas llamadas "Evaluo" (plataformas de tests, startups europeas): los nombres
    // alternativos y el eslogan ayudan a Google a distinguir esta marca en la búsqueda "evaluo".
    alternateName: ['Evaluo App', 'evaluoapp'],
    slogan: 'Estudiá tus apuntes con IA y prepará tus exámenes',
    url: toAbsoluteUrl('/'),
    logo: toAbsoluteUrl('/icon.png'),
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'AR',
    },
    description:
      'Plataforma educativa para estudiar PDF y Word con IA: resúmenes por temas, actividades de práctica, revisión de errores y planes de estudio.',
    areaServed: [
      { '@type': 'Country', name: 'Argentina' },
      { '@type': 'Country', name: 'México' },
      { '@type': 'Country', name: 'Colombia' },
      { '@type': 'Country', name: 'España' },
    ],
    sameAs: [
      'https://www.instagram.com/evaluo.app/',
      'https://www.linkedin.com/company/evaluo-ar/',
      'https://alternativeto.net/software/evaluo-ai-study/',
    ],
  };
}

export function buildWebsiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': toAbsoluteUrl('/#website'),
    name: SITE_NAME,
    alternateName: ['Evaluo App', 'evaluoapp.com'],
    inLanguage: ['es', 'en'],
    url: toAbsoluteUrl('/'),
    publisher: {
      '@id': toAbsoluteUrl('/#organization'),
    },
  };
}

/** La plataforma como aplicación web educativa, con su plan gratuito. Sin valoraciones: solo datos verificables. */
export function buildSoftwareApplicationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    '@id': toAbsoluteUrl('/#application'),
    name: SITE_NAME,
    url: toAbsoluteUrl('/'),
    description:
      'Plataforma educativa web para estudiar PDF y Word con IA, crear resúmenes por temas, practicar, revisar errores y planificar exámenes.',
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web',
    inLanguage: ['es', 'en'],
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', description: 'Plan gratuito' },
    publisher: { '@id': toAbsoluteUrl('/#organization') },
  };
}

export function buildBreadcrumbJsonLd(
  items: Array<{
    name: string;
    path: string;
  }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: toAbsoluteUrl(item.path),
    })),
  };
}

export function buildFaqJsonLd(
  items: Array<{
    question: string;
    answer: string;
  }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

export function buildCollectionPageJsonLd({
  name,
  description,
  url,
}: {
  name: string;
  description: string;
  url: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description,
    url: toAbsoluteUrl(url),
    inLanguage: 'es-AR',
    isPartOf: {
      '@type': 'WebSite',
      name: SITE_NAME,
      url: toAbsoluteUrl('/'),
    },
  };
}

export function buildCourseJsonLd({
  name,
  description,
  url,
}: {
  name: string;
  description: string;
  url: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name,
    description,
    url: toAbsoluteUrl(url),
    provider: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: toAbsoluteUrl('/'),
    },
    inLanguage: 'es-AR',
    isAccessibleForFree: true,
  };
}

export function buildLearningResourceJsonLd({
  name,
  universityName,
  careerName,
  preguntaCount,
  url,
}: {
  name: string;
  universityName?: string;
  careerName?: string;
  preguntaCount?: number;
  url: string;
}) {
  const baseDescription = [
    careerName ? `Materia ${name} de ${careerName}` : `Materia ${name}`,
    'con resúmenes, pregunteros y simuladores de examen en Evaluo.',
  ].join(' ');

  return {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name,
    description:
      preguntaCount && preguntaCount > 0
        ? `${baseDescription} Más de ${preguntaCount} preguntas de práctica.`
        : baseDescription,
    url: toAbsoluteUrl(url),
    inLanguage: 'es-AR',
    isAccessibleForFree: true,
    learningResourceType: ['Resumen', 'Preguntero', 'Simulador de examen'],
    provider: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: toAbsoluteUrl('/'),
    },
    ...(universityName
      ? {
          about: {
            '@type': 'EducationalOrganization',
            name: universityName,
          },
        }
      : {}),
  };
}
