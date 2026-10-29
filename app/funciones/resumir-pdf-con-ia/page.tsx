import type { Metadata } from 'next';
import { ResumirPdfExperience } from '@/components/marketing/seo-study-experiences-v2';
import { toAbsoluteUrl } from '@/lib/site';

const path = '/funciones/resumir-pdf-con-ia';

export const metadata: Metadata = {
  title: "Resumir PDF con IA: resúmenes de apuntes",
  description: "Resumí un PDF con IA usando tus apuntes: identificá ideas clave, consultá un ejemplo de resumen y seguí practicando con el mismo material.", obtené un resumen con ideas y conceptos clave y continuá practicando sobre el mismo documento en Evaluo.',
  alternates: { canonical: toAbsoluteUrl(path) },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    title: 'Resumir PDF con IA: resumen de apuntes para estudiar | Evaluo',
    description:
      'Elegí tu PDF, organizá las ideas clave en un resumen y seguí estudiando con flashcards y ejercicios del mismo material.',
    url: toAbsoluteUrl(path),
  },
};

export default function ResumirPdfConIaPage() {
  return <ResumirPdfExperience />;
}