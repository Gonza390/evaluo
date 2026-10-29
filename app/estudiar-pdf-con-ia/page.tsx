import type { Metadata } from 'next';
import { EstudiarPdfExperience } from '@/components/marketing/seo-study-experiences-v2';
import { toAbsoluteUrl } from '@/lib/site';
import { STUDY_HREFLANG } from '@/lib/international-study-landings';

const path = '/estudiar-pdf-con-ia';

export const metadata: Metadata = {
  title: "Estudiar PDF con IA: resumen y práctica por tema",
  description: "Estudiá un PDF con IA desde tus apuntes: leé un resumen, repasá con flashcards y practicá preguntas por tema sin perder el documento original.", creá resumen, mapa mental y flashcards y practicá ejercicios sobre el mismo documento en Evaluo.',
  alternates: { canonical: toAbsoluteUrl(path), languages: STUDY_HREFLANG },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    title: 'Estudiar PDF con IA: resumen, flashcards y ejercicios | Evaluo',
    description:
      'Usá un mismo PDF como fuente para resumir, organizar conceptos, repasar con flashcards y practicar sin perder el contexto.',
    url: toAbsoluteUrl(path),
  },
};

export default function EstudiarPdfConIaPage() {
  return <EstudiarPdfExperience />;
}