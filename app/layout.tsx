import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/900.css';
import type { Metadata, Viewport } from 'next';
import { SITE_URL } from '@/lib/site';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Evaluo | Simulador de exámenes y materiales universitarios',
    template: '%s | Evaluo',
  },
  description:
    'Estudia con resúmenes, preguntas y simuladores universitarios en un solo lugar. Organiza tus materiales y mejora tu rendimiento con Evaluo.',
  keywords: [
    'evaluo',
    'simulador de exámenes',
    'resúmenes universitarios',
    'preguntas de parcial',
    'estudio universitario',
    'materiales de estudio',
  ],
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
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="bg-background text-foreground min-h-screen text-[0.92rem]"
      >
        {children}
      </body>
    </html>
  );
}
