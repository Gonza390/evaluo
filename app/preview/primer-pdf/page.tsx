import type { Metadata } from 'next';
import './preview.css';
import { FirstPdfGuidedPreview } from '@/components/preview/first-pdf-guided-preview';

export const metadata: Metadata = {
  title: 'Preview · Tu primer PDF en Evaluo',
  robots: { index: false, follow: false },
};

export default function FirstPdfPreviewPage() {
  return <FirstPdfGuidedPreview />;
}
