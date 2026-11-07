import type { Metadata } from 'next';
import { ENGLISH_PAGES, type EnglishPageKey } from '@/lib/english-seo-content';
import { hreflangClusterForPath, hreflangLanguages } from '@/lib/seo/hreflang-clusters';
import { toAbsoluteUrl } from '@/lib/site';

// hreflang only pairs genuinely comparable topics; do not map the English
// landing hub to the Spanish homepage, which serves a different intent.
export function getEnglishSeoMetadata(key: EnglishPageKey): Metadata {
  const page = ENGLISH_PAGES[key];
  const url = toAbsoluteUrl(page.path);
  const cluster = hreflangClusterForPath(page.path);
  const languages = cluster ? hreflangLanguages(cluster) : undefined;

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
