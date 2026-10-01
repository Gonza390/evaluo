import type { Metadata } from 'next';
import { StudyErrorsPreview } from '@/components/preview/study-errors-preview';

export const metadata: Metadata = {
  title: 'Preview · Mis errores por PDF',
  robots: { index: false, follow: false },
};

export default function MisErroresPreviewPage() {
  return <StudyErrorsPreview />;
}
