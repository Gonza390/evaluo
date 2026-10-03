'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Check, FileText, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { PdfProcessingJourney, processingScenes } from './pdf-processing-journey';
import {
  PdfProcessingMaterialPreview,
  type ProcessingMaterialEntry,
} from './pdf-processing-material-preview';

const readingTimeMs = 6500;
export function PdfProcessingPreview({ processingTimeMs = 22000 }: { processingTimeMs?: number }) {
  const [elapsed, setElapsed] = useState(0);
  const [modalOpen, setModalOpen] = useState(true);
  const [materialEntry, setMaterialEntry] = useState<ProcessingMaterialEntry | null>(null);
  const readyHeading = useRef<HTMLHeadingElement>(null);
  const complete = elapsed >= processingTimeMs;
  const scene = Math.min(processingScenes.length - 1, Math.floor(elapsed / readingTimeMs));
  const waitingForProcessing = !complete && elapsed >= readingTimeMs * processingScenes.length;

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
            <span>Calendario de exámenes</span>
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
                document
                  .querySelector<HTMLElement>(
                    materialEntry === 'tools'
                      ? '.journey-material-tabs [aria-selected="true"]'
                      : '.journey-material-panel h2'
                  )
                  ?.focus({ preventScroll: true });
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
            waitingForProcessing={waitingForProcessing}
            onStartDiagnostic={() => openMaterial('diagnostic')}
            onStartSummary={() => openMaterial('summary')}
            onViewTools={() => openMaterial('tools')}
          />
        </DialogContent>
      </Dialog>
    </main>
  );
}
