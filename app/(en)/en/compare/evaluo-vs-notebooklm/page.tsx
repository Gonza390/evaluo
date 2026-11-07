import type { Metadata } from 'next';
import { SeoComparisonLanding } from '@/components/marketing/seo-comparison-landings';
import { hreflangAlternates } from '@/lib/seo/hreflang-clusters';

const alternates = hreflangAlternates('compare-notebooklm', 'en');

export const metadata: Metadata = {
  title: 'NotebookLM Alternative for Studying PDFs: Evaluo vs NotebookLM',
  description: 'Looking for a NotebookLM alternative to study your PDFs? Compare sources, quizzes, flashcards and topic-by-topic exam practice in Evaluo and NotebookLM.',
  alternates,
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    title: 'NotebookLM Alternative for Studying PDFs: Evaluo vs NotebookLM | Evaluo',
    description: 'Compare NotebookLM and Evaluo for studying your own notes and preparing for exams.',
    url: alternates.canonical,
  },
};

export default function Page() {
  return <SeoComparisonLanding comparison="notebooklm" locale="en" />;
}
