import type { Metadata } from 'next';
import { RealStudyErrorsPreview } from '@/components/preview/real-study-errors-preview';
import '@/app/dashboard/dashboard-responsive.css';

export const metadata: Metadata = {
  title: 'Preview · Explicación con tu PDF',
  robots: { index: false, follow: false },
};

export default function ExplanationPreviewPage() {
  return <RealStudyErrorsPreview />;
}
