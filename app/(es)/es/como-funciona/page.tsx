import type { Metadata } from 'next';
import { HowItWorksPage } from '@/components/marketing/how-it-works-page';
import { hreflangAlternates } from '@/lib/seo/hreflang-clusters';
import { DEFAULT_OG_IMAGES } from '@/lib/seo';

const alternates = hreflangAlternates('how-it-works', 'es');

export const metadata: Metadata = {
  title: 'Cómo funciona Evaluo: plataforma de estudio con IA',
  description:
    'Sube tu PDF o Word y Evaluo lo organiza por temas, genera preguntas de práctica, muestra tus resultados y arma un plan hasta el examen. Planes y límites.',
  alternates,
  robots: { index: true, follow: true },
  openGraph: { images: DEFAULT_OG_IMAGES,
    type: 'website',
    locale: 'es_419',
    title: 'Cómo funciona Evaluo: plataforma de estudio con IA | Evaluo',
    description: 'De tus apuntes a un plan para el examen, en cinco pasos.',
    url: alternates.canonical,
  },
};

export default function Page() {
  return <HowItWorksPage locale="es" />;
}
