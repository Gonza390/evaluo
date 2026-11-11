import type { Metadata } from 'next';
import { ResumenesNeutralLanding } from '@/components/marketing/seo-practice-tools-landings';
import { hreflangAlternates } from '@/lib/seo/hreflang-clusters';
import { DEFAULT_OG_IMAGES } from '@/lib/seo';

const alternates = hreflangAlternates('pdf-summary', 'es');

export const metadata: Metadata = {
  title: 'Resumidor de textos con IA gratis por temas',
  description:
    'Resumidor de textos con IA gratis: un resumen y un glosario por tema de tu material. Eliges el archivo sin registrarte y luego practicas.',
  alternates,
  robots: { index: true, follow: true },
  openGraph: { images: DEFAULT_OG_IMAGES,
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
