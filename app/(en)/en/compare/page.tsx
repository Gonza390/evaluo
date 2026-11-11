import type { Metadata } from 'next';
import { EnglishHubPage } from '@/components/marketing/english-hub-page';
import { ENGLISH_HUBS } from '@/lib/english-seo-hubs';
import { hreflangAlternates } from '@/lib/seo/hreflang-clusters';

const alternates = hreflangAlternates('compare-hub', 'en');

export const metadata: Metadata = {
  title: 'AI Study Tools Compared: ChatGPT, NotebookLM, Quizlet',
  description: 'Compare ChatGPT, NotebookLM, Quizlet and Evaluo for studying: which fits each goal, where each is stronger, and their limits, with sources.',
  alternates,
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    title: 'AI Study Tools Compared: ChatGPT, NotebookLM, Quizlet | Evaluo',
    description: 'Which study tool fits the way you study? Balanced comparisons based on public documentation.',
    url: alternates.canonical,
  },
};

export default function Page() {
  return <EnglishHubPage hub={ENGLISH_HUBS.compare} />;
}
