import type { Metadata } from 'next';
import { EstudiarPdfExperience } from '@/components/marketing/seo-study-experiences-v2';
import { toAbsoluteUrl } from '@/lib/site';
import { STUDY_HREFLANG } from '@/lib/international-study-landings';

const path = '/estudiar-pdf-con-ia';

export const metadata: Metadata = {
  title: "Estudiar PDF con IA: resumen, preguntas y práctica",
  description: "Estudiá un PDF con IA usando tus apuntes: resumen por temas, flashcards, preguntas y corrección de errores sin perder el documento original.",
  alternates: { canonical: toAbsoluteUrl(path), languages: STUDY_HREFLANG },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    title: "Estudiar PDF con IA: resumen, preguntas y práctica | Evaluo",
    description:
      'Usá un mismo PDF como fuente para resumir, organizar conceptos, repasar con flashcards y practicar sin perder el contexto.',
    url: toAbsoluteUrl(path),
  },
};

export default function EstudiarPdfConIaPage() {
  return <EstudiarPdfExperience />;
}