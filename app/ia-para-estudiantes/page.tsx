import type { Metadata } from 'next';
import { IaParaEstudiantesExperience } from '@/components/marketing/seo-study-experiences-v2';
import { toAbsoluteUrl } from '@/lib/site';

const path = '/ia-para-estudiantes';

export const metadata: Metadata = {
  title: "IA para estudiantes: estudiá apuntes y practicá",
  description: "IA para estudiantes universitarios: estudiá apuntes, resumí PDF y prepará parciales con preguntas, flashcards y práctica por tema en Evaluo.",
  alternates: { canonical: toAbsoluteUrl(path) },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    title: 'IA para estudiantes: estudiar PDFs y preparar exámenes | Evaluo',
    description:
      'Usá IA sobre tus propios apuntes y PDFs para entender, repasar, practicar preguntas y preparar parciales sin perder la fuente original.',
    url: toAbsoluteUrl(path),
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IA para estudiantes: estudiar PDFs y preparar exámenes | Evaluo',
    description:
      'Estudiá tus apuntes y PDFs con IA, creá flashcards y practicá preguntas para preparar parciales con tu propio material.',
    images: ['/opengraph-image.png'],
  },
};

export default function IaParaEstudiantesPage() {
  return <IaParaEstudiantesExperience />;
}