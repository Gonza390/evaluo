import type { Metadata } from 'next';
import { SeoComparisonLanding } from '@/components/marketing/seo-comparison-landings';
import { toAbsoluteUrl } from '@/lib/site';

const path = '/comparar/evaluo-vs-quizlet';

export const metadata: Metadata = {
  title: 'Evaluo vs. Quizlet: flashcards, tests y estudio con IA',
  description: 'Compará Evaluo y Quizlet: flashcards, tests, resúmenes de PDF, IA para estudiar, práctica por tema, seguimiento y precios.',
  alternates: { canonical: toAbsoluteUrl(path) },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    title: 'Evaluo vs. Quizlet: flashcards y práctica desde PDF',
    description: 'Descubrí las diferencias entre Quizlet y Evaluo para estudiar con tus apuntes y preparar exámenes.',
    url: toAbsoluteUrl(path),
  },
};

export default function EvaluoVsQuizletPage() {
  return <SeoComparisonLanding comparison="quizlet" />;
}
