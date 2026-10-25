'use client';

import { useRef } from 'react';
import { ArrowRight, BookOpenText, Layers, SquareLibrary, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import type { FirstTopicResourceInfo } from '@/lib/student-materials/first-topic-resources';

type Props = {
  open: boolean;
  firstTopicTitle: string | null;
  resources: FirstTopicResourceInfo;
  onStart: () => void;
  onDismiss: () => void;
};

function resourceCaption(count: number | null, available: boolean, singular: string, plural: string) {
  if (count !== null) return `${count} ${count === 1 ? singular : plural}`;
  return available ? 'En tu PDF' : 'No disponible';
}

/** Breve introducción al tema 1, superpuesta sobre el Resumen. */
export function PdfStudyStartGuide({ open, firstTopicTitle, resources, onStart, onDismiss }: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const hasFirstTopic = Boolean(firstTopicTitle?.trim());

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onDismiss(); }}>
      <DialogContent
        data-pdf-study-start-guide
        showCloseButton={false}
        aria-describedby="pdf-study-start-description"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          headingRef.current?.focus();
        }}
        overlayClassName="z-[135] bg-slate-950/45 backdrop-blur-[2px]"
        className="border-border bg-card text-card-foreground z-[135] flex max-h-[calc(100dvh-1.5rem)] w-[calc(100%-1.5rem)] max-w-[500px] flex-col gap-0 overflow-hidden rounded-[22px] border p-0 shadow-[0_22px_75px_rgba(15,27,61,0.18)] sm:max-w-[500px]"
      >
        <div className="min-h-0 overflow-y-auto overscroll-contain px-5 pt-5 pb-4 sm:px-6 sm:pt-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-primary text-[10px] font-bold uppercase tracking-[0.14em]">
              Tu guía de estudio
            </p>
            <button type="button" onClick={onDismiss} aria-label="Cerrar guía y volver al resumen" className="text-muted-foreground hover:bg-muted flex size-8 shrink-0 items-center justify-center rounded-full transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F5DFF]">
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>

          <DialogTitle ref={headingRef} tabIndex={-1} className="text-foreground mt-2.5 text-left text-[20px] font-bold leading-tight tracking-[-0.035em] outline-none">
            ¡Vamos a estudiar el tema 1!
          </DialogTitle>
          <DialogDescription id="pdf-study-start-description" className="text-muted-foreground mt-2 text-left text-[12.5px] leading-[1.6]">
            Empezá leyendo el resumen. Usá el glosario y las flashcards para repasar, y después practicá para comprobar cuánto aprendiste.
          </DialogDescription>

          <div className="border-border mt-4 border-t pt-4">
            <p className="text-primary text-[10px] font-bold uppercase tracking-[0.12em]">Tu primer tema</p>
            <p data-pdf-study-first-topic className="text-foreground mt-1 break-words text-[14px] font-bold leading-5">
              {hasFirstTopic ? firstTopicTitle : 'El resumen de tu material'}
            </p>
            <p className="text-muted-foreground mt-2 text-[12px] leading-5">
              Tu material de estudio está preparado:
            </p>

            <div data-pdf-study-resources className="mt-3 grid grid-cols-3 gap-2">
              <div className="border-border bg-muted/25 flex min-w-0 flex-col items-center rounded-[13px] border px-1.5 py-3 text-center">
                <BookOpenText className="text-primary size-5" aria-hidden="true" />
                <span className="text-foreground mt-2 text-[12px] font-semibold">Resumen</span>
                <span className="text-muted-foreground mt-0.5 text-[10.5px]">Tema 1</span>
              </div>
              <div className="border-border bg-muted/25 flex min-w-0 flex-col items-center rounded-[13px] border px-1.5 py-3 text-center">
                <Layers className="text-primary size-5" aria-hidden="true" />
                <span className="text-foreground mt-2 text-[12px] font-semibold">Flashcards</span>
                <span data-pdf-study-flashcards-caption className="text-muted-foreground mt-0.5 text-[10.5px]">
                  {resourceCaption(resources.flashcardCount, resources.hasFlashcards, 'tarjeta', 'tarjetas')}
                </span>
              </div>
              <div className="border-border bg-muted/25 flex min-w-0 flex-col items-center rounded-[13px] border px-1.5 py-3 text-center">
                <SquareLibrary className="text-primary size-5" aria-hidden="true" />
                <span className="text-foreground mt-2 text-[12px] font-semibold">Glosario</span>
                <span data-pdf-study-glossary-caption className="text-muted-foreground mt-0.5 text-[10.5px]">
                  {resourceCaption(resources.glossaryCount, resources.hasGlossary, 'término', 'términos')}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div data-pdf-study-start-footer className="border-border bg-card shrink-0 border-t px-5 py-4 sm:px-6">
          <button type="button" data-pdf-study-start-cta onClick={onStart} className="bg-primary hover:bg-primary/90 focus-visible:outline-primary flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-[13px] font-semibold text-white transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
            {hasFirstTopic ? 'Leer el tema 1' : 'Ir al resumen'}
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
