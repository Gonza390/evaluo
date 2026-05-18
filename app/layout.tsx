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
    url: 'https://evaluo.com.ar',
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
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
