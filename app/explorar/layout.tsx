import type { Metadata } from 'next';
import ClientLayout from '@/components/ClientLayout';

export const metadata: Metadata = {
  title: 'Explorar universidades y materias',
  description:
    'Descubre universidades, carreras y materias disponibles en Evaluo para estudiar con resúmenes, preguntas y simuladores.',
  alternates: {
    canonical: '/explorar',
  },
  openGraph: {
    title: 'Explorar universidades y materias',
    description:
      'Encuentra tu universidad, carrera y materia para estudiar con recursos, preguntas y simuladores en Evaluo.',
    url: '/explorar',
  },
};

export default function ExplorarLayout({ children }: { children: React.ReactNode }) {
  return <ClientLayout>{children}</ClientLayout>;
}
