import type { Metadata } from 'next';
import { FooterHome } from '@/components/footer-home';
import { MarketingAnalyticsSlot } from '@/components/MarketingAnalyticsSlot';
import { HomeFunnelTracker } from '@/components/marketing/home-funnel-tracker';
import { HomeRedesign } from '@/components/marketing/home-redesign';
import { HOME_REDESIGN_FAQS } from '@/components/marketing/home-redesign-faqs';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildFaqJsonLd, buildOrganizationJsonLd, buildWebsiteJsonLd } from '@/lib/seo';
import './home-redesign.css';

export const metadata: Metadata = {
  title: { absolute: 'Evaluo | Estudiá tu PDF con IA y prepará tu examen' },
  description:
    'Subí tus apuntes en PDF y estudiá con IA: resúmenes, mapas mentales, flashcards y práctica para preparar tus exámenes.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    siteName: 'Evaluo',
    locale: 'es_AR',
    title: 'No estudies todo por igual | Evaluo',
    description: 'Descubrí qué sabés, qué reforzar y cómo avanzás. Practicá con tus propios apuntes y seguí tu progreso por tema.',
    url: '/',
    images: [{
      url: '/evaluo-whatsapp-progreso.png',
      width: 1200,
      height: 630,
      type: 'image/png',
      alt: 'Evaluo: progreso por tema y refuerzo personalizado',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'No estudies todo por igual | Evaluo',
    description: 'Descubrí qué sabés, qué reforzar y cómo avanzás.',
    images: ['/evaluo-whatsapp-progreso.png'],
  },
};

const primaryHref = '/login?mode=signup&next=%2Fdashboard%2Fmateriales%3FopenUpload%3D1';

export default function Home() {
  return (
    <div className="home-redesign-root">
      <a href="#contenido" className="reference-skip-link">
        Saltar al contenido
      </a>
      <MarketingAnalyticsSlot />
      <HomeFunnelTracker />
      <JsonLd
        data={[buildOrganizationJsonLd(), buildWebsiteJsonLd(), buildFaqJsonLd(HOME_REDESIGN_FAQS)]}
      />
      <main id="contenido">
        <HomeRedesign primaryHref={primaryHref} />
      </main>
      <FooterHome />
    </div>
  );
}
