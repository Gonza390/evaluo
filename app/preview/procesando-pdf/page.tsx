import type { Metadata } from 'next';
import { PdfProcessingPreview } from '@/components/preview/pdf-processing-preview';

export const metadata: Metadata = {
  title: 'Tu material · Evaluo',
  robots: { index: false, follow: false },
};

export default async function PdfProcessingPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ pdf?: string; listo?: string; estudiar?: string }>;
}) {
  const params = await searchParams;
  return (
    <PdfProcessingPreview
      firstPdf={params.pdf !== 'siguiente'}
      processingTimeMs={params.listo === '1' || params.estudiar === '1' ? 0 : 22000}
      initialMaterialEntry={params.estudiar === '1' ? 'guided' : null}
    />
  );
}
