import { SITE_NAME, toAbsoluteUrl } from '@/lib/site';

export function buildOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: toAbsoluteUrl('/'),
    logo: toAbsoluteUrl('/icon.png'),
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'AR',
    },
    areaServed: 'AR',
  };
}

export function buildWebsiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: toAbsoluteUrl('/'),
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
    ...(universityName
      ? {
          provider: {
            '@type': 'EducationalOrganization',
            name: universityName,
          },
        }
      : {}),
  };
}
