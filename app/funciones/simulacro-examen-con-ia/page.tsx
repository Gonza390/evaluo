import type { Metadata } from 'next';
import { SimulacroExamenIaLanding } from '@/components/marketing/seo-practice-tools-landings';
import { toAbsoluteUrl } from '@/lib/site';

const path = '/funciones/simulacro-examen-con-ia';

export const metadata: Metadata = {
  title: 'Simulacro de examen con IA desde tu PDF | Evaluo',
  description: 'Prepará un simulacro de examen con IA desde tus apuntes PDF. Practicá preguntas, revisá errores y reforzá los temas antes del parcial o final.',
  alternates: { canonical: toAbsoluteUrl(path) },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    title: 'Simulacro de examen con IA desde tu PDF | Evaluo',
    description: 'Practicá con tus apuntes, interpretá los resultados y reforzá los temas que todavía te cuestan.',
    url: toAbsoluteUrl(path),
  },
};

export default function Page() {
  return <SimulacroExamenIaLanding />;
}
