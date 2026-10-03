'use client';

import dynamic from 'next/dynamic';
import { FileText } from 'lucide-react';
import { PdfProcessingJourney } from './pdf-processing-journey';
import { useProcessingScene } from './use-processing-scene';

const PdfFirstPageThumbnail = dynamic(() => import('./pdf-first-page-thumbnail'), {
  ssr: false,
  loading: () => (
    <div className="journey-real-document journey-thumbnail-fallback">
      <FileText size={32} aria-hidden="true" />
      <span>PDF</span>
    </div>
  ),
});

export function PdfProcessingPanel({
  file,
  fileName,
  complete,
  progress,
  processingMessage,
  onStartDiagnostic,
  onStartSummary,
  onViewTools,
}: {
  file: File | null;
  fileName: string;
  complete: boolean;
  progress: number;
  processingMessage: string;
  onStartDiagnostic: () => void;
  onStartSummary: () => void;
  onViewTools: () => void;
}) {
  const { scene, waitingForProcessing } = useProcessingScene(complete);
  return (
    <PdfProcessingJourney
      scene={scene}
      complete={complete}
      waitingForProcessing={waitingForProcessing}
      fileName={fileName}
      sample={false}
      progress={progress}
      processingMessage={processingMessage}
      documentPreview={
        <PdfFirstPageThumbnail
          key={file ? `${file.name}:${file.lastModified}` : 'no-file'}
          file={file}
        />
      }
      onStartDiagnostic={onStartDiagnostic}
      onStartSummary={onStartSummary}
      onViewTools={onViewTools}
    />
  );
}
