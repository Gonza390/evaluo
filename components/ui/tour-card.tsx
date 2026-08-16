'use client';

export function TourCard({
  title,
  description,
  stepIndex,
  totalSteps,
  onNext,
  onPrevious,
  onClose,
  className = '',
  nextLabel = 'Siguiente',
  finalLabel = 'Entendido',
}: {
  title: string;
  description: string;
  stepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  onClose: () => void;
  className?: string;
  nextLabel?: string;
  finalLabel?: string;
}) {
  return (
    <div
      className={`w-[320px] rounded-[26px] border border-border bg-card p-5 shadow-[0_24px_60px_rgba(15,23,42,0.18)] animate-saas-lift-in max-sm:w-auto max-sm:rounded-[24px] max-sm:p-4 ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-brand">
            Paso {stepIndex + 1} de {totalSteps}
          </p>
          <h3 className="mt-2 text-base font-bold text-foreground max-sm:text-[0.98rem]">{title}</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition hover:border-input hover:text-foreground max-sm:h-8 max-sm:w-8"
          aria-label="Cerrar guía"
        >
          ×
        </button>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand to-brand-2 transition-all duration-300"
          style={{ width: `${((stepIndex + 1) / totalSteps) * 100}%` }}
        />
      </div>

      <p className="mt-4 text-[0.95rem] leading-7 text-muted-foreground max-sm:text-[0.9rem] max-sm:leading-6">{description}</p>

      <div className="mt-5 flex items-center justify-between gap-2 max-sm:flex-col max-sm:items-stretch">
        <div className="flex items-center gap-2 max-sm:grid max-sm:grid-cols-2">
          <button
            type="button"
            onClick={onPrevious}
            disabled={stepIndex === 0}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground transition hover:border-input hover:bg-muted disabled:cursor-not-allowed disabled:opacity-45"
          >
            Anterior
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground transition hover:border-input hover:bg-muted"
          >
            Cerrar
          </button>
        </div>
        <button
          type="button"
          onClick={onNext}
          className="inline-flex h-10 items-center justify-center rounded-xl bg-gradient-to-r from-brand to-brand-2 px-4 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(37,99,235,0.18)] transition hover:opacity-95 max-sm:w-full"
        >
          {stepIndex === totalSteps - 1 ? finalLabel : nextLabel}
        </button>
      </div>
    </div>
  );
}
