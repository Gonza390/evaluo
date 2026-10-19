import type { Metadata } from 'next';
import { EstudiarPdfExperience } from '@/components/marketing/seo-study-experiences-v2';
import { toAbsoluteUrl } from '@/lib/site';

const path = '/estudiar-pdf-con-ia';

export const metadata: Metadata = {
  title: 'Estudiar un PDF con IA: resumen, flashcards y práctica',
  description:
    'Estudiá un PDF con IA en Evaluo: convertí el mismo material en resumen, glosario, mapa mental, flashcards y ejercicios para entender y practicar.',
  alternates: { canonical: toAbsoluteUrl(path) },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    title: 'Estudiar un PDF con IA: resumen, flashcards y práctica | Evaluo',
    description:
      'Usá un mismo PDF como fuente para resumir, organizar conceptos, repasar con flashcards y practicar sin perder el contexto.',
    url: toAbsoluteUrl(path),
  },
};

export default function EstudiarPdfConIaPage() {
  return <EstudiarPdfExperience />;
}