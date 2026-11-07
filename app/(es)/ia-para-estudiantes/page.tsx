import type { Metadata } from 'next';
import { hreflangAlternates } from '@/lib/seo/hreflang-clusters';
import { IaParaEstudiantesExperience } from '@/components/marketing/seo-study-experiences-v2';
import { toAbsoluteUrl } from '@/lib/site';

const path = '/ia-para-estudiantes';

export const metadata: Metadata = {
  title: 'IA para estudiantes gratis: resumí PDFs y prepará exámenes',
  description:
    'IA para estudiantes, gratis: subí tu PDF sin registrarte para elegirlo y obtené resumen por temas, flashcards y preguntas de examen basadas en tus apuntes.',
  alternates: hreflangAlternates('ai-for-students', 'es-AR'),
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    title: 'IA para estudiantes gratis: resumí PDFs y prepará exámenes | Evaluo',
    description:
      'Usá IA sobre tus propios apuntes y PDFs para entender, repasar, practicar preguntas y preparar parciales sin perder la fuente original.',
    url: toAbsoluteUrl(path),
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IA para estudiantes gratis: resumí PDFs y prepará exámenes | Evaluo',
    description:
      'Estudiá tus apuntes y PDFs con IA, creá flashcards y practicá preguntas para preparar parciales con tu propio material.',
    images: ['/opengraph-image.png'],
  },
};

export default function IaParaEstudiantesPage() {
  return <IaParaEstudiantesExperience />;
}