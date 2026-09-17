import { Loader2 } from 'lucide-react';

/** Ship G — clear Procesando badge for materials still processing. */
export function MaterialProcessingBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border border-amber-200/80 bg-amber-50 px-2 py-0.5 text-[12px] font-semibold text-amber-800"
      title="Estamos preparando resumen, glosario y ejercicios"
      aria-label="Procesando"
    >
      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
      Procesando
    </span>
  );
}
