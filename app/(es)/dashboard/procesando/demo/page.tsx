import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { FullscreenProcessing } from '@/components/pdf-processing/fullscreen-processing';
import type { StudentMaterialProcessingState } from '@/app/dashboard/materiales/actions';

export const metadata: Metadata = {
  title: 'Demostración de procesamiento | Evaluo',
  robots: { index: false, follow: false },
};

// Nunca disponible en Vercel ni en producción. No crea trabajos, materiales ni subidas.
export const dynamic = 'force-dynamic';

const demoMaterial: StudentMaterialProcessingState = {
  materialId: '00000000-0000-4000-8000-000000000000',
  title: 'Apuntes de Economía',
  fileName: 'Apuntes_Unidad_3.pdf',
  status: 'processing',
  stage: 'extracting',
  progress: 12,
  message: 'Vista local de demostración; ningún archivo se está procesando.',
  error: null,
  isFirstReadyMaterial: true,
};

export default function LocalPdfProcessingDemoPage() {
  if (process.env.NODE_ENV !== 'development') notFound();
  return <FullscreenProcessing initialState={demoMaterial} preview />;
}
