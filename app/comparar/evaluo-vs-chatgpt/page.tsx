import type { Metadata } from 'next';
import { SeoComparisonLanding } from '@/components/marketing/seo-comparison-landings';
import { toAbsoluteUrl } from '@/lib/site';

const path = '/comparar/evaluo-vs-chatgpt';

export const metadata: Metadata = {
  title: "Alternativa a ChatGPT para estudiar PDF y practicar",
  description: "¿Buscás una alternativa a ChatGPT para estudiar PDFs? Compará el Modo de estudio con preguntas por tema, resultados y refuerzo en Evaluo.",
  alternates: { canonical: toAbsoluteUrl(path) },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    title: 'Evaluo vs. ChatGPT: estudiar y practicar desde PDF',
    description: 'Una comparación equilibrada entre el Modo de estudio de ChatGPT y la práctica por temas de Evaluo.',
    url: toAbsoluteUrl(path),
  },
};

export default function EvaluoVsChatgptPage() {
  return <SeoComparisonLanding comparison="chatgpt" />;
}
