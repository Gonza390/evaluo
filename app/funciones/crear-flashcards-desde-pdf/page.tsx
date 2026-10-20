import type { Metadata } from 'next';
import { FlashcardsPdfExperience } from '@/components/marketing/seo-study-experiences-v2';
import { toAbsoluteUrl } from '@/lib/site';

const path = '/funciones/crear-flashcards-desde-pdf';

export const metadata: Metadata = {
  title: 'Flashcards desde PDF con IA: creá tarjetas',
  description:
    'Creá flashcards desde un PDF con IA. Convertí tus apuntes en tarjetas de preguntas y respuestas, repasá antes del parcial y volvé al material original.',
  alternates: { canonical: toAbsoluteUrl(path) },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    title: 'Flashcards desde PDF con IA: creá tarjetas | Evaluo',
    description:
      'Convertí tu PDF en tarjetas de preguntas y respuestas con IA para repasar conceptos y volver al material que estás estudiando.',
    url: toAbsoluteUrl(path),
  },
};

export default function CrearFlashcardsDesdePdfPage() {
  return <FlashcardsPdfExperience />;
}