import type { Metadata } from 'next';
import { EnglishHubPage } from '@/components/marketing/english-hub-page';
import { ES_NEUTRAL_HUB } from '@/lib/english-seo-hubs';
import { hreflangAlternates } from '@/lib/seo/hreflang-clusters';
import { DEFAULT_OG_IMAGES } from '@/lib/seo';

const alternates = hreflangAlternates('features-hub', 'es');

export const metadata: Metadata = {
  title: 'Plataforma de estudio con inteligencia artificial',
  description:
    'Estudia con IA a partir de tus apuntes: resúmenes, flashcards, preguntas de práctica y simulacros desde tu PDF o Word. Elige la herramienta según tu objetivo.',
  alternates,
  robots: { index: true, follow: true },
  openGraph: { images: DEFAULT_OG_IMAGES,
    type: 'website',
    locale: 'es_419',
    title: 'Plataforma de estudio con inteligencia artificial | Evaluo',
    description: 'Resúmenes, flashcards, preguntas de práctica y simulacros a partir de tus propios apuntes.',
    url: alternates.canonical,
  },
};

export default function Page() {
  return <EnglishHubPage hub={ES_NEUTRAL_HUB} />;
}
