import type { Metadata } from 'next';
import ExamDatePlanPreview from '@/components/preview/exam-date-plan-preview';

export const metadata: Metadata = {
  title: 'Preview · Fecha de examen | Evaluo',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ExamDatePlanPreviewPage() {
  return <ExamDatePlanPreview />;
}
