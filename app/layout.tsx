import { Inter } from 'next/font/google';
import type { Metadata, Viewport } from 'next';
import { SITE_URL } from '@/lib/site';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '900'],
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
    'Estudiá con resúmenes, preguntas y simuladores universitarios en un solo lugar. Organizá tus materiales y mejorá tu rendimiento con Evaluo.',
  keywords: [
    'evaluo',
    'simulador de exámenes',
    'resúmenes universitarios',
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
  },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'Evaluo',
    title: 'Evaluo | Simulador de exámenes y materiales universitarios',
    description:
      'Resúmenes, preguntas, simuladores y seguimiento de progreso para estudiar mejor en la universidad.',
    locale: 'es_AR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Evaluo | Simulador de exámenes y materiales universitarios',
    description:
      'Resúmenes, preguntas y simuladores para preparar tus parciales desde un solo lugar.',
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
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0b1220' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning className={inter.className}>
      <body
        suppressHydrationWarning
        className="bg-background text-foreground min-h-screen text-[0.92rem]"
      >
        {children}
      </body>
    </html>
  );
}
