import { Inter } from 'next/font/google';
import type { Metadata, Viewport } from 'next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import SessionIdleGuard from '@/components/SessionIdleGuard';
import { ContextualPdfNudge } from '@/components/pdf-activation/contextual-pdf-nudge';
import { SITE_URL } from '@/lib/site';
import './globals.css';
import './fullscreen-exit.css';
import './performance-overrides.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Evaluo | Simulador de exámenes y materiales universitarios',
    template: '%s | Evaluo',
  },
  description:
    'Estudiá con resúmenes, pregunteros y simuladores universitarios en un solo lugar. Organizá tus materiales y mejorá tu rendimiento con Evaluo.',
  keywords: [
    'evaluo',
    'simulador de exámenes',
    'resúmenes universitarios',
    'pregunteros',
    'preguntas de parcial',
    'estudio universitario',
    'materiales de estudio',
  ],
  applicationName: 'Evaluo',
  authors: [{ name: 'Evaluo' }],
  creator: 'Evaluo',
  publisher: 'Evaluo',
  alternates: {
    canonical: '/',
    languages: {
      'es-AR': '/',
    },
  },
  other: {
    'geo.region': 'AR',
    'geo.placename': 'Argentina',
  },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'Evaluo',
    title: 'Evaluo | Simulador de exámenes y materiales universitarios',
    description:
      'Resúmenes, preguntas, simuladores y seguimiento de progreso para estudiar mejor en la universidad.',
    locale: 'es_AR',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'Evaluo | Simulador de exámenes y materiales universitarios',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Evaluo | Simulador de exámenes y materiales universitarios',
    description:
      'Resúmenes, preguntas y simuladores para preparar tus parciales desde un solo lugar.',
    images: ['/opengraph-image.png'],
  },
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [{ url: '/icon.png', sizes: 'any', type: 'image/png' }],
    apple: [{ url: '/apple-icon.png' }],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR" className={inter.className}>
      <body className="bg-background text-foreground min-h-screen text-[0.92rem]">
        <style>{`
          button[role='tab'][aria-controls*='-content-mapa'] > span {
            display: none !important;
          }
        `}</style>
        <SessionIdleGuard />
        {children}
        <ContextualPdfNudge />
        <SpeedInsights />
      </body>
    </html>
  );
}
