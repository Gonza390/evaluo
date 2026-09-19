import { Inter } from 'next/font/google';
import type { Metadata, Viewport } from 'next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { GlobalClientRuntime } from '@/components/GlobalClientRuntime';
import { SITE_URL } from '@/lib/site';
import './globals.css';

const ROOT_INLINE_CSS = `
:fullscreen button[aria-label='Salir de pantalla completa'] {
  position: fixed;
  top: max(1rem, env(safe-area-inset-top));
  right: max(1rem, env(safe-area-inset-right));
  z-index: 2147483647;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 9999px;
  border: 1px solid rgb(226 232 240 / 0.95);
  background: rgb(255 255 255 / 0.96);
  color: rgb(15 23 42);
  box-shadow: 0 12px 30px rgb(15 23 42 / 0.2);
  backdrop-filter: blur(10px);
}

:fullscreen button[aria-label='Salir de pantalla completa'] svg {
  display: none;
}

:fullscreen button[aria-label='Salir de pantalla completa']::before {
  content: '×';
  font-size: 1.75rem;
  font-weight: 500;
  line-height: 1;
  transform: translateY(-1px);
}

:fullscreen button[aria-label='Salir de pantalla completa']:hover {
  background: rgb(248 250 252);
}

@keyframes evaluoSurfaceRevealSafe {
  from {
    transform: translateY(10px) scale(0.992);
  }
  to {
    transform: translateY(0) scale(1);
  }
}

.animate-surface-reveal {
  opacity: 1 !important;
  animation: evaluoSurfaceRevealSafe 0.42s cubic-bezier(0.22, 1, 0.36, 1) both !important;
}

.materia-list-catalog-only > .animate-page-enter > :nth-child(1),
.materia-list-catalog-only > .animate-page-enter > :nth-child(2) {
  display: none !important;
}

@media (prefers-reduced-motion: reduce) {
  .animate-surface-reveal {
    animation: none !important;
    transform: none !important;
  }
}
`;

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
    default: 'Evaluo | Estudiá tu PDF con IA y prepará tu examen',
    template: '%s | Evaluo',
  },
  description:
    'Subí tus apuntes en PDF y estudiá con IA: resúmenes, mapas mentales, flashcards y práctica para preparar tus exámenes.',
  keywords: [
    'evaluo',
    'estudiar PDF con IA',
    'resumir PDF con IA',
    'flashcards desde PDF',
    'mapa mental desde PDF',
    'preparar examen',
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
    title: 'Evaluo | Estudiá tu PDF con IA y prepará tu examen',
    description:
      'Subí tu PDF y transformalo en resúmenes, mapas mentales, flashcards y práctica para preparar tus exámenes.',
    locale: 'es_AR',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'Evaluo | Estudiá tu PDF con IA y prepará tu examen',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Evaluo | Estudiá tu PDF con IA y prepará tu examen',
    description:
      'Subí tu PDF y estudiá con resúmenes, mapas mentales, flashcards y práctica sobre el mismo material.',
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
        <style>{ROOT_INLINE_CSS}</style>
        <GlobalClientRuntime />
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
