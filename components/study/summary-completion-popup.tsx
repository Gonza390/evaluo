'use client';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
  BrainCircuit,
  Crown,
  Map as MapIcon,
  RotateCcw,
  Sparkles,
  SquareLibrary,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type ReviewTab = 'tarjetas' | 'glosario' | 'mapa';

type Props = {
  open: boolean;
  pendingCount: number;
  isPremium: boolean;
  onClose: () => void;
  onSimulator: () => void;
  onErrors: () => void;
  onReview: (tab: ReviewTab) => void;
};

export function SummaryCompletionPopup({
  open,
  pendingCount,
  isPremium,
  onClose,
  onSimulator,
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
        className="border-border bg-background top-auto bottom-3 z-[125] max-h-[calc(100dvh-1.5rem)] w-[calc(100%-1.5rem)] max-w-[540px] translate-y-0 overflow-y-auto overscroll-contain rounded-[24px] p-0 [overflow-wrap:anywhere] sm:top-1/2 sm:bottom-auto sm:max-w-[540px] sm:-translate-y-1/2"
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
                  className="mt-1.5 text-[1.35rem] leading-tight font-bold tracking-[-0.04em] text-slate-950 sm:text-[1.55rem]"
                >
                  Terminaste el resumen
                </h2>
              </DialogTitle>
              <p className="mt-2 text-[13.5px] leading-6 text-slate-600">
                {hasPending
                  ? `Antes de seguir, tenés ${pendingCount} ${pendingCount === 1 ? 'tema' : 'temas'} para reforzar.`
                  : 'Ya recorriste los temas principales de este PDF. Ahora podés ponerte a prueba.'}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
            {hasPending ? (
              <button
                type="button"
                onClick={onErrors}
                className="bg-primary hover:bg-primary/90 inline-flex min-h-11 items-center justify-center gap-2 rounded-[13px] px-4 text-sm font-semibold text-white transition"
              >
                <RotateCcw className="h-4 w-4" />
                Reforzar mis errores
              </button>
            ) : null}

            <button
              type="button"
              onClick={onSimulator}
              className={cn(
                'inline-flex min-h-11 items-center justify-center gap-2 rounded-[13px] px-4 text-sm font-semibold transition',
                hasPending
                  ? 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  : 'bg-primary hover:bg-primary/90 text-white sm:col-span-2'
              )}
            >
              <BrainCircuit className="h-4 w-4" />
              Hacer simulador
            </button>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-4">
            <p className="text-[11px] font-bold tracking-[0.1em] text-slate-400 uppercase">
              ¿Querés repasar antes?
            </p>

            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => onReview('tarjetas')}
                className="flex min-h-12 items-center gap-2.5 rounded-[13px] border border-slate-200 bg-white px-3.5 text-left text-[13px] font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <Sparkles className="text-primary h-4 w-4 shrink-0" />
                Flashcards
              </button>

              <button
                type="button"
                onClick={() => onReview('glosario')}
                className="flex min-h-12 items-center gap-2.5 rounded-[13px] border border-slate-200 bg-white px-3.5 text-left text-[13px] font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <SquareLibrary className="text-primary h-4 w-4 shrink-0" />
                Glosario
              </button>

              <button
                type="button"
                onClick={() => onReview('mapa')}
                className="flex min-h-12 items-center justify-between gap-2.5 rounded-[13px] border border-slate-200 bg-white px-3.5 text-left text-[13px] font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <span className="inline-flex min-w-0 items-center gap-2.5">
                  <MapIcon className="text-primary h-4 w-4 shrink-0" />
                  <span>Mapa mental</span>
                </span>
                {!isPremium ? <Crown className="h-3.5 w-3.5 shrink-0 text-amber-500" /> : null}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
