import type { Metadata } from 'next';
import { BestAiStudyPage } from '@/components/marketing/best-ai-study-page';
import { hreflangAlternates } from '@/lib/seo/hreflang-clusters';
import { DEFAULT_OG_IMAGES } from '@/lib/seo';

const alternates = hreflangAlternates('best-ai-study', 'es');

export const metadata: Metadata = {
  title: 'Las mejores IA para estudiar en 2026: comparación honesta',
  description:
    'Comparamos 11 IA para estudiar: NotebookLM, ChatGPT, Gemini, Claude, Perplexity, Quizlet, Anki, Photomath y más. Para qué sirve cada una y cuáles son gratis.',
  alternates,
  robots: { index: true, follow: true },
  openGraph: { images: DEFAULT_OG_IMAGES,
    type: 'article',
    locale: 'es_419',
    title: 'Las mejores IA para estudiar en 2026 | Evaluo',
    description: 'Qué IA conviene para investigar, para que te expliquen, para memorizar y para preparar un examen desde tu PDF.',
    url: alternates.canonical,
  },
};

export default function Page() {
  return <BestAiStudyPage locale="es" />;
}
