import type { Metadata } from 'next';
import { SeoComparisonLanding } from '@/components/marketing/seo-comparison-landings';
import { hreflangAlternates } from '@/lib/seo/hreflang-clusters';

const alternates = hreflangAlternates('compare-chatgpt', 'en');

export const metadata: Metadata = {
  title: 'ChatGPT Alternative for Studying: Evaluo vs ChatGPT for Exams',
  description: "Using ChatGPT to study? Compare Study mode with Evaluo's topic-by-topic practice, results and review built from your own PDF notes.",
  alternates,
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    title: 'ChatGPT Alternative for Studying: Evaluo vs ChatGPT for Exams | Evaluo',
    description: 'Compare ChatGPT and Evaluo for studying a PDF and preparing for exams.',
    url: alternates.canonical,
  },
};

export default function Page() {
  return <SeoComparisonLanding comparison="chatgpt" locale="en" />;
}
