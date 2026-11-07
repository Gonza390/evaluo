import type { Metadata } from 'next';
import { SeoComparisonLanding } from '@/components/marketing/seo-comparison-landings';
import { hreflangAlternates } from '@/lib/seo/hreflang-clusters';

const alternates = hreflangAlternates('compare-quizlet', 'en');

export const metadata: Metadata = {
  title: 'Quizlet Alternative: AI Flashcards and Practice Tests from PDF',
  description: 'Looking for a Quizlet alternative? Compare flashcards, practice tests and AI study tools for preparing exams from your own PDF notes.',
  alternates,
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    title: 'Quizlet Alternative: AI Flashcards and Practice Tests from PDF | Evaluo',
    description: 'See how Quizlet and Evaluo differ for studying your notes and preparing exams.',
    url: alternates.canonical,
  },
};

export default function Page() {
  return <SeoComparisonLanding comparison="quizlet" locale="en" />;
}
