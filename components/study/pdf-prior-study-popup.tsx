'use client';

import { BookOpenText, CheckCircle2 } from 'lucide-react';
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
 * Pregunta breve al entrar por primera vez al Resumen de un PDF recién procesado.
 * La respuesta no redirige: el recorrido posterior se definirá por separado.
 */
export function PdfPriorStudyPopup({ open, onChoose, onDismiss }: Props) {
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onDismiss();
      }}
    >
      <DialogContent
        data-pdf-prior-study-popup
        showCloseButton={false}
        overlayClassName="z-[125] bg-[#0F1B3D]/55 backdrop-blur-[3px]"
        className="z-[125] w-[calc(100%-2rem)] max-w-[460px] gap-0 overflow-hidden rounded-[24px] border border-[#E1E9FF] bg-white p-0 shadow-[0_30px_90px_rgba(15,27,61,0.22)]"
      >
        <div className="bg-[linear-gradient(135deg,#EFF3FF_0%,#FFFFFF_70%,#F5F4FF_100%)] px-5 pb-5 pt-7 text-center sm:px-7 sm:pb-6">
          <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[#E3EAFF] text-[#4F5DFF]">
            <BookOpenText className="size-6" aria-hidden="true" />
          </span>
          <p className="mt-4 text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#4F5DFF]">
            Tu punto de partida
          </p>
          <DialogTitle className="mt-2 text-[21px] font-extrabold leading-[1.2] tracking-[-0.035em] text-[#0F1B3D] sm:text-[24px]">
            ¿Ya estudiaste este material?
          </DialogTitle>
          <DialogDescription className="mx-auto mt-2 max-w-[32ch] text-[13px] leading-5 text-[#6B7690]">
            Elegí una opción para continuar con tu PDF.
          </DialogDescription>
        </div>
        <div className="grid gap-3 px-5 pb-6 sm:grid-cols-2 sm:px-7 sm:pb-7">
          <button
            type="button"
            data-pdf-prior-study-no
            onClick={() => onChoose('not_studied')}
            className="group flex min-h-[96px] flex-col items-center justify-center gap-2 rounded-2xl border border-[#A8BEFC] bg-[#EDF3FF] px-4 py-4 text-center text-[14px] font-bold text-[#234BBA] transition hover:border-[#4F5DFF] hover:bg-[#E4ECFF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F5DFF]"
          >
            <BookOpenText className="size-6 text-[#4F5DFF]" aria-hidden="true" />
            No estudié
          </button>
          <button
            type="button"
            data-pdf-prior-study-yes
            onClick={() => onChoose('already_studied')}
            className="group flex min-h-[96px] flex-col items-center justify-center gap-2 rounded-2xl border border-[#E0E6F2] bg-white px-4 py-4 text-center text-[14px] font-bold text-[#243759] transition hover:border-[#4F5DFF] hover:bg-[#F6F8FF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F5DFF]"
          >
            <CheckCircle2 className="size-6 text-[#6366F1]" aria-hidden="true" />
            Sí estudié
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
