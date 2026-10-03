import type { Metadata } from 'next';
import { PdfProcessingPreview } from '@/components/preview/pdf-processing-preview';

export const metadata: Metadata = {
  title: 'Tu material · Evaluo',
  robots: { index: false, follow: false },
};

export default function PdfProcessingPreviewPage() {
  return <PdfProcessingPreview />;
}
