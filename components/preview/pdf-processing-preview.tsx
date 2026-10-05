'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { Check, FileText, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import {
  PdfProcessingJourney,
  processingScenes,
} from '@/components/pdf-processing/pdf-processing-journey';
import {
  PdfProcessingMaterialPreview,
  type ProcessingMaterialEntry,
} from './pdf-processing-material-preview';

const readingTimeMs = 6500;
const PdfFirstPageThumbnail = dynamic(
  () => import('@/components/pdf-processing/pdf-first-page-thumbnail'),
  {
    ssr: false,
    loading: () => (
      <div className="journey-real-document journey-thumbnail-fallback">
        <FileText size={24} />
        <span>PDF</span>
      </div>
    ),
  }
);
export function PdfProcessingPreview({
  processingTimeMs = 22000,
  firstPdf = true,
  initialMaterialEntry = null,
}: {
  processingTimeMs?: number;
  firstPdf?: boolean;
  initialMaterialEntry?: ProcessingMaterialEntry | null;
}) {
  const [elapsed, setElapsed] = useState(0);
  const [sampleFile, setSampleFile] = useState<File | null>(null);
  const [modalOpen, setModalOpen] = useState(!initialMaterialEntry);
  const [materialEntry, setMaterialEntry] = useState<ProcessingMaterialEntry | null>(
    initialMaterialEntry
  );
  const readyHeading = useRef<HTMLHeadingElement>(null);
  const complete = elapsed >= processingTimeMs;
  const scene = Math.min(processingScenes.length - 1, Math.floor(elapsed / readingTimeMs));
  const waitingForProcessing = !complete && elapsed >= readingTimeMs * processingScenes.length;

  useEffect(() => {
    let active = true;
    void fetch('/demo/derecho-penal-unidad-2.pdf')
      .then((response) => response.blob())
      .then((blob) => {
        if (active)
          setSampleFile(
            new File([blob], 'Derecho penal · Unidad 2.pdf', { type: 'application/pdf' })
          );
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (complete) return;
    let lastTick = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      const delta = now - lastTick;
      lastTick = now;
      setElapsed((current) => Math.min(processingTimeMs, current + delta));
    }, 250);
    return () => window.clearInterval(timer);
  }, [complete, processingTimeMs]);

  function openMaterial(entry: ProcessingMaterialEntry) {
    setMaterialEntry(entry);
    setModalOpen(false);
  }

  return (
    <main data-pdf-processing-preview className="bg-background text-foreground min-h-screen">
      <header className="journey-page-header">
        <div className="journey-brand">
          <Image src="/icon.png" alt="" width={32} height={32} />
          <strong>Evaluo</strong>
        </div>
      </header>
      {materialEntry ? (
        <PdfProcessingMaterialPreview
          key={materialEntry}
          entry={materialEntry}
          firstPdf={firstPdf}
          onBack={() => {
            setMaterialEntry(null);
            setModalOpen(true);
          }}
        />
      ) : (
        <div className="journey-upload-background">
          <aside className="journey-background-nav">
            <strong>Tu espacio académico</strong>
            <span className="journey-nav-active">Mi espacio</span>
            <span>Calendario</span>
            <span>Mis errores</span>
          </aside>
          <section className="journey-background-content">
            {complete ? (
              <>
                <div className="journey-ready-status" role="status">
                  <Check size={18} /> Tu material está listo
                </div>
                <h1 ref={readyHeading} tabIndex={-1}>
                  Derecho penal · Unidad 2
                </h1>
                <p>Resumen de tu PDF</p>
                <article className="journey-ready-summary" aria-label="Resumen del material">
                  <span className="journey-eyebrow">Resumen</span>
                  <h2>Teoría de la acción</h2>
                  <p>
                    La acción humana se caracteriza por su orientación hacia un fin. La persona
                    anticipa un objetivo y dirige su conducta para alcanzarlo.
                  </p>
                  <h3>La culpabilidad</h3>
                  <p>Se analiza el reproche personal y la posibilidad de actuar de otra manera.</p>
                  <span className="journey-ready-source">
                    <FileText size={16} /> Derecho penal · Unidad 2.pdf · pág. 12
                  </span>
                </article>
              </>
            ) : (
              <>
                <span className="journey-eyebrow">MI ESPACIO</span>
                <h1>Estudiá con tus apuntes.</h1>
                <p>Subí el material de tu materia y prepará tu próxima sesión de estudio.</p>
                <div className="journey-upload-form">
                  <div className="journey-upload-title">
                    <Upload size={22} />
                    <h2>Subir mi PDF</h2>
                  </div>
                  <p>Elegí el archivo y poné un nombre.</p>
                  <div className="journey-upload-file">
                    <FileText size={28} />
                    <div>
                      <strong>Derecho penal · Unidad 2.pdf</strong>
                      <span>Archivo seleccionado</span>
                    </div>
                  </div>
                  <label htmlFor="journey-background-title">Nombre del material</label>
                  <input id="journey-background-title" readOnly value="Derecho penal · Unidad 2" />
                  <button className="journey-upload-submit" onClick={() => setModalOpen(true)}>
                    Ver estado del PDF
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      )}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent
          className="journey-modal"
          overlayClassName="journey-modal-overlay"
          data-pdf-processing-preview
          onCloseAutoFocus={(event) => {
            if (complete) {
              event.preventDefault();
              if (materialEntry) {
                const guideHeading = document.querySelector<HTMLElement>(
                  '[aria-label="Ayuda para estudiar este PDF"] h2'
                );
                const destination =
                  guideHeading ??
                  document.querySelector<HTMLElement>('[data-recommended-pdf-preview] button');
                destination?.focus({ preventScroll: true });
              } else {
                readyHeading.current?.focus({ preventScroll: true });
              }
            }
          }}
        >
          <DialogTitle className="sr-only">
            {complete ? 'Tu PDF está listo' : 'Preparación de tu PDF'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Mientras se prepara tu material, conocé cómo entender, practicar y reforzar con el mismo
            PDF.
          </DialogDescription>
          <PdfProcessingJourney
            scene={scene}
            complete={complete}
            firstPdf={firstPdf}
            documentPreview={sampleFile ? <PdfFirstPageThumbnail file={sampleFile} /> : undefined}
            waitingForProcessing={waitingForProcessing}
            onStartDiagnostic={() => openMaterial('diagnostic')}
            onStartSummary={() => openMaterial(firstPdf ? 'guided' : 'summary')}
            onViewTools={() => openMaterial('tools')}
          />
        </DialogContent>
      </Dialog>
    </main>
  );
}
