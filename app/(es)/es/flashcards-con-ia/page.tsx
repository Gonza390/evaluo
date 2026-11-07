import type { Metadata } from 'next';
import { FlashcardsNeutralLanding } from '@/components/marketing/seo-practice-tools-landings';
import { hreflangAlternates } from '@/lib/seo/hreflang-clusters';

const alternates = hreflangAlternates('pdf-to-flashcards', 'es');

export const metadata: Metadata = {
  title: 'Flashcards con IA: crea tarjetas de estudio desde tu PDF',
  description:
    'Crea flashcards con IA a partir de tu PDF o Word: tarjetas por tema, una idea por tarjeta y preguntas de práctica del mismo material. Empieza gratis.',
  alternates,
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    locale: 'es_419',
    title: 'Flashcards con IA: crea tarjetas de estudio desde tu PDF | Evaluo',
    description: 'Tarjetas de estudio por tema generadas a partir de tus propios apuntes.',
    url: alternates.canonical,
  },
};

export default function Page() {
  return <FlashcardsNeutralLanding />;
}
