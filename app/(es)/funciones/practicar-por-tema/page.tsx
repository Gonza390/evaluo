import type { Metadata } from 'next';
import { hreflangAlternates } from '@/lib/seo/hreflang-clusters';
import { PracticarPorTemaLanding } from '@/components/marketing/seo-practice-tools-landings';
import { toAbsoluteUrl } from '@/lib/site';

const path = '/funciones/practicar-por-tema';

export const metadata: Metadata = {
  title: 'Practicar por tema con IA desde tu PDF, gratis',
  description:
    'Practicá por tema con IA desde tu PDF, gratis: elegís el archivo sin registrarte, respondés preguntas de cada capítulo y revisás tus errores antes de avanzar.',
  alternates: hreflangAlternates('practice-by-topic', 'es'),
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    title: 'Practicar por tema con IA desde tu PDF, gratis | Evaluo',
    description: 'Estudiá tema por tema, resolvé preguntas y revisá qué conceptos necesitás reforzar.',
    url: toAbsoluteUrl(path),
  },
};

export default function Page() {
  return <PracticarPorTemaLanding />;
}
