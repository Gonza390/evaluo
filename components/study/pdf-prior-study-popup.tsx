'use client';

import { useRef } from 'react';
import { BookOpenText, ClipboardCheck, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';

export type PriorStudyChoice = 'not_studied' | 'already_studied';

type Props = {
  open: boolean;
  onChoose: (choice: PriorStudyChoice) => void;
  onDismiss: () => void;
};

/** Pregunta de conocimientos previos, compacta y consistente con Evaluo. */
export function PdfPriorStudyPopup({ open, onChoose, onDismiss }: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onDismiss();
      }}
    >
      <DialogContent
        data-pdf-prior-study-popup
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          headingRef.current?.focus();
        }}
        showCloseButton={false}
        aria-describedby="pdf-prior-study-description"
        overlayClassName="z-[125] bg-slate-950/45 backdrop-blur-[2px]"
        className="border-border bg-card text-card-foreground z-[125] max-h-[calc(100dvh-1.5rem)] w-[calc(100%-1.5rem)] max-w-[610px] gap-0 overflow-y-auto overscroll-contain rounded-[22px] border p-0 shadow-[0_22px_75px_rgba(15,27,61,0.18)] sm:max-w-[610px]"
      >
        <div className="px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-primary text-[10px] font-bold uppercase tracking-[0.14em]">
              Tu punto de partida
            </p>
            <span className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-xl" aria-hidden="true">
              <Sparkles className="size-[16px]" />
            </span>
          </div>

          <DialogTitle
            ref={headingRef}
            tabIndex={-1}
            className="text-foreground mt-2.5 text-left text-[20px] font-bold leading-tight tracking-[-0.035em] outline-none sm:text-[22px]"
          >
            ¿Cómo llegás a este material?
          </DialogTitle>
          <DialogDescription
            id="pdf-prior-study-description"
            className="text-muted-foreground mt-1.5 text-left text-[12.5px] leading-5 sm:text-[13px]"
          >
            Contanos cuánto conocés del tema para recomendarte por dónde empezar.
          </DialogDescription>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              data-pdf-prior-study-no
              onClick={() => onChoose('not_studied')}
              className="border-border bg-muted/25 hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-primary group flex min-h-[116px] flex-col items-start rounded-[15px] border px-4 py-3.5 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <span className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg">
                <BookOpenText className="size-[17px]" aria-hidden="true" />
              </span>
              <span className="text-foreground mt-2.5 text-[14px] font-semibold leading-5">
                Empiezo desde cero
              </span>
              <span className="text-muted-foreground mt-1 text-[11.5px] leading-[1.45] sm:text-[12px]">
                Quiero estudiar y entender el material, tema por tema.
              </span>
            </button>

            <button
              type="button"
              data-pdf-prior-study-yes
              onClick={() => onChoose('already_studied')}
              className="border-border bg-muted/25 hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-primary group flex min-h-[116px] flex-col items-start rounded-[15px] border px-4 py-3.5 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <span className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg">
                <ClipboardCheck className="size-[17px]" aria-hidden="true" />
              </span>
              <span className="text-foreground mt-2.5 text-[14px] font-semibold leading-5">
                Ya lo estudié
              </span>
              <span className="text-muted-foreground mt-1 text-[11.5px] leading-[1.45] sm:text-[12px]">
                Quiero practicar para comprobar cuánto sé.
              </span>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
