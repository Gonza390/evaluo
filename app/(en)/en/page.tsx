import type { Metadata } from 'next';
import { hreflangAlternates } from '@/lib/seo/hreflang-clusters';
import { FooterHome } from '@/components/footer-home';
import { HomeRedesign } from '@/components/marketing/home-redesign';
import { MarketingAnalyticsSlot } from '@/components/MarketingAnalyticsSlot';
import { HomeFunnelTracker } from '@/components/marketing/home-funnel-tracker';
import { HOME_REDESIGN_FAQS_EN } from '@/components/marketing/home-redesign-faqs';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildFaqJsonLd, buildOrganizationJsonLd, buildSoftwareApplicationJsonLd, buildWebsiteJsonLd } from '@/lib/seo';
import '../../(es)/home-redesign.css';

export const metadata: Metadata = {
  // Keyword principal del mercado EN: "AI study assistant".
  title: { absolute: 'AI Study Assistant: Study Your Notes and Prep for Exams | Evaluo' },
  description:
    'Evaluo is an AI study assistant: upload your PDF or Word notes and get topic summaries, flashcards and practice questions to prepare for exams. Free to start.',
  alternates: hreflangAlternates('home', 'en'),
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Evaluo',
    url: '/en',
    title: 'Know how ready you are for your exam | Evaluo',
    description: 'Study with your own notes, practice topic by topic and see what you need to review.',
    images: [{ url: '/evaluo-whatsapp-progreso.png', width: 1200, height: 630, alt: 'Evaluo — prepare for exams with your own notes' }],
  },
};

const signupHref = '/en/login?mode=signup&next=%2Fdashboard%3FopenUpload%3D1';

export default function EnglishHome() {
  return (
    <div lang="en" className="home-redesign-root">
      <a href="#contenido" className="reference-skip-link">Skip to content</a>
      <MarketingAnalyticsSlot />
      <HomeFunnelTracker />
      <JsonLd data={[buildOrganizationJsonLd(), buildWebsiteJsonLd(), buildSoftwareApplicationJsonLd(), buildFaqJsonLd(HOME_REDESIGN_FAQS_EN)]} />
      <main id="contenido">
        <HomeRedesign primaryHref={signupHref} locale="en" />
      </main>
      <FooterHome locale="en" />
    </div>
  );
}
