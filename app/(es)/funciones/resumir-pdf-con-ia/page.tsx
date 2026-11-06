import type { Metadata } from 'next';
import { hreflangAlternates } from '@/lib/seo/hreflang-clusters';
import { ResumirPdfExperience } from '@/components/marketing/seo-study-experiences-v2';
import { toAbsoluteUrl } from '@/lib/site';

const path = '/funciones/resumir-pdf-con-ia';

export const metadata: Metadata = {
  title: "Resumir PDF con IA: ejemplo de resumen y práctica",
  description: "Resumí tus apuntes PDF con IA: mirá un ejemplo resuelto, revisá conceptos importantes y continuá con flashcards y preguntas del mismo documento.",
  alternates: hreflangAlternates('pdf-summary', 'es'),
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    title: "Resumir PDF con IA: ejemplo de resumen y práctica | Evaluo",
    description:
      'Elegí tu PDF, organizá las ideas clave en un resumen y seguí estudiando con flashcards y ejercicios del mismo material.',
    url: toAbsoluteUrl(path),
  },
};

export default function ResumirPdfConIaPage() {
  return <ResumirPdfExperience />;
}