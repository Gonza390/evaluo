'use client';

import { useRef } from 'react';
import { ArrowRight, BookOpenText, ClipboardCheck, Lightbulb, Sparkles, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';

type Props = {
  open: boolean;
  firstTopicTitle: string | null;
  onStart: () => void;
  onDismiss: () => void;
};

/**
 * Pantalla introductoria del recorrido "Empiezo desde cero".
 * Explica cómo estudiar sin introducir nuevas herramientas o etapas obligatorias.
 */
export function PdfStudyStartGuide({ open, firstTopicTitle, onStart, onDismiss }: Props) {
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
        overlayClassName="z-[135] bg-[#F5F7FB]"
        className="z-[135] !fixed !inset-0 !top-0 !left-0 !h-dvh !w-screen !max-w-none !translate-x-0 !translate-y-0 !gap-0 !overflow-y-auto !overscroll-contain !rounded-none !border-0 !bg-[#F5F7FB] !p-0 !shadow-none sm:!max-w-none"
      >
        <div className="flex min-h-full flex-col">
          <header className="border-b border-[#E7EBF4] bg-white">
            <div className="mx-auto flex w-full max-w-[960px] items-center justify-between px-5 py-3.5 sm:px-8">
              <div className="flex items-center gap-2.5">
                <img src="/evaluo-logo-icono.svg" alt="" className="size-8 object-contain" />
                <span className="text-[20px] font-extrabold tracking-[-0.055em] text-[#032269]">evalu<span className="text-[#0546F3]">o</span></span>
              </div>
              <button type="button" onClick={onDismiss} aria-label="Volver al resumen" className="flex size-9 items-center justify-center rounded-full text-[#7F8AA3] transition hover:bg-[#F5F7FB] hover:text-[#0F1B3D] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F5DFF]">
                <X className="size-[18px]" aria-hidden="true" />
              </button>
            </div>
          </header>

          <main className="mx-auto flex w-full max-w-[760px] flex-1 flex-col justify-center px-5 py-7 sm:px-8 sm:py-9">
            <div className="rounded-[24px] border border-[#E7EBF4] bg-white px-5 py-6 shadow-[0_20px_65px_rgba(15,27,61,0.06)] sm:px-9 sm:py-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#EEF2FF] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#4F5DFF]">
                <Sparkles className="size-[14px]" aria-hidden="true" />
                Tu guía de estudio
              </div>

              <DialogTitle ref={headingRef} tabIndex={-1} className="mt-4 text-[24px] font-extrabold leading-tight tracking-[-0.045em] text-[#0F1B3D] outline-none sm:text-[29px]">
                ¡Vamos a comenzar a estudiar!
              </DialogTitle>
              <DialogDescription id="pdf-study-start-description" className="mt-2 max-w-[59ch] text-[13px] leading-[1.65] text-[#65738C] sm:text-[14px]">
                Te vamos a acompañar para que entiendas el material, recuerdes los conceptos importantes y compruebes lo que aprendiste.
              </DialogDescription>

              <div className="mt-6 space-y-4 border-t border-[#E7EBF4] pt-5 sm:space-y-5">
                <div className="flex items-start gap-3.5">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-[#EEF2FF] text-[#4F5DFF]">
                    <BookOpenText className="size-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <h2 className="text-[14px] font-bold text-[#0F1B3D]">Primero, leé el resumen</h2>
                    <p className="mt-1 text-[12.5px] leading-[1.6] text-[#65738C]">
                      Vamos a comenzar con el primer tema de tu PDF. Leé el resumen para comprender sus conceptos e ideas principales.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-[#EEF2FF] text-[#4F5DFF]">
                    <Lightbulb className="size-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <h2 className="text-[14px] font-bold text-[#0F1B3D]">Apoyate en tus herramientas</h2>
                    <p className="mt-1 text-[12.5px] leading-[1.6] text-[#65738C]">
                      En el glosario podés consultar los términos que no entiendas. También tenés flashcards para repasar y recordar lo más importante.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-[#EEF2FF] text-[#4F5DFF]">
                    <ClipboardCheck className="size-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <h2 className="text-[14px] font-bold text-[#0F1B3D]">Después, comprobá lo aprendido</h2>
                    <p className="mt-1 text-[12.5px] leading-[1.6] text-[#65738C]">
                      Cuando termines de estudiar, vas a poder practicar con preguntas de ese tema y descubrir qué necesitás reforzar.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-[16px] border border-[#DCE5FF] bg-[#F4F7FF] px-4 py-4 sm:px-5">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#4F5DFF]">
                  {hasFirstTopic ? 'Vamos a empezar por' : 'Tu primer paso'}
                </p>
                <p data-pdf-study-first-topic className="mt-1.5 break-words text-[15px] font-bold leading-snug text-[#0F1B3D]">
                  {hasFirstTopic ? firstTopicTitle : 'Leé el resumen de tu material'}
                </p>
                <button type="button" data-pdf-study-start-cta onClick={onStart} className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#4F5DFF] px-4 py-2.5 text-[13px] font-bold text-white transition hover:bg-[#3948ED] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F5DFF] sm:w-auto sm:min-w-[245px]">
                  {hasFirstTopic ? 'Comenzar con este tema' : 'Ir al resumen'}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </main>
        </div>
      </DialogContent>
    </Dialog>
  );
}
