import type { Metadata } from 'next';
import { SeoComparisonLanding } from '@/components/marketing/seo-comparison-landings';
import { hreflangAlternates } from '@/lib/seo/hreflang-clusters';

const alternates = hreflangAlternates('compare-notebooklm', 'en');

export const metadata: Metadata = {
  title: 'Free NotebookLM Alternative for Studying Your PDFs',
  description:
    "Looking for a NotebookLM alternative to study your PDFs? Compare quizzes, flashcards and topic-by-topic practice, then try Evaluo free. No sign-up to choose a file.",
  alternates,
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    title: 'Free NotebookLM Alternative for Studying Your PDFs | Evaluo',
    description: 'Compare NotebookLM and Evaluo for studying your own notes and preparing for exams.',
    url: alternates.canonical,
  },
};

export default function Page() {
  return <SeoComparisonLanding comparison="notebooklm" locale="en" />;
}
