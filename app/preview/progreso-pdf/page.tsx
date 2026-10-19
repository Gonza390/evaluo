import type { Metadata } from 'next';
import { RealPdfProgressPreview } from '@/components/preview/real-pdf-progress-preview';
import fixture from '@/public/material-general-prueba.study.json';
import type { StudentMaterialSummary, StudyGlossaryItem } from '@/lib/student-material-summary';
import type { PedagogicalArtifacts } from '@/lib/student-materials/pedagogy';
import '@/app/materiales/[id]/material-study.css';

export const metadata: Metadata = {
  title: 'Preview · Progreso de tu PDF',
  robots: { index: false, follow: false },
};

export default async function PdfProgressPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; tab?: string; nuevo?: string }>;
}) {
  const { error, tab, nuevo } = await searchParams;
  return (
    <RealPdfProgressPreview
      initialErrorId={error?.slice(0, 80)}
      initialProgressOpen={tab === 'progreso'}
      initialFirstVisit={nuevo === '1'}
      summary={fixture.summary as StudentMaterialSummary}
      glossary={fixture.glossary as StudyGlossaryItem[]}
      artifacts={fixture.pedagogicalArtifacts as PedagogicalArtifacts}
    />
  );
}
