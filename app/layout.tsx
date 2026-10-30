import { Inter } from 'next/font/google';
import type { Metadata, Viewport } from 'next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { GlobalClientRuntime } from '@/components/GlobalClientRuntime';
import { SharedPrivateShell } from '@/components/SharedPrivateShell';
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
  backdrop-filter: blur(var(--ui-backdrop-blur, 1.5px));
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
  applicationName: 'Evaluo',
  authors: [{ name: 'Evaluo' }],
  creator: 'Evaluo',
  publisher: 'Evaluo',
  // Public pages define their own canonical; do not make all routes inherit '/'.
  openGraph: {
    type: 'website',
    siteName: 'Evaluo',
    title: 'No estudies todo por igual | Evaluo',
    description:
      'Descubrí qué sabés, qué reforzar y cómo avanzás. Practicá con tus apuntes y seguí tu progreso por tema.',
    images: [
      {
        url: '/evaluo-whatsapp-progreso.png',
        width: 1200,
        height: 630,
        type: 'image/png',
        alt: 'Evaluo: no estudies todo por igual. Descubrí qué sabés, qué reforzar y cómo avanzás.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'No estudies todo por igual | Evaluo',
    description:
      'Descubrí qué sabés, qué reforzar y cómo avanzás. Practicá con tus apuntes y seguí tu progreso por tema.',
    images: ['/evaluo-whatsapp-progreso.png'],
  },
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      {
        url: '/evaluo-logo-icono.svg',
        type: 'image/svg+xml',
        sizes: 'any',
      },
    ],
    shortcut: [{ url: '/evaluo-logo-icono.svg', type: 'image/svg+xml' }],
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
    <html lang="es" className={inter.className}>
      <body className="bg-background text-foreground min-h-screen text-[0.92rem]">
        <style>{ROOT_INLINE_CSS}</style>
        <GlobalClientRuntime />
        <SharedPrivateShell>{children}</SharedPrivateShell>
        <SpeedInsights />
      </body>
    </html>
  );
}
