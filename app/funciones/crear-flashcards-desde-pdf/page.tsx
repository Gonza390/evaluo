import type { Metadata } from 'next';
import { FlashcardsPdfExperience } from '@/components/marketing/seo-study-experiences-v2';
import { toAbsoluteUrl } from '@/lib/site';

const path = '/funciones/crear-flashcards-desde-pdf';

export const metadata: Metadata = {
  title: "Crear flashcards a partir de PDF con IA",
  description: "Creá flashcards a partir de un PDF con IA: convertí tus apuntes en tarjetas de repaso, comprobá conceptos y continuá practicando por tema en Evaluo.",
  alternates: { canonical: toAbsoluteUrl(path) },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    title: "Crear flashcards a partir de PDF con IA | Evaluo",
    description:
      'Convertí tu PDF en tarjetas de preguntas y respuestas con IA para repasar conceptos y volver al material que estás estudiando.',
    url: toAbsoluteUrl(path),
  },
};

export default function CrearFlashcardsDesdePdfPage() {
  return <FlashcardsPdfExperience />;
}