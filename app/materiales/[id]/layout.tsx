import type { Metadata } from 'next';
import ClientLayout from '@/components/ClientLayout';
import { PdfWorkerPreload } from '@/components/pdf/pdf-worker-preload';

export const metadata: Metadata = {
  title: 'Material de estudio',
  description: 'Lector interno para PDFs subidos por estudiantes en Evaluo.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function StudentMaterialLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PdfWorkerPreload />
      <ClientLayout>{children}</ClientLayout>
    </>
  );
}
