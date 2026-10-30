import type { Metadata } from 'next';
import ClientLayout from '@/components/ClientLayout';

export const metadata: Metadata = {
  title: 'Lector de recursos',
  description: 'Visor interno de recursos de estudio de Evaluo.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ResourceLayout({ children }: { children: React.ReactNode }) {
  return <ClientLayout>{children}</ClientLayout>;
}
