import type { Metadata } from 'next';
import { PdfUploadUxPreviewClient } from './preview-client';

export const metadata: Metadata = {
  title: 'Preview · Carga de PDF | Evaluo',
  robots: {
    index: false,
    follow: false,
  },
};

export default function PdfUploadUxPreviewPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <PdfUploadUxPreviewClient />
      </div>
    </main>
  );
}
