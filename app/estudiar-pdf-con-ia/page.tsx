import type { Metadata } from 'next';
import { EstudiarPdfExperience } from '@/components/marketing/seo-study-experiences-v2';
import { toAbsoluteUrl } from '@/lib/site';

const path = '/estudiar-pdf-con-ia';

export const metadata: Metadata = {
  title: 'Estudiar PDF con IA: resumen, flashcards y ejercicios',
  description:
    'Estudiá un PDF con IA: elegí tus apuntes, creá resumen, mapa mental y flashcards y practicá ejercicios sobre el mismo documento en Evaluo.',
  alternates: { canonical: toAbsoluteUrl(path) },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    title: 'Estudiar PDF con IA: resumen, flashcards y ejercicios | Evaluo',
    description:
      'Usá un mismo PDF como fuente para resumir, organizar conceptos, repasar con flashcards y practicar sin perder el contexto.',
    url: toAbsoluteUrl(path),
  },
};

export default function EstudiarPdfConIaPage() {
  return <EstudiarPdfExperience />;
}