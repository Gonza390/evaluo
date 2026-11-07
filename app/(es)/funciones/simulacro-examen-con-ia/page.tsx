import type { Metadata } from 'next';
import { SimulacroExamenIaLanding } from '@/components/marketing/seo-practice-tools-landings';
import { hreflangAlternates } from '@/lib/seo/hreflang-clusters';
import { toAbsoluteUrl } from '@/lib/site';

const path = '/funciones/simulacro-examen-con-ia';

export const metadata: Metadata = {
  title: 'Simulacro de examen con IA gratis desde tus apuntes',
  description:
    'Hacé un simulacro de examen con IA a partir de tu PDF, gratis. Elegís el archivo sin registrarte, practicás con preguntas de tu material y ves qué temas reforzar.',
  alternates: hreflangAlternates('mock-exam', 'es-AR'),
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    title: 'Simulacro de examen con IA gratis desde tus apuntes | Evaluo',
    description: 'Practicá con tus apuntes, interpretá los resultados y reforzá los temas que todavía te cuestan.',
    url: toAbsoluteUrl(path),
  },
};

export default function Page() {
  return <SimulacroExamenIaLanding />;
}
