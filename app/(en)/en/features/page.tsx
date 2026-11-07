import type { Metadata } from 'next';
import { EnglishHubPage } from '@/components/marketing/english-hub-page';
import { ENGLISH_HUBS } from '@/lib/english-seo-hubs';
import { hreflangAlternates } from '@/lib/seo/hreflang-clusters';

const alternates = hreflangAlternates('features-hub', 'en');

export const metadata: Metadata = {
  title: 'Evaluo Features: Study Your PDF Notes with AI',
  description: 'Summaries, mind maps, flashcards, topic practice and mock exams from your own PDF or Word notes. Find the right AI study tool for each goal.',
  alternates,
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    title: 'Evaluo Features: Study Your PDF Notes with AI | Evaluo',
    description: 'One set of notes, several ways to study it: summaries, mind maps, flashcards, practice questions and mock exams.',
    url: alternates.canonical,
  },
};

export default function Page() {
  return <EnglishHubPage hub={ENGLISH_HUBS.features} />;
}
