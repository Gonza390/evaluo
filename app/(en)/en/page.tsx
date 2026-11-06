import type { Metadata } from 'next';
import { FooterHome } from '@/components/footer-home';
import { HomeRedesign } from '@/components/marketing/home-redesign';
import { MarketingAnalyticsSlot } from '@/components/MarketingAnalyticsSlot';
import { HomeFunnelTracker } from '@/components/marketing/home-funnel-tracker';
import { HOME_REDESIGN_FAQS_EN } from '@/components/marketing/home-redesign-faqs';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildFaqJsonLd, buildOrganizationJsonLd, buildWebsiteJsonLd } from '@/lib/seo';
import '../../(es)/home-redesign.css';

export const metadata: Metadata = {
  title: { absolute: 'Evaluo | Study with your PDF and prepare for exams using AI' },
  description:
    'Upload your PDF or Word notes and study with AI: topic summaries, flashcards, practice questions and progress tracking to prepare for your exams.',
  alternates: { canonical: '/en', languages: { en: '/en', 'es-AR': '/' } },
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
      <JsonLd data={[buildOrganizationJsonLd(), buildWebsiteJsonLd(), buildFaqJsonLd(HOME_REDESIGN_FAQS_EN)]} />
      <main id="contenido">
        <HomeRedesign primaryHref={signupHref} locale="en" />
      </main>
      <FooterHome locale="en" />
    </div>
  );
}
