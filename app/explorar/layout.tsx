import type { Metadata } from 'next';
import ClientLayout from '@/components/ClientLayout';

export const metadata: Metadata = {
  title: 'Universidades y carreras',
  description: 'Buscá universidades y carreras disponibles en Evaluo.',
  alternates: {
    canonical: '/explorar',
  },
  openGraph: {
    title: 'Universidades y carreras',
    description: 'Buscá universidades y carreras disponibles en Evaluo.',
    url: '/explorar',
  },
};

export default function ExplorarLayout({ children }: { children: React.ReactNode }) {
  return <ClientLayout>{children}</ClientLayout>;
}
