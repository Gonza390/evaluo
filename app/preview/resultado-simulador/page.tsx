import type { Metadata } from 'next';
import { SimulatorResultRedesignPreview } from '@/components/simulador/SimulatorResultRedesignPreview';

export const metadata: Metadata = {
  title: 'Preview resultado simulador | Evaluo',
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams?: Promise<{ estado?: string; contenido?: string }>;
};

export default async function SimulatorResultPreviewPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  return (
    <SimulatorResultRedesignPreview
      improved={params.estado === 'mejora'}
      hasMaterial={params.contenido !== 'sin-material'}
    />
  );
}
