import type { Metadata } from 'next';
import { SeoComparisonLanding } from '@/components/marketing/seo-comparison-landings';
import { hreflangAlternates } from '@/lib/seo/hreflang-clusters';
import { toAbsoluteUrl } from '@/lib/site';

const path = '/comparar/evaluo-vs-chatgpt';

export const metadata: Metadata = {
  title: "Alternativa a ChatGPT para estudiar PDF y practicar",
  description: "¿Buscás una alternativa a ChatGPT para estudiar PDFs? Compará el Modo de estudio con preguntas por tema, resultados y refuerzo en Evaluo.",
  alternates: hreflangAlternates('compare-chatgpt', 'es'),
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    title: "Alternativa a ChatGPT para estudiar PDF y practicar | Evaluo",
    description: 'Una comparación equilibrada entre el Modo de estudio de ChatGPT y la práctica por temas de Evaluo.',
    url: toAbsoluteUrl(path),
  },
};

export default function EvaluoVsChatgptPage() {
  return <SeoComparisonLanding comparison="chatgpt" />;
}
