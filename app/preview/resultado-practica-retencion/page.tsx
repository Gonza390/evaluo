import { ArrowRight, RotateCcw } from 'lucide-react';

export const metadata = {
  title: 'Vista previa de resultado de práctica | Evaluo',
  robots: { index: false, follow: false },
};

export default function PreviewPracticeResult() {
  return (
    <main className="min-h-screen bg-[#F5F7FB] px-4 py-12 sm:py-20">
      <section className="mx-auto max-w-xl rounded-2xl border border-[#E7EBF4] bg-white px-6 py-10 shadow-[0_18px_48px_rgba(15,27,61,0.04)] sm:px-12 sm:py-12">
        <header className="text-center">
          <p className="text-xs font-semibold tracking-[0.12em] text-[#4F5DFF] uppercase">
            Práctica terminada
          </p>
          <h1 className="mt-4 text-6xl font-bold tracking-[-0.07em] text-[#0F1B3D]">
            8 <span className="text-[#CBD5E1]">/ 10</span>
          </h1>
          <p className="mt-2 text-sm text-[#64748B]">respuestas correctas</p>
        </header>

        <section className="mt-9 border-t border-[#E7EBF4] pt-7">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-[#4F5DFF] uppercase">
            Tu próximo paso
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-[#0F1B3D]">
            Reforzar tipos de conocimiento
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#64748B]">
            Retomá este tema con una práctica breve y comprobá qué aprendiste.
          </p>
        </section>

        <div className="mt-8 space-y-3">
          <div className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#4F5DFF] px-5 text-sm font-semibold text-white">
            Continuar ahora <ArrowRight className="size-4" aria-hidden="true" />
          </div>
          <div className="flex min-h-12 w-full items-center justify-center rounded-xl border border-[#D5DCEB] bg-white px-5 text-sm font-semibold text-[#0F1B3D]">
            Continuar mañana
          </div>
          <p className="text-center text-xs text-[#64748B]">
            Si elegís mañana, el repaso queda guardado en Mi espacio.
          </p>
        </div>

        <details className="group mt-5 border-t border-[#E7EBF4] pt-4">
          <summary className="flex min-h-10 cursor-pointer list-none items-center justify-center gap-2 text-sm font-medium text-[#64748B]">
            Ver detalles y otras opciones
            <span aria-hidden="true" className="transition-transform group-open:rotate-180">⌄</span>
          </summary>
          <div className="space-y-5 pt-5">
            <div className="grid grid-cols-3 gap-3 border-b border-[#E7EBF4] pb-5">
              {[
                { name: 'Recordar', score: '3/3' },
                { name: 'Comprender', score: '3/4' },
                { name: 'Aplicar', score: '2/3' },
              ].map((item) => (
                <div key={item.name}>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[#64748B]">{item.name}</p>
                  <p className="mt-1 text-base font-semibold text-[#0F1B3D]">{item.score}</p>
                </div>
              ))}
            </div>
            <div>
              <p className="text-sm font-semibold text-[#0F1B3D]">Tema para repasar</p>
              <p className="mt-2 text-sm text-[#64748B]">Tipos de conocimiento</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex min-h-10 items-center rounded-lg border border-[#E7EBF4] px-4 text-sm font-semibold text-[#0F1B3D]">Ver mi progreso</span>
              <span className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#E7EBF4] px-4 text-sm font-semibold text-[#0F1B3D]"><RotateCcw className="size-4"/> Nueva práctica</span>
            </div>
          </div>
        </details>
      </section>
      <p className="mx-auto mt-5 max-w-xl text-center text-xs text-[#94A3B8]">
        Vista previa visual con datos de ejemplo. Los botones funcionan en la pantalla real, al terminar una práctica.
      </p>
    </main>
  );
}
