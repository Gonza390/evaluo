import type { Metadata } from 'next';
import { GeneradorExamenesNeutralLanding } from '@/components/marketing/seo-practice-tools-landings';
import { hreflangAlternates } from '@/lib/seo/hreflang-clusters';

const alternates = hreflangAlternates('mock-exam', 'es');

export const metadata: Metadata = {
  title: 'Generador de exámenes con IA gratis: desde tu PDF',
  description:
    'Generador de exámenes con IA gratis: sube tu material y practica con preguntas sobre él. Eliges el archivo sin registrarte y ves qué repasar.',
  alternates,
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    locale: 'es_419',
    title: 'Generador de exámenes con IA gratis: desde tu PDF | Evaluo',
    description: 'Preguntas de práctica y simulacros generados a partir de tus propios apuntes, con resultados por tema.',
    url: alternates.canonical,
  },
};

export default function Page() {
  return <GeneradorExamenesNeutralLanding />;
}
