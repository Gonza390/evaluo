import type { Metadata } from 'next';
import { SeoComparisonLanding } from '@/components/marketing/seo-comparison-landings';
import { hreflangAlternates } from '@/lib/seo/hreflang-clusters';
import { DEFAULT_OG_IMAGES } from '@/lib/seo';

const alternates = hreflangAlternates('compare-chatgpt', 'en');

export const metadata: Metadata = {
  title: 'Free ChatGPT Alternative for Studying Your PDFs',
  description:
    "Using ChatGPT to study? Compare Study mode with Evaluo's topic-by-topic practice built from your own PDF notes, and try it free. No sign-up to choose a file.",
  alternates,
  robots: { index: true, follow: true },
  openGraph: { images: DEFAULT_OG_IMAGES,
    type: 'website',
    locale: 'en_US',
    title: 'Free ChatGPT Alternative for Studying Your PDFs | Evaluo',
    description: 'Compare ChatGPT and Evaluo for studying a PDF and preparing for exams.',
    url: alternates.canonical,
  },
};

export default function Page() {
  return <SeoComparisonLanding comparison="chatgpt" locale="en" />;
}
