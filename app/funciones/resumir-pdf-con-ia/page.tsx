import type { Metadata } from 'next';
import { ResumirPdfExperience } from '@/components/marketing/seo-study-experiences';
import { toAbsoluteUrl } from '@/lib/site';

const path = '/funciones/resumir-pdf-con-ia';

export const metadata: Metadata = {
  title: 'Resumir PDF con IA para estudiar',
  description:
    'Resumí un PDF con IA y seguí estudiando el mismo contenido con mapas mentales, glosario, flashcards y ejercicios en Evaluo.',
  alternates: { canonical: toAbsoluteUrl(path) },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    title: 'Resumir PDF con IA para estudiar | Evaluo',
    description:
      'Organizá las ideas principales de tu PDF y continuá con mapas mentales, glosario, flashcards y ejercicios sobre el mismo material.',
    url: toAbsoluteUrl(path),
  },
};

export default function ResumirPdfConIaPage() {
  return <ResumirPdfExperience />;
}
