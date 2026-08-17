import { Sparkles } from 'lucide-react';

export function ExplorarStaticIntro() {
 return (
 <section className="surface-panel animate-surface-reveal overflow-hidden px-4 py-4 sm:px-6 sm:py-7">
 <div className="max-w-3xl">
 <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-[12px] font-bold uppercase tracking-[0.18em] text-indigo-600">
 <Sparkles className="h-3.5 w-3.5" />
 Explorar Evaluo
 </div>
 <h1 className="mt-3 text-[1.5rem] font-bold tracking-[-0.05em] text-slate-950 sm:mt-4 sm:text-[2.6rem]">
 Encuentra tu universidad o tu carrera y entra más rápido a estudiar.
 </h1>
 <p className="mt-2 max-w-2xl text-[13px] leading-6 text-slate-500 sm:mt-3 sm:text-base sm:leading-7">
 Reunimos todas las universidades y todas las carreras en una sola vista para que
 encuentres tu camino sin pasos innecesarios. Buscá, entrá y llegá antes a tus
 materias, resúmenes y simuladores.
 </p>
 </div>

 <div className="mt-4 grid gap-3 lg:grid-cols-2">
 <div className="rounded-[var(--radius-card)] border border-indigo-100 bg-indigo-50/70 px-4 py-3.5">
 <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-indigo-600">
 Entrá más rápido
 </p>
 <p className="mt-1.5 text-[13px] leading-5 text-slate-700 sm:text-sm sm:leading-6">
 Si ya sabés tu carrera, entrá directo a sus materias y evitá pasar por pantallas
 intermedias.
 </p>
 </div>
 <div className="rounded-[var(--radius-card)] border border-slate-200 bg-white px-4 py-3.5">
 <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-slate-500">
 Aprovecha lo más completo
 </p>
 <p className="mt-1.5 text-[13px] leading-5 text-slate-700 sm:text-sm sm:leading-6">
 Te destacamos universidades y carreras con más contenido para que el valor se vea
 desde el primer click.
 </p>
 </div>
 </div>
 </section>
 );
}
