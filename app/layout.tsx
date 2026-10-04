import type { Metadata } from 'next';
import ClientLayout from '@/components/ClientLayout';
import { ThirdPartyAnalytics } from '@/components/ThirdPartyAnalytics';
import './globals.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/800.css';
import '@fontsource/inter/900.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://evaluo.com.ar'),
  title: {
    default: 'Evaluo | Simulador de exámenes y materiales universitarios',
    template: '%s | Evaluo',
  },
  description:
    'Estudiá con resúmenes, pregunteros y simuladores universitarios en un solo lugar. Encontrá material para Universidad Siglo 21 y prepará tus parciales con Evaluo.',
  keywords: [
    'evaluo',
    'pregunteros',
    'pregunteros Siglo 21',
    'Universidad Siglo 21',
    'primer parcial',
    'segundo parcial',
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
    url: 'https://evaluo.com.ar',
    siteName: 'Evaluo',
    title: 'Evaluo | Simulador de exámenes y materiales universitarios',
    description:
      'Pregunteros, resúmenes, preguntas y simuladores para preparar parciales universitarios, con foco en Universidad Siglo 21.',
    locale: 'es_AR',
    images: [{ url: '/opengraph-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Evaluo | Simulador de exámenes y materiales universitarios',
    description:
      'Pregunteros, resúmenes y simuladores para preparar tus parciales universitarios.',
    images: ['/opengraph-image.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="bg-background text-foreground min-h-screen font-sans text-[0.92rem]"
      >
        <ThirdPartyAnalytics />
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
