import type { Metadata } from 'next';
import ClientLayout from '@/components/ClientLayout';
import './globals.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/800.css';
import '@fontsource/inter/900.css';

export const metadata: Metadata = {
  title: 'Evaluo',
  description: 'Simulador de examenes universitarios.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="bg-background text-foreground min-h-screen font-sans text-[0.92rem]"
      >
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
