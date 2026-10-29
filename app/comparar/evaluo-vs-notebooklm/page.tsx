import type { Metadata } from 'next';
import { SeoComparisonLanding } from '@/components/marketing/seo-comparison-landings';
import { toAbsoluteUrl } from '@/lib/site';

const path = '/comparar/evaluo-vs-notebooklm';

export const metadata: Metadata = {
  title: 'Evaluo vs. NotebookLM: cuál elegir para estudiar PDF',
  description: 'Compará Evaluo y NotebookLM/Gemini Notebook: fuentes, resúmenes, audio, flashcards, quizzes, práctica por tema, seguimiento y precios.',
  alternates: { canonical: toAbsoluteUrl(path) },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    title: 'Evaluo vs. NotebookLM: estudio y práctica con PDFs',
    description: 'Comparación actualizada: ambos permiten practicar; elegí según tu necesidad de explorar fuentes o estudiar tema por tema.',
    url: toAbsoluteUrl(path),
  },
};

export default function EvaluoVsNotebooklmPage() {
  return <SeoComparisonLanding comparison="notebooklm" />;
}
