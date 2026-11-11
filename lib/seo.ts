import { SITE_NAME, toAbsoluteUrl } from '@/lib/site';

/**
 * Imagen Open Graph por defecto. Next combina la metadata de forma superficial: si una página
 * define su propio `openGraph`, pierde la imagen del layout. Las páginas la reutilizan desde acá.
 */
export const DEFAULT_OG_IMAGES = [
  {
    url: '/evaluo-whatsapp-progreso.png',
    width: 1200,
    height: 630,
    alt: 'Evaluo: estudia tu material con IA y practica por tema',
  },
];

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
    logo: { '@type': 'ImageObject', url: toAbsoluteUrl('/icon.png'), width: 128, height: 128 },
    image: toAbsoluteUrl('/evaluo-whatsapp-progreso.png'),
    founder: { '@type': 'Person', name: 'Gonzalo Olmos', jobTitle: 'Fundador' },
    knowsAbout: ['Técnicas de estudio', 'Inteligencia artificial aplicada a la educación', 'Preparación de exámenes'],
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'AR',
    },
    description:
      'Plataforma educativa para estudiar tu propio material con IA: resúmenes por temas, actividades de práctica, revisión de errores y planes de estudio.',
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
      'https://www.crunchbase.com/organization/gonzalo',
      'https://appgentina.com.ar/producto/evaluo',
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
export function buildSoftwareApplicationJsonLd(locale: 'es' | 'en' = 'es') {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    '@id': toAbsoluteUrl('/#application'),
    name: SITE_NAME,
    url: toAbsoluteUrl(locale === 'en' ? '/en' : '/'),
    description:
      locale === 'en'
        ? 'Web study platform that turns your study material into topic summaries, flashcards, practice questions and mock exams with AI, and tracks what to review.'
        : 'Plataforma educativa web para estudiar tu material de estudio con IA, crear resúmenes por temas, practicar, revisar errores y planificar exámenes.',
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web',
    inLanguage: ['es', 'en'],
    image: toAbsoluteUrl('/evaluo-whatsapp-progreso.png'),
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: locale === 'en' ? 'Free plan' : 'Plan gratuito',
    },
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

/** Lista de enlaces de una página índice (guías, artículos, comparativas). */
export function buildItemListJsonLd({
  name,
  url,
  items,
}: {
  name: string;
  url: string;
  items: Array<{ name: string; url: string }>;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    url: toAbsoluteUrl(url),
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      url: toAbsoluteUrl(item.url),
    })),
  };
}
