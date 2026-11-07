import type { Metadata } from 'next';
import { GeneradorExamenesNeutralLanding } from '@/components/marketing/seo-practice-tools-landings';
import { hreflangAlternates } from '@/lib/seo/hreflang-clusters';

const alternates = hreflangAlternates('mock-exam', 'es');

export const metadata: Metadata = {
  title: 'Generador de exámenes con IA: practica con tus apuntes',
  description:
    'Genera exámenes de práctica con IA desde tu PDF o Word: preguntas por tema, simulacro con todo el temario y resultados para saber qué repasar. Empieza gratis.',
  alternates,
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    locale: 'es_419',
    title: 'Generador de exámenes con IA: practica con tus apuntes | Evaluo',
    description: 'Preguntas de práctica y simulacros generados a partir de tus propios apuntes, con resultados por tema.',
    url: alternates.canonical,
  },
};

export default function Page() {
  return <GeneradorExamenesNeutralLanding />;
}
