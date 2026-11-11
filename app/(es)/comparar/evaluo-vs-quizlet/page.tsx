import type { Metadata } from 'next';
import { SeoComparisonLanding } from '@/components/marketing/seo-comparison-landings';
import { hreflangAlternates } from '@/lib/seo/hreflang-clusters';
import { toAbsoluteUrl } from '@/lib/site';

const path = '/comparar/evaluo-vs-quizlet';

export const metadata: Metadata = {
  title: 'Alternativa a Quizlet gratis: flashcards desde tu PDF',
  description:
    "¿Buscás una alternativa a Quizlet? Evaluo crea flashcards y preguntas desde tus apuntes PDF con IA. Probalo gratis: elegís el archivo sin registrarte.",
  alternates: hreflangAlternates('compare-quizlet', 'es'),
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
