import type { Metadata } from 'next';
import { EstudiarPdfExperience } from '@/components/marketing/seo-study-experiences';
import { toAbsoluteUrl } from '@/lib/site';

const path = '/estudiar-pdf-con-ia';

export const metadata: Metadata = {
  title: 'Estudiar un PDF con IA: resumen y flashcards',
  description:
    'Subí un PDF y convertí el mismo material en resumen, mapa mental, glosario, flashcards y ejercicios para estudiar y practicar con IA en Evaluo.',
  alternates: { canonical: toAbsoluteUrl(path) },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    title: 'Estudiar un PDF con IA | Evaluo',
    description:
      'Transformá tu PDF en resumen, mapa mental, glosario, flashcards y ejercicios para pasar de leer a practicar.',
    url: toAbsoluteUrl(path),
  },
};

export default function EstudiarPdfConIaPage() {
  return <EstudiarPdfExperience />;
}
