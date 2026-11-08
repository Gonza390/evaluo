import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { FreeUploadLimitDemo } from './demo-client';

export const metadata: Metadata = {
  title: 'Demo · Límite de apuntes Free',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';

// Solo visual: disponible en desarrollo y previews, nunca en producción.
// No consulta ni gasta cupos.
export default function FreeUploadLimitDemoPage() {
  if (process.env.VERCEL_ENV === 'production' ||
      (!process.env.VERCEL_ENV && process.env.NODE_ENV !== 'development')) notFound();
  return <FreeUploadLimitDemo />;
}
