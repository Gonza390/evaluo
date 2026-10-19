import type { Metadata } from 'next';
import { FlashcardsPdfExperience } from '@/components/marketing/seo-study-experiences-v2';
import { toAbsoluteUrl } from '@/lib/site';

const path = '/funciones/crear-flashcards-desde-pdf';

export const metadata: Metadata = {
  title: 'Crear flashcards con IA desde un PDF y apuntes',
  description:
    'Creá flashcards con IA desde un PDF o tus apuntes. Convertí conceptos del material en preguntas y respuestas para repasar y seguir practicando en Evaluo.',
  alternates: { canonical: toAbsoluteUrl(path) },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    title: 'Crear flashcards con IA desde un PDF y apuntes | Evaluo',
    description:
      'Transformá conceptos de tu material en tarjetas de preguntas y respuestas y mantené el repaso conectado con la fuente original.',
    url: toAbsoluteUrl(path),
  },
};

export default function CrearFlashcardsDesdePdfPage() {
  return <FlashcardsPdfExperience />;
}