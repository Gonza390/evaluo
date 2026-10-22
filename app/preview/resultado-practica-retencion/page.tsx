import { CheckCircle2, CalendarDays, BookmarkCheck, RotateCcw } from 'lucide-react';
export const metadata = { title: 'Vista previa del resultado de práctica | Evaluo', robots: { index: false, follow: false } };
export default function PreviewPracticeResult() {
 return <main className="min-h-screen bg-[#F5F7FB] px-4 py-10">
  <section className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 sm:p-9">
    <p className="text-xs font-bold tracking-widest text-[#4F5DFF] uppercase">Práctica completada</p>
    <div className="mt-3 flex items-end gap-4"><h1 className="text-4xl font-bold text-[#0F1B3D]">80%</h1><p className="pb-1 text-sm text-slate-500">8 de 10 respuestas consolidadas</p></div>
    <div className="mt-6 grid grid-cols-3 gap-4 border-y py-5">
      <div><p className="text-xs text-slate-500">RECORDAR</p><p className="font-bold">3/3</p></div>
      <div><p className="text-xs text-slate-500">COMPRENDER</p><p className="font-bold">3/4</p></div>
      <div><p className="text-xs text-slate-500">APLICAR</p><p className="font-bold">2/3</p></div>
    </div>
    <div className="border-b py-5"><h2 className="font-semibold">Temas para repasar</h2><p className="mt-2 text-sm text-slate-700">• Tipos de conocimiento</p></div>
    <div className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50 p-5">
      <p className="text-xs font-bold tracking-widest text-[#4F5DFF] uppercase">Tu próximo objetivo</p>
      <h2 className="mt-3 text-xl font-bold text-[#0F1B3D]">Reforzar: Tipos de conocimiento</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">Volvé a comprobar los conceptos que te costaron en esta práctica.</p>
      <p className="mt-3 flex items-center gap-2 text-xs text-slate-500"><CalendarDays className="size-4"/> Repaso sugerido: dentro de 3 días</p>
      <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-[#4F5DFF]"><BookmarkCheck className="size-4"/> Guardado en Mi espacio para tu próxima visita</p>
    </div>
    <div className="mt-6 flex flex-wrap gap-3">
      <span className="inline-flex min-h-11 items-center rounded-lg border px-4 text-sm font-semibold">Ver mi progreso</span>
      <span className="inline-flex min-h-11 items-center gap-2 rounded-lg border px-4 text-sm font-semibold"><CheckCircle2 className="size-4"/> Terminar por hoy</span>
      <span className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#4F5DFF] px-4 text-sm font-semibold text-white"><RotateCcw className="size-4"/> Nueva práctica</span>
    </div>
    <p className="mt-8 text-xs text-slate-400">Vista previa ilustrativa con datos de ejemplo; no muestra resultados de un usuario real.</p>
  </section>
 </main>;
}
