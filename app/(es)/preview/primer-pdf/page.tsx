import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Muestra · Tu primer PDF en Evaluo',
  robots: { index: false, follow: false },
};

/** Mantener enlaces antiguos sin crear un segundo recorrido de onboarding. */
export default function FirstPdfPreviewPage() {
  redirect('/demo/material-estudio?tour=1&source=first_pdf_preview');
}
