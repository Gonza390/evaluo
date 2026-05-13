import type { Metadata } from 'next';

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
    url: 'https://evaluo.com.ar/explorar',
  },
};

export default function ExplorarLayout({ children }: { children: React.ReactNode }) {
  return children;
}
