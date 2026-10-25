'use client';

import { useRef } from 'react';
import { ArrowRight, BookOpenText, ClipboardCheck, Lightbulb, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';

type Props = {
  open: boolean;
  firstTopicTitle: string | null;
  onStart: () => void;
  onDismiss: () => void;
};

/**
 * Guía breve que se superpone al Resumen, con el mismo patrón del popup anterior.
 * Tras elegir "Empiezo desde cero", orienta al alumno antes de abrir el tema 1.
 */
export function PdfStudyStartGuide({ open, firstTopicTitle, onStart, onDismiss }: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const hasFirstTopic = Boolean(firstTopicTitle?.trim());

  const steps = [
    {
      title: 'Primero, leé el resumen',
      description: 'Vamos a comenzar con el primer tema de tu PDF. Leé el resumen para comprender sus conceptos e ideas principales.',
      Icon: BookOpenText,
    },
    {
      title: 'Apoyate en tus herramientas',
      description: 'En el glosario podés consultar los términos que no entiendas. También tenés flashcards para repasar y recordar lo más importante.',
      Icon: Lightbulb,
    },
    {
      title: 'Después, comprobá lo aprendido',
      description: 'Cuando termines de estudiar, vas a poder practicar con preguntas de ese tema y descubrir qué necesitás reforzar.',
      Icon: ClipboardCheck,
    },
  ] as const;

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
            ¡Vamos a comenzar a estudiar!
          </DialogTitle>
          <DialogDescription id="pdf-study-start-description" className="text-muted-foreground mt-1.5 text-left text-[12.5px] leading-5">
            Te vamos a acompañar para que entiendas el material, recuerdes los conceptos importantes y compruebes lo que aprendiste.
          </DialogDescription>

          <div className="border-border mt-4 space-y-3 border-t pt-4">
            {steps.map(({ title, description, Icon }) => (
              <div key={title} className="flex items-start gap-3">
                <span className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg" aria-hidden="true">
                  <Icon className="size-[17px]" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-foreground text-[13px] font-semibold leading-5">{title}</h2>
                  <p className="text-muted-foreground mt-0.5 text-[12px] leading-[1.45]">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div data-pdf-study-start-footer className="border-border bg-card shrink-0 border-t px-5 py-4 sm:px-6">
          <p className="text-primary text-[10px] font-bold uppercase tracking-[0.12em]">Vamos a empezar por</p>
          <p data-pdf-study-first-topic className="text-foreground mt-1 break-words text-[13px] font-bold leading-5">
            {hasFirstTopic ? firstTopicTitle : 'El resumen de tu material'}
          </p>
          <button type="button" data-pdf-study-start-cta onClick={onStart} className="bg-primary hover:bg-primary/90 focus-visible:outline-primary mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-[13px] font-semibold text-white transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
            {hasFirstTopic ? 'Comenzar con este tema' : 'Ir al resumen'}
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
