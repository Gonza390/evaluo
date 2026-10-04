'use client';

import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { MaterialStudyWorkspace, type StudyTabId } from '@/components/material-study-workspace';
import { AppShellProviders } from '@/components/app-shell-providers';
import { StudentMaterialDiagnostic } from '@/components/student-material-diagnostic';
import { StudyErrorsPreview } from './study-errors-preview';
import { previewErrors } from './study-errors-preview-data';
import {
  processingArtifacts,
  processingGlossary,
  processingSummary,
} from './pdf-processing-sample-study';

export type ProcessingMaterialEntry = 'guided' | 'diagnostic' | 'summary' | 'tools';

/** Mismo espacio de estudio que producción, con datos preparados y sin acciones de cuenta. */
export function PdfProcessingMaterialPreview({
  entry,
  onBack,
  firstPdf = true,
}: {
  entry: ProcessingMaterialEntry;
  onBack: () => void;
  firstPdf?: boolean;
}) {
  const [tab, setTab] = useState<StudyTabId>(entry === 'diagnostic' ? 'ejercicios' : 'resumen');
  const [viewerVisible, setViewerVisible] = useState(false);
  const [reviewTopics, setReviewTopics] = useState<string[] | null>(null);
  const selectedErrors = (reviewTopics ?? []).flatMap((topic) => {
    const error = previewErrors.find((item) => item.materialId === 'penal' && item.topic === topic);
    return error
      ? [{ ...error, source: 'Práctica', failures: 1, page: topic === 'Finalismo' ? 1 : 2 }]
      : [];
  });
  const errorsOpen = reviewTopics !== null;
  return (
    <div data-recommended-pdf-preview>
      <div className="text-muted-foreground mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-2 px-4 py-2 text-xs sm:px-6">
        <button
          type="button"
          onClick={errorsOpen ? () => setReviewTopics(null) : onBack}
          className="inline-flex min-h-11 items-center gap-2"
        >
          <ArrowLeft size={15} />
          {errorsOpen ? 'Volver a mi PDF' : 'Volver a tu PDF listo'}
        </button>
        <span>Material de ejemplo · no modifica tu progreso</span>
      </div>
      <div hidden={errorsOpen}>
        <AppShellProviders>
          <MaterialStudyWorkspace
            backHref="/preview/procesando-pdf"
            fileName="Derecho penal · Unidad 2.pdf"
            title="Derecho penal · Unidad 2"
            materialId="demo-processing-material"
            isOwner={false}
            isPremium
            canRegenerate={false}
            pageCount={2}
            visibility="private"
            viewerUrl="/demo/derecho-penal-unidad-2.pdf"
            studySummary={processingSummary}
            studyGlossary={processingGlossary}
            pedagogicalArtifacts={processingArtifacts}
            recommendedStudyAvailable={firstPdf}
            initialRecommendedStudy={entry === 'guided'}
            demo={{
              activeTab: tab,
              onTabChange: setTab,
              viewerVisible,
              onViewerChange: setViewerVisible,
              onReinforce: setReviewTopics,
              practice: (
                <StudentMaterialDiagnostic
                  artifacts={processingArtifacts}
                  materialId="demo-processing-material"
                  demo
                  onExit={() => setTab('resumen')}
                  onReviewTopics={() => setTab('resumen')}
                />
              ),
            }}
          />
        </AppShellProviders>
      </div>
      {errorsOpen && (
        <StudyErrorsPreview
          key={reviewTopics.join('|')}
          initialMaterialId="penal"
          initialErrors={selectedErrors}
          materials={[
            {
              id: 'penal',
              title: 'Derecho penal · Unidad 2.pdf',
              subject: 'Derecho penal',
              pages: 2,
            },
          ]}
          showControls={false}
        />
      )}
    </div>
  );
}
