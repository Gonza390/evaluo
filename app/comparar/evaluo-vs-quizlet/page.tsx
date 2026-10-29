import type { Metadata } from 'next';
import { SeoComparisonLanding } from '@/components/marketing/seo-comparison-landings';
import { toAbsoluteUrl } from '@/lib/site';

const path = '/comparar/evaluo-vs-quizlet';

export const metadata: Metadata = {
  title: "Alternativa a Quizlet: flashcards y exámenes desde PDF",
  description: "¿Buscás una alternativa a Quizlet? Compará tarjetas, tests y funciones con IA para preparar parciales desde tus apuntes PDF en Evaluo.",
  alternates: { canonical: toAbsoluteUrl(path) },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    title: 'Alternativa a Quizlet: flashcards y exámenes desde PDF | Evaluo',
    description: 'Descubrí las diferencias entre Quizlet y Evaluo para estudiar con tus apuntes y preparar exámenes.',
    url: toAbsoluteUrl(path),
  },
};

export default function EvaluoVsQuizletPage() {
  return <SeoComparisonLanding comparison="quizlet" />;
}
