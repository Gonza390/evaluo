import type { Metadata } from 'next';
import { hreflangAlternates } from '@/lib/seo/hreflang-clusters';
import { FlashcardsPdfExperience } from '@/components/marketing/seo-study-experiences-v2';
import { toAbsoluteUrl } from '@/lib/site';
import { DEFAULT_OG_IMAGES } from '@/lib/seo';

const path = '/funciones/crear-flashcards-desde-pdf';

export const metadata: Metadata = {
  title: 'Crear flashcards a partir de un PDF con IA, gratis',
  description:
    'Creá flashcards a partir de un PDF con IA, gratis: elegís el archivo sin registrarte y convertís tus apuntes en tarjetas de repaso por tema en minutos.',
  alternates: hreflangAlternates('pdf-to-flashcards', 'es-AR'),
  robots: { index: true, follow: true },
  openGraph: { images: DEFAULT_OG_IMAGES,
    type: 'website',
    title: 'Crear flashcards a partir de un PDF con IA, gratis | Evaluo',
    description:
      'Convertí tu PDF en tarjetas de preguntas y respuestas con IA para repasar conceptos y volver al material que estás estudiando.',
    url: toAbsoluteUrl(path),
  },
};

export default function CrearFlashcardsDesdePdfPage() {
  return <FlashcardsPdfExperience />;
}