import type { Metadata } from 'next';
import { SeoComparisonLanding } from '@/components/marketing/seo-comparison-landings';
import { hreflangAlternates } from '@/lib/seo/hreflang-clusters';

const alternates = hreflangAlternates('compare-notebooklm', 'en');

export const metadata: Metadata = {
  title: 'Free NotebookLM Alternative for Studying Your PDFs',
  description:
    "Looking for a NotebookLM alternative for studying? Compare quizzes, flashcards and practice by topic, then try Evaluo free with your notes.",
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
