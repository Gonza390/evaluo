import type { Metadata } from 'next';
import { IaParaEstudiantesExperience } from '@/components/marketing/seo-study-experiences';
import { toAbsoluteUrl } from '@/lib/site';

const path = '/ia-para-estudiantes';

export const metadata: Metadata = {
  title: 'IA para estudiantes: estudiá apuntes y PDFs',
  description:
    'Usá IA para transformar tus apuntes y PDFs en resúmenes, glosarios, flashcards y ejercicios. Estudiá y practicá el mismo material en Evaluo.',
  alternates: { canonical: toAbsoluteUrl(path) },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    title: 'IA para estudiantes: estudiá tus apuntes con Evaluo',
    description:
      'Transformá tus propios materiales en resúmenes, glosarios, flashcards y ejercicios para estudiar y practicar.',
    url: toAbsoluteUrl(path),
  },
};

export default function IaParaEstudiantesPage() {
  return <IaParaEstudiantesExperience />;
}
