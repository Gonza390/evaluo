import type { Metadata } from 'next';
import { IaParaEstudiantesExperience } from '@/components/marketing/seo-study-experiences-v2';
import { toAbsoluteUrl } from '@/lib/site';

const path = '/ia-para-estudiantes';

export const metadata: Metadata = {
  title: 'IA para estudiar: apuntes, PDFs, flashcards y práctica',
  description:
    'Usá IA para estudiar tus apuntes y PDFs: organizá conceptos, creá flashcards y practicá para exámenes manteniendo el mismo material como fuente.',
  alternates: { canonical: toAbsoluteUrl(path) },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    title: 'IA para estudiar: apuntes, PDFs, flashcards y práctica | Evaluo',
    description:
      'Estudiá con IA sobre tus propios apuntes y PDFs: entendé el tema, repasá con flashcards y practicá antes del examen sin perder la fuente original.',
    url: toAbsoluteUrl(path),
  },
};

export default function IaParaEstudiantesPage() {
  return <IaParaEstudiantesExperience />;
}