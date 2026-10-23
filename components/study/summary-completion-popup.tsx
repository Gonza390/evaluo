'use client';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
  ClipboardCheck,
  Crown,
  Map as MapIcon,
  RotateCcw,
  Sparkles,
  SquareLibrary,
  X,
} from 'lucide-react';

type ReviewTab = 'tarjetas' | 'glosario' | 'mapa';

type Props = {
  open: boolean;
  pendingCount: number;
  isPremium: boolean;
  onClose: () => void;
  onPractice: () => void;
  onErrors: () => void;
  onReview: (tab: ReviewTab) => void;
};

export function SummaryCompletionPopup({
  open,
  pendingCount,
  isPremium,
  onClose,
  onPractice,
  onErrors,
  onReview,
}: Props) {
  const hasPending = pendingCount > 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        aria-labelledby="summary-completion-title"
        overlayClassName="z-[125] bg-foreground/45 backdrop-blur"
        className="border-border bg-background top-auto bottom-3 z-[125] max-h-[calc(100dvh-1.5rem)] w-[calc(100%-1.5rem)] max-w-[540px] translate-y-0 overflow-y-auto overscroll-contain rounded-2xl p-0 [overflow-wrap:anywhere] sm:top-1/2 sm:bottom-auto sm:max-w-[540px] sm:-translate-y-1/2"
      >
        <div className="px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-primary text-[10.5px] font-extrabold tracking-[0.15em] uppercase">
                Siguiente paso
              </p>
              <DialogTitle asChild>
                <h2
                  id="summary-completion-title"
                  className="text-foreground mt-1.5 text-[18px] leading-6 font-bold tracking-[-0.04em] sm:text-[18px]"
                >
                  Terminaste el resumen
                </h2>
              </DialogTitle>
              <p className="text-muted-foreground mt-2 text-[13.5px] leading-6">
                Ya recorriste los temas principales de este PDF. Comprobá cuánto aprendiste con
                preguntas generadas a partir del material que acabás de estudiar.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="text-muted-foreground hover:text-foreground inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-6 rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4 sm:p-5 dark:border-indigo-400/25 dark:bg-indigo-950/25">
            <div className="flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/60 dark:text-indigo-300">
                <ClipboardCheck className="size-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h3 className="text-foreground text-[15px] font-bold">Practicá con tu PDF</h3>
                <p className="text-muted-foreground mt-1 text-[13px] leading-5">
                  Respondé ejercicios creados a partir de este mismo material y descubrí qué conceptos conviene reforzar.
                </p>
              </div>
            </div>
            <button
              type="button"
              data-summary-practice-cta
              onClick={onPractice}
              className="bg-primary hover:bg-primary/90 focus-visible:ring-ring mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-white transition focus-visible:ring-2 focus-visible:ring-offset-2"
            >
              Comenzar práctica
              <ClipboardCheck className="size-4" aria-hidden="true" />
            </button>
          </div>

          {hasPending ? (
            <div className="border-border mt-3 rounded-xl border bg-card p-4">
              <p className="text-foreground text-[13px] font-semibold">
                También tenés {pendingCount} {pendingCount === 1 ? 'tema pendiente' : 'temas pendientes'} para reforzar
              </p>
              <p className="text-muted-foreground mt-1 text-xs leading-5">
                Podés revisarlos ahora o hacer una nueva práctica.
              </p>
              <button
                type="button"
                onClick={onErrors}
                className="border-border text-foreground hover:bg-muted mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border px-4 text-[13px] font-semibold transition"
              >
                <RotateCcw className="size-4" aria-hidden="true" />
                Reforzar mis errores
              </button>
            </div>
          ) : null}

          <div className="mt-6 border-t border-slate-100 pt-4">
            <p className="text-muted-foreground text-[11px] font-bold tracking-[0.1em] uppercase">
              ¿Querés repasar antes?
            </p>

            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => onReview('tarjetas')}
                className="border-border bg-card text-foreground hover:bg-muted flex min-h-12 items-center gap-2.5 rounded-lg border px-3.5 text-left text-[13px] font-semibold transition hover:border-slate-300"
              >
                <Sparkles className="text-primary h-4 w-4 shrink-0" />
                Flashcards
              </button>

              <button
                type="button"
                onClick={() => onReview('glosario')}
                className="border-border bg-card text-foreground hover:bg-muted flex min-h-12 items-center gap-2.5 rounded-lg border px-3.5 text-left text-[13px] font-semibold transition hover:border-slate-300"
              >
                <SquareLibrary className="text-primary h-4 w-4 shrink-0" />
                Glosario
              </button>

              <button
                type="button"
                onClick={() => onReview('mapa')}
                className="border-border bg-card text-foreground hover:bg-muted flex min-h-12 items-center justify-between gap-2.5 rounded-lg border px-3.5 text-left text-[13px] font-semibold transition hover:border-slate-300"
              >
                <span className="inline-flex min-w-0 items-center gap-2.5">
                  <MapIcon className="text-primary h-4 w-4 shrink-0" />
                  <span>Mapa mental</span>
                </span>
                {!isPremium ? <Crown className="h-3.5 w-3.5 shrink-0 text-amber-500" /> : null}
              </button>
            </div>
          </div>
          <p className="text-muted-foreground mt-4 text-center text-[11px] leading-5">
            Podés cerrar esta ventana y volver al resumen cuando quieras.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
