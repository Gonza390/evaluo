import type { Metadata } from 'next';
import ClientLayout from '@/components/ClientLayout';

const explorarDescription =
  'Encontrá tu materia por universidad o carrera y accedé a materiales, Pregunteros y Simuladores en Evaluo.';

export const metadata: Metadata = {
  title: 'Encontrá tu materia',
  description: explorarDescription,
  alternates: {
    canonical: '/explorar',
  },
  openGraph: {
    title: 'Encontrá tu materia',
    description: explorarDescription,
    url: '/explorar',
  },
};

export default function ExplorarLayout({ children }: { children: React.ReactNode }) {
  return <ClientLayout>{children}</ClientLayout>;
}
