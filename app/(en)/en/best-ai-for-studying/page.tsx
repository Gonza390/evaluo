import type { Metadata } from 'next';
import { BestAiStudyPage } from '@/components/marketing/best-ai-study-page';
import { hreflangAlternates } from '@/lib/seo/hreflang-clusters';

const alternates = hreflangAlternates('best-ai-study', 'en');

export const metadata: Metadata = {
  title: 'Best AI for Studying in 2026: An Honest Comparison',
  description:
    'Gemini Notebook (NotebookLM), ChatGPT, Gemini, Quizlet, Knowt, StudyFetch, Anki and Evaluo: what each AI study tool is best for, its limits and which are free.',
  alternates,
  robots: { index: true, follow: true },
  openGraph: {
    type: 'article',
    locale: 'en_US',
    title: 'Best AI for Studying in 2026 | Evaluo',
    description: 'Which AI to use to research, to get explanations, to memorize and to prep for an exam from your PDF.',
    url: alternates.canonical,
  },
};

export default function Page() {
  return <BestAiStudyPage locale="en" />;
}
