'use client';

import { useRef } from 'react';
import { BookOpen, ClipboardCheck, Sparkles } from 'lucide-react';
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

/**
 * Modal de conocimientos previos sobre Resumen.
 * Dos elecciones, sin navegación adicional hasta definir los recorridos de estudio.
 */
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
        overlayClassName="z-[125] bg-black/75 backdrop-blur-[3px]"
        className="z-[125] w-[calc(100%-1.5rem)] max-w-[1000px] gap-0 sm:max-w-[1000px] overflow-y-auto overscroll-contain rounded-[24px] border border-[#242424] bg-[#080808] p-0 text-[#F4F4F5] shadow-[0_30px_90px_rgba(0,0,0,0.55)] max-h-[calc(100dvh-1.5rem)]"
      >
        <div className="px-5 pb-7 pt-7 sm:px-8 sm:pb-8 sm:pt-8">
          <div className="flex items-center justify-between gap-4">
            <p className="text-[12px] font-bold uppercase tracking-[0.04em] text-[#CACACA] sm:text-[13px]">
              Tu punto de partida
            </p>
            <Sparkles className="size-5 shrink-0 text-[#3981FF]" aria-hidden="true" />
          </div>

          <DialogTitle ref={headingRef} tabIndex={-1} className="mt-7 text-left text-[23px] font-bold leading-tight tracking-[-0.025em] text-[#F4F4F5] outline-none sm:text-[25px]">
            ¿Cómo llegás a este material?
          </DialogTitle>
          <DialogDescription
            id="pdf-prior-study-description"
            className="mt-3 text-left text-[15px] leading-relaxed text-[#BFBFBF] sm:text-[17px]"
          >
            Contanos cuánto conocés del tema para recomendarte por dónde empezar.
          </DialogDescription>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              data-pdf-prior-study-no
              onClick={() => onChoose('not_studied')}
              className="group flex min-h-[138px] flex-col items-start rounded-[21px] border border-[#505050] bg-[#303030] px-4 py-4 text-left transition-colors hover:border-[#3B82F6] hover:bg-[#353535] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B82F6] sm:px-5 sm:py-5"
            >
              <BookOpen className="mb-4 size-5 text-[#3981FF]" strokeWidth={2} aria-hidden="true" />
              <span className="text-[18px] font-bold leading-6 text-[#EDEDED] sm:text-[19px]">
                Empiezo desde cero
              </span>
              <span className="mt-3 text-[13px] font-normal leading-5 text-[#CDCDCD] sm:text-[14px]">
                Quiero estudiar y entender el material, tema por tema.
              </span>
            </button>

            <button
              type="button"
              data-pdf-prior-study-yes
              onClick={() => onChoose('already_studied')}
              className="group flex min-h-[138px] flex-col items-start rounded-[21px] border border-[#505050] bg-[#303030] px-4 py-4 text-left transition-colors hover:border-[#3B82F6] hover:bg-[#353535] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B82F6] sm:px-5 sm:py-5"
            >
              <ClipboardCheck className="mb-4 size-5 text-[#3981FF]" strokeWidth={2} aria-hidden="true" />
              <span className="text-[18px] font-bold leading-6 text-[#EDEDED] sm:text-[19px]">
                Ya lo estudié
              </span>
              <span className="mt-3 text-[13px] font-normal leading-5 text-[#CDCDCD] sm:text-[14px]">
                Quiero practicar para comprobar cuánto sé.
              </span>
            </button>
          </div>

          <p className="mt-4 text-center text-[13px] leading-6 text-[#BDBDBD] sm:text-[14px]">
            También podés explorar el material libremente.
          </p>

          <div
            className="mx-auto mt-8 h-[9px] w-full max-w-[615px] rounded-full bg-[#303030]"
            aria-hidden="true"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
