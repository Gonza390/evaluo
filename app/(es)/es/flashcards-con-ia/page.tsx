import type { Metadata } from 'next';
import { FlashcardsNeutralLanding } from '@/components/marketing/seo-practice-tools-landings';
import { hreflangAlternates } from '@/lib/seo/hreflang-clusters';
import { DEFAULT_OG_IMAGES } from '@/lib/seo';

const alternates = hreflangAlternates('pdf-to-flashcards', 'es');

export const metadata: Metadata = {
  title: 'Flashcards con IA gratis: crea tarjetas desde tu PDF',
  description:
    'Crea flashcards con IA gratis a partir de tu PDF o Word: tarjetas de pregunta y respuesta por tema. Eliges el archivo sin registrarte y repasas en minutos.',
  alternates,
  robots: { index: true, follow: true },
  openGraph: { images: DEFAULT_OG_IMAGES,
    type: 'website',
    locale: 'es_419',
    title: 'Flashcards con IA gratis: crea tarjetas desde tu PDF | Evaluo',
    description: 'Tarjetas de estudio por tema generadas a partir de tus propios apuntes.',
    url: alternates.canonical,
  },
};

export default function Page() {
  return <FlashcardsNeutralLanding />;
}
