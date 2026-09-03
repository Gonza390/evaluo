import { Sparkles } from 'lucide-react';

export function ExplorarStaticIntro() {
  return (
    <section className="border-b border-slate-200/80 py-7 sm:py-10">
      <div className="max-w-3xl">
        <div className="flex items-center gap-2 text-[11px] font-bold tracking-[0.18em] text-indigo-600 uppercase">
          <Sparkles className="h-3.5 w-3.5" />
          Explorar Evaluo
        </div>
        <h1 className="mt-3 text-[1.7rem] leading-[1.05] font-bold tracking-[-0.055em] text-slate-950 sm:mt-4 sm:text-[2.75rem]">
          Encontrá tu carrera y llegá directo a lo que necesitás estudiar.
        </h1>
        <p className="mt-3 max-w-2xl text-[13px] leading-6 text-slate-500 sm:text-base sm:leading-7">
          Buscá por universidad o carrera y entrá a tus materias, materiales y prácticas sin pasar
          por pantallas innecesarias.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-x-7 gap-y-2 border-t border-slate-200/80 pt-4 text-[11px] font-semibold text-slate-500 sm:text-xs">
        <span>
          <strong className="mr-1.5 text-slate-900">01</strong>
          Buscá
        </span>
        <span>
          <strong className="mr-1.5 text-slate-900">02</strong>
          Entrá a tu carrera
        </span>
        <span>
          <strong className="mr-1.5 text-slate-900">03</strong>
          Empezá a estudiar
        </span>
      </div>
    </section>
  );
}
