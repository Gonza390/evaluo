import type { Metadata } from 'next';
import { SeoComparisonLanding } from '@/components/marketing/seo-comparison-landings';
import { toAbsoluteUrl } from '@/lib/site';

const path = '/comparar/evaluo-vs-notebooklm';

export const metadata: Metadata = {
  title: "Alternativa a NotebookLM para estudiar PDF",
  description: "¿Buscás una alternativa a NotebookLM para estudiar? Compará fuentes, flashcards, cuestionarios y práctica por tema con PDFs en Evaluo.",
  alternates: { canonical: toAbsoluteUrl(path) },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    title: "Alternativa a NotebookLM para estudiar PDF | Evaluo",
    description: 'Comparación actualizada: ambos permiten practicar; elegí según tu necesidad de explorar fuentes o estudiar tema por tema.',
    url: toAbsoluteUrl(path),
  },
};

export default function EvaluoVsNotebooklmPage() {
  return <SeoComparisonLanding comparison="notebooklm" />;
}
