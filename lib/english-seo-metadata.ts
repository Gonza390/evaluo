import type { Metadata } from 'next';
import { ENGLISH_PAGES, type EnglishPageKey } from '@/lib/english-seo-content';
import { STUDY_HREFLANG } from '@/lib/international-study-landings';
import { toAbsoluteUrl } from '@/lib/site';

// hreflang only pairs genuinely comparable topics; do not map the English
// landing hub to the Spanish homepage, which serves a different intent.
export function getEnglishSeoMetadata(key: EnglishPageKey): Metadata {
  const page = ENGLISH_PAGES[key];
  const url = toAbsoluteUrl(page.path);
  const languages: Record<string, string> | undefined =
    key === 'study-pdf-with-ai'
      ? { ...STUDY_HREFLANG, en: url }
      : key === 'pdf-to-quiz'
        ? { en: url, es: toAbsoluteUrl('/convertir-pdf-en-preguntas') }
        : key === 'pdf-to-flashcards'
          ? { en: url, es: toAbsoluteUrl('/funciones/crear-flashcards-desde-pdf') }
          : undefined;

  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: url, ...(languages ? { languages } : {}) },
    robots: { index: true, follow: true },
    openGraph: {
      type: 'article',
      url,
      locale: 'en_US',
      siteName: 'Evaluo',
      title: page.title + ' | Evaluo',
      description: page.description,
      images: [{
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Evaluo — practical PDF study resources',
      }],
    },
  };
}
