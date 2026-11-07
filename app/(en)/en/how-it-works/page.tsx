import type { Metadata } from 'next';
import { HowItWorksPage } from '@/components/marketing/how-it-works-page';
import { hreflangAlternates } from '@/lib/seo/hreflang-clusters';

const alternates = hreflangAlternates('how-it-works', 'en');

export const metadata: Metadata = {
  title: 'How Evaluo Works: AI Study Assistant for Your Notes',
  description:
    'Upload a PDF or Word file and Evaluo organizes it by topic, creates practice questions, shows your results and builds a plan until exam day. Plans and limits.',
  alternates,
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    title: 'How Evaluo Works: AI Study Assistant for Your Notes | Evaluo',
    description: 'From your notes to an exam-ready plan, in five steps.',
    url: alternates.canonical,
  },
};

export default function Page() {
  return <HowItWorksPage locale="en" />;
}
