import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { notFound } from 'next/navigation';
import { RealPdfProgressPreview } from '@/components/preview/real-pdf-progress-preview';
import type { StudentMaterialSummary, StudyGlossaryItem } from '@/lib/student-material-summary';
import type { PedagogicalArtifacts } from '@/lib/student-materials/pedagogy';
import '@/app/materiales/[id]/material-study.css';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Prueba local · Marketing I',
  robots: { index: false, follow: false },
};

export default async function MarketingProgressPreview() {
  // Archivo del usuario: esta muestra no existe en producción ni incluye el PDF en Git.
  if (process.env.NODE_ENV !== 'development') notFound();
  const raw = await readFile(
    path.join(process.cwd(), 'tmp/marketing-preview/study.json'),
    'utf8'
  ).catch(() => null);
  if (!raw) notFound();
  const fixture = JSON.parse(raw) as {
    pageCount: number;
    summary: StudentMaterialSummary;
    glossary: StudyGlossaryItem[];
    pedagogicalArtifacts: PedagogicalArtifacts;
  };
  return (
    <RealPdfProgressPreview
      initialProgressOpen
      initialFirstVisit
      sampleDocument={{
        id: 'preview-local-marketing',
        title: 'Marketing I · Módulos 1 a 4.pdf',
        pageCount: fixture.pageCount,
        pdfHref: '/preview/progreso-pdf/marketing/archivo',
      }}
      summary={fixture.summary}
      glossary={fixture.glossary}
      artifacts={fixture.pedagogicalArtifacts}
    />
  );
}
