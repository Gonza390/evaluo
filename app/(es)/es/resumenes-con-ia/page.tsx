import type { Metadata } from 'next';
import { ResumenesNeutralLanding } from '@/components/marketing/seo-practice-tools-landings';
import { hreflangAlternates } from '@/lib/seo/hreflang-clusters';

const alternates = hreflangAlternates('pdf-summary', 'es');

export const metadata: Metadata = {
  title: 'Resumidor de textos con IA gratis por temas',
  description:
    'Haz resúmenes con IA gratis a partir de tu PDF o Word: un resumen y un glosario por tema. Eliges el archivo sin registrarte y luego practicas con el mismo material.',
  alternates,
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    locale: 'es_419',
    title: 'Resumidor de textos con IA gratis | Evaluo',
    description: 'Un resumen y un glosario por tema, conectados a tus apuntes, con práctica del mismo material.',
    url: alternates.canonical,
  },
};

export default function Page() {
  return <ResumenesNeutralLanding />;
}
