import type { Metadata } from 'next';
import { ResumirPdfExperience } from '@/components/marketing/seo-study-experiences-v2';
import { toAbsoluteUrl } from '@/lib/site';

const path = '/funciones/resumir-pdf-con-ia';

export const metadata: Metadata = {
  title: 'Resumir PDF con IA para estudiar y practicar',
  description:
    'Resumí un PDF con IA para estudiar: ordená ideas y conceptos y seguí con glosario, flashcards y ejercicios sobre el mismo material en Evaluo.',
  alternates: { canonical: toAbsoluteUrl(path) },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    title: 'Resumir PDF con IA para estudiar y practicar | Evaluo',
    description:
      'Convertí un PDF largo en una estructura de estudio y seguí trabajando los mismos conceptos con flashcards y ejercicios.',
    url: toAbsoluteUrl(path),
  },
};

export default function ResumirPdfConIaPage() {
  return <ResumirPdfExperience />;
}