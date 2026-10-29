import type { Metadata } from 'next';
import { PracticarPorTemaLanding } from '@/components/marketing/seo-practice-tools-landings';
import { toAbsoluteUrl } from '@/lib/site';

const path = '/funciones/practicar-por-tema';

export const metadata: Metadata = {
  title: 'Practicar por tema con IA desde tus apuntes | Evaluo',
  description: 'Practicá cada tema de tu PDF con preguntas de IA. Detectá lo que sabés, revisá errores y reforzá conceptos antes de pasar al siguiente tema.',
  alternates: { canonical: toAbsoluteUrl(path) },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    title: 'Practicar por tema con IA desde tus apuntes | Evaluo',
    description: 'Estudiá tema por tema, resolvé preguntas y revisá qué conceptos necesitás reforzar.',
    url: toAbsoluteUrl(path),
  },
};

export default function Page() {
  return <PracticarPorTemaLanding />;
}
