import type { Metadata } from 'next';
import { ResumenesNeutralLanding } from '@/components/marketing/seo-practice-tools-landings';
import { hreflangAlternates } from '@/lib/seo/hreflang-clusters';

const alternates = hreflangAlternates('pdf-summary', 'es');

export const metadata: Metadata = {
  title: 'Resúmenes con IA: resume tus apuntes por temas',
  description:
    'Resume tu PDF o Word con IA: un resumen y un glosario por tema, conectados al documento original, y preguntas para comprobar lo que entendiste. Gratis.',
  alternates,
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    locale: 'es_419',
    title: 'Resúmenes con IA: resume tus apuntes por temas | Evaluo',
    description: 'Un resumen y un glosario por tema, conectados a tus apuntes, con práctica del mismo material.',
    url: alternates.canonical,
  },
};

export default function Page() {
  return <ResumenesNeutralLanding />;
}
