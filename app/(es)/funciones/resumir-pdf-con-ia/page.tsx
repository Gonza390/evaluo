import type { Metadata } from 'next';
import { hreflangAlternates } from '@/lib/seo/hreflang-clusters';
import { ResumirPdfExperience } from '@/components/marketing/seo-study-experiences-v2';
import { toAbsoluteUrl } from '@/lib/site';

const path = '/funciones/resumir-pdf-con-ia';

export const metadata: Metadata = {
  title: 'Resumir PDF con IA gratis: resumen por temas y glosario',
  description:
    'Resumí un PDF con IA gratis: elegís el archivo sin registrarte y obtenés un resumen por temas con glosario, más flashcards y preguntas del mismo documento.',
  alternates: hreflangAlternates('pdf-summary', 'es-AR'),
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    title: 'Resumir PDF con IA gratis: resumen por temas y glosario | Evaluo',
    description:
      'Elegí tu PDF, organizá las ideas clave en un resumen y seguí estudiando con flashcards y ejercicios del mismo material.',
    url: toAbsoluteUrl(path),
  },
};

export default function ResumirPdfConIaPage() {
  return <ResumirPdfExperience />;
}