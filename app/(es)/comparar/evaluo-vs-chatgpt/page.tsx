import type { Metadata } from 'next';
import { SeoComparisonLanding } from '@/components/marketing/seo-comparison-landings';
import { hreflangAlternates } from '@/lib/seo/hreflang-clusters';
import { toAbsoluteUrl } from '@/lib/site';

const path = '/comparar/evaluo-vs-chatgpt';

export const metadata: Metadata = {
  title: 'Alternativa a ChatGPT para estudiar tus PDF, gratis',
  description:
    "¿Usás ChatGPT para estudiar? Compará su Modo de estudio con la práctica por tema de Evaluo y probalo gratis: elegís tu PDF sin registrarte.",
  alternates: hreflangAlternates('compare-chatgpt', 'es'),
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    title: 'Alternativa a ChatGPT para estudiar tus PDF, gratis | Evaluo',
    description: 'Una comparación equilibrada entre el Modo de estudio de ChatGPT y la práctica por temas de Evaluo.',
    url: toAbsoluteUrl(path),
  },
};

export default function EvaluoVsChatgptPage() {
  return <SeoComparisonLanding comparison="chatgpt" />;
}
