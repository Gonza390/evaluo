import type { Metadata } from 'next';
import { SeoComparisonLanding } from '@/components/marketing/seo-comparison-landings';
import { hreflangAlternates } from '@/lib/seo/hreflang-clusters';

const alternates = hreflangAlternates('compare-quizlet', 'en');

export const metadata: Metadata = {
  title: 'Free Quizlet Alternative: AI Flashcards and Tests from PDF',
  description:
    "Looking for a Quizlet alternative? Evaluo turns your PDF notes into AI flashcards and practice questions. Compare features and try it free, no sign-up to choose a file.",
  alternates,
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    title: 'Free Quizlet Alternative: AI Flashcards and Tests from PDF | Evaluo',
    description: 'See how Quizlet and Evaluo differ for studying your notes and preparing exams.',
    url: alternates.canonical,
  },
};

export default function Page() {
  return <SeoComparisonLanding comparison="quizlet" locale="en" />;
}
