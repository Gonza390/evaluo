import type { Metadata } from 'next';
import { BestAiStudyPage } from '@/components/marketing/best-ai-study-page';
import { hreflangAlternates } from '@/lib/seo/hreflang-clusters';
import { DEFAULT_OG_IMAGES } from '@/lib/seo';

const alternates = hreflangAlternates('best-ai-study', 'en');

export const metadata: Metadata = {
  title: 'Best AI for Studying: Study Tools and Apps (2026)',
  description:
    'We compared 11 AI study tools: NotebookLM, ChatGPT, Gemini, Claude, Perplexity, Quizlet, Anki, Photomath and more. What each is best for and which are free.',
  alternates,
  robots: { index: true, follow: true },
  openGraph: { images: DEFAULT_OG_IMAGES,
    type: 'article',
    locale: 'en_US',
    title: 'Best AI Study Tools and Apps in 2026 | Evaluo',
    description: 'Which AI to use to research, to get explanations, to memorize and to prep for an exam from your PDF.',
    url: alternates.canonical,
  },
};

export default function Page() {
  return <BestAiStudyPage locale="en" />;
}
