import type { Metadata } from 'next';
import { PracticarPorTemaLanding } from '@/components/marketing/seo-practice-tools-landings';
import { toAbsoluteUrl } from '@/lib/site';

const path = '/funciones/practicar-por-tema';

export const metadata: Metadata = {
  title: "Practicar por tema con IA: preguntas desde PDF",
  description: "Practicá por tema con IA desde tus apuntes en PDF: respondé preguntas de un capítulo, revisá errores y decidí cuándo avanzar al siguiente.",
  alternates: { canonical: toAbsoluteUrl(path) },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    title: "Practicar por tema con IA: preguntas desde PDF | Evaluo",
    description: 'Estudiá tema por tema, resolvé preguntas y revisá qué conceptos necesitás reforzar.',
    url: toAbsoluteUrl(path),
  },
};

export default function Page() {
  return <PracticarPorTemaLanding />;
}
