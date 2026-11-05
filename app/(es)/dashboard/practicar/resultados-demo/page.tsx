import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PracticeResultsDemo } from '@/components/dashboard/practice-results-demo';

export const metadata: Metadata = {
  title: 'Vistas previas de resultados de práctica | Evaluo',
  robots: { index: false, follow: false },
};

// Galería exclusiva de desarrollo. No se publica ni consulta cuotas, materiales o intentos.
export const dynamic = 'force-dynamic';

export default async function PracticeResultsDemoPage({
  searchParams,
}: {
  searchParams?: Promise<{ tipo?: string }>;
}) {
  if (process.env.NODE_ENV !== 'development') notFound();
  const { tipo = 'opciones' } = (await searchParams) ?? {};
  return <PracticeResultsDemo type={tipo} />;
}
