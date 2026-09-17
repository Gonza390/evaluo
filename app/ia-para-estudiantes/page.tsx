import type { Metadata } from 'next';
import { IaParaEstudiantesExperience } from '@/components/marketing/seo-study-experiences-v2';
import { toAbsoluteUrl } from '@/lib/site';

const path = '/ia-para-estudiantes';

export const metadata: Metadata = {
  title: 'IA para estudiantes: estudiá apuntes y PDFs con IA',
  description:
    'Estudiá tus apuntes y PDFs con IA en Evaluo: resumen, glosario, mapas mentales, flashcards y ejercicios conectados al mismo material.',
  alternates: { canonical: toAbsoluteUrl(path) },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    title: 'IA para estudiantes: estudiá tus apuntes y PDFs con IA | Evaluo',
    description:
      'Transformá tus propios materiales en resumen, conceptos, mapas mentales, flashcards y ejercicios para entender, recordar y practicar.',
    url: toAbsoluteUrl(path),
  },
};

export default function IaParaEstudiantesPage() {
  return <IaParaEstudiantesExperience />;
}