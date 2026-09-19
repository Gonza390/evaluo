import { FileText, Sparkles } from 'lucide-react';

const previewLabels = [
  'Resumen',
  'Glosario',
  'Mapa mental',
  'Flashcards',
  'Práctica',
  'Diagnóstico',
] as const;

export function HomeStudyPreview() {
  return (
    <div
      className="animate-surface-reveal relative mx-auto w-full max-w-[620px]"
      style={{ animationDelay: '100ms' }}
      role="region"
      aria-label="Vista previa de herramientas de estudio sobre un mismo PDF"
    >
      <h2 className="sr-only">Vista previa de un PDF convertido en distintas formas de estudio</h2>
      <div className="absolute -inset-6 rounded-[40px] bg-gradient-to-br from-indigo-200/45 via-blue-100/20 to-transparent blur-3xl" />

      <div className="relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_26px_72px_rgba(15,23,42,0.14)]">
        <div className="h-0.5 bg-indigo-600" aria-hidden="true" />

        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:gap-4 sm:px-5">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
              <FileText className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-[8px] font-semibold tracking-[0.14em] text-slate-500 uppercase">
                Fuente activa
              </p>
              <p className="mt-0.5 truncate text-[11px] font-bold text-slate-900 sm:text-xs">
                Álgebra - Parcial 1.pdf
              </p>
            </div>
          </div>
          <span className="shrink-0 text-[9px] font-semibold text-slate-500">34 páginas</span>
        </div>

        <div className="bg-[linear-gradient(180deg,#ffffff_0%,#fbfdff_100%)] px-4 py-3.5 sm:px-6 sm:py-4">
          <div className="flex min-h-[250px] flex-col sm:min-h-[265px]">
            <div>
              <p className="text-[9px] font-bold tracking-[0.16em] text-indigo-700 uppercase">
                Resumen del mismo PDF
              </p>
              <h3 className="mt-1.5 text-lg font-bold tracking-[-0.025em] text-slate-950">
                Los temas clave, ordenados para repasar
              </h3>
              <p className="mt-1.5 max-w-[500px] text-[10px] leading-4 text-slate-600">
                El material sigue siendo la fuente mientras cambiás de una forma de estudio a otra.
              </p>
            </div>

            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200/90 bg-white/80">
              {[
                ['01', 'Sistemas de ecuaciones', 'Métodos, interpretación y resolución.'],
                ['02', 'Matrices', 'Tipos, operaciones y producto matricial.'],
                ['03', 'Vectores', 'Combinación y dependencia lineal.'],
              ].map(([number, title, description], index) => (
                <div
                  key={title}
                  className={`flex items-start gap-3 px-3.5 py-2.5 ${index > 0 ? 'border-t border-slate-100' : ''}`}
                >
                  <span className="pt-0.5 text-[9px] font-black text-indigo-700">{number}</span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-slate-900">{title}</p>
                    <p className="mt-0.5 text-[9px] leading-4 text-slate-600">{description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-auto pt-3">
              <div className="flex items-start gap-2 rounded-xl bg-indigo-50/80 px-3.5 py-2.5 text-indigo-950">
                <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-indigo-700" aria-hidden="true" />
                <p className="min-w-0 text-[9px] leading-4">
                  <strong>Idea clave:</strong> para multiplicar matrices, las columnas de la primera deben coincidir con las filas de la segunda.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 bg-slate-50/70 px-3 py-3 sm:px-4">
          <p className="text-[9px] font-semibold text-slate-600">
            Desde este mismo PDF:
          </p>
          <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-3" aria-label="Herramientas disponibles">
            {previewLabels.map((label, index) => (
              <span
                key={label}
                className={`rounded-lg border px-2 py-1.5 text-center text-[8px] font-bold sm:text-[9px] ${
                  index === 0
                    ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
