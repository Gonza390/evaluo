import type { Metadata } from 'next';
import { FlashcardsPdfExperience } from '@/components/marketing/seo-study-experiences';
import { toAbsoluteUrl } from '@/lib/site';

const path = '/funciones/crear-flashcards-desde-pdf';

export const metadata: Metadata = {
  title: 'Crear flashcards desde un PDF con IA',
  description:
    'Convertí conceptos de tu PDF en flashcards para estudiar y repasar con IA. Después seguí con mapas mentales, glosario y ejercicios en Evaluo.',
  alternates: { canonical: toAbsoluteUrl(path) },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    title: 'Crear flashcards desde un PDF con IA | Evaluo',
    description:
      'Transformá conceptos de tus apuntes en tarjetas y seguí estudiando el mismo material con mapas mentales, glosario y ejercicios.',
    url: toAbsoluteUrl(path),
  },
};

export default function CrearFlashcardsDesdePdfPage() {
  return <FlashcardsPdfExperience />;
}
