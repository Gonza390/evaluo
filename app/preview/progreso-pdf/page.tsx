import type { Metadata } from 'next';
import { RealPdfProgressPreview } from '@/components/preview/real-pdf-progress-preview';
import fixture from '@/public/material-general-prueba.study.json';
import type { StudentMaterialSummary, StudyGlossaryItem } from '@/lib/student-material-summary';
import type { PedagogicalArtifacts } from '@/lib/student-materials/pedagogy';

export const metadata: Metadata = {
  title: 'Preview · Progreso de tu PDF',
  robots: { index: false, follow: false },
};

export default function PdfProgressPreviewPage() {
  return (
    <RealPdfProgressPreview
      summary={fixture.summary as StudentMaterialSummary}
      glossary={fixture.glossary as StudyGlossaryItem[]}
      artifacts={fixture.pedagogicalArtifacts as PedagogicalArtifacts}
    />
  );
}
