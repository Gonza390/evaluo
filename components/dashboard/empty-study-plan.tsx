import Link from 'next/link';
import Image from 'next/image';
import { Flag, Upload } from 'lucide-react';
import { StudyPlanExamCard } from '@/components/dashboard/study-plan-exam-card';

export function EmptyStudyPlan() {
  return (
    <main className="mx-auto w-full max-w-[1240px] px-3 py-3 text-[#0F1B3D] sm:px-4 sm:py-4 lg:px-6 lg:py-5">
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(310px,0.85fr)] lg:gap-5">
        <div className="min-w-0 space-y-5">
          <h1 className="mb-4 text-[20px] font-semibold tracking-[-0.035em] sm:text-[22px] lg:text-[24px]">Plan de estudio</h1>
          <section className="flex flex-col items-center gap-4 rounded-[18px] border border-[#E7EBF4] bg-[#F7FAFF] px-4 py-5 text-center sm:flex-row sm:px-5 sm:text-left">
            <Image src="/evi-bienvenida.svg" alt="" width={96} height={96} className="size-[76px] shrink-0 object-contain sm:size-[86px]"/>
            <div className="min-w-0 flex-1">
              <h2 className="text-[16px] font-semibold leading-snug tracking-[-0.025em] text-[#0F1B3D] sm:text-[17px]">Tu plan arranca con tu primer material</h2>
              <p className="mt-1 text-[12px] leading-[1.5] text-[#42506A]">Subí tu material y Evaluo ordena los temas por vos, para que sepas qué estudiar cada día.</p>
              <Link href="/dashboard/materiales/subir" className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 text-[12px] font-medium text-white hover:bg-[#1D4ED8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]"><Upload className="size-4" aria-hidden="true"/>Subir mi material</Link>
            </div>
          </section>
          <section aria-labelledby="plan-preview-title" className="min-w-0">
            <h2 id="plan-preview-title" className="text-[17px] font-medium tracking-[-0.025em]">Así se va a ver tu plan</h2>
            <p className="mt-1 text-[12px] text-[#66758D]">Tus temas, ordenados por fecha hasta el examen.</p>
            <ol className="mt-4 space-y-2.5">
              {[1,2,3].map((i)=><li key={i} className="flex items-start gap-3">
                <span className={`flex size-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold ${i===1?'border-[#2563EB] bg-white text-[#2563EB]':'border-dashed border-[#C9D8F1] text-[#7F8AA3]'}`}>{i}</span>
                <div className={`min-w-0 flex-1 rounded-2xl border border-[#E7EBF4] px-4 py-3 ${i===1?'bg-white':'bg-[#F9FAFC]'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[12px] font-medium text-[#42506A]">Tema {i}</span>
                    {i===1&&<span className="rounded-full bg-[#EEF2FF] px-2 py-0.5 text-[10px] text-[#2563EB]">Primer tema</span>}
                  </div>
                  <div aria-hidden="true" className="mt-2 h-1.5 w-4/5 rounded-full bg-[#E7EBF4]"/>
                  <div aria-hidden="true" className="mt-1.5 h-1.5 w-1/2 rounded-full bg-[#EFF2F7]"/>
                </div>
              </li>)}
              <li className="flex items-start gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-amber-300 bg-amber-50 text-amber-600"><Flag className="size-3.5" aria-hidden="true"/></span>
                <div className="flex min-h-10 min-w-0 flex-1 flex-wrap items-center gap-2 rounded-2xl border border-dashed border-amber-200 bg-amber-50 px-4 py-2 text-[11px]"><strong className="text-amber-800">Día del examen</strong><span className="text-amber-700">La fecha que elijas</span></div>
              </li>
            </ol>
          </section>
        </div>
        <aside className="min-w-0 space-y-5">
          <StudyPlanExamCard hasMaterials={false} />
          <section aria-labelledby="empty-plan-next-title" className="px-1">
            <h2 id="empty-plan-next-title" className="text-[15px] font-medium tracking-tight">Tu próximo paso</h2>
            <ol className="mt-3 space-y-3">
              {['Subí tu primer material','Elegí la fecha de tu examen','Seguí tu plan día a día'].map((label,i)=><li key={label} className="flex items-center gap-2.5 text-[12px] text-[#42506A]"><span className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-medium ${i===0?'bg-[#2563EB] text-white':'bg-[#EEF2F7] text-[#42506A]'}`}>{i+1}</span><span className={i===0?'font-semibold text-[#0F1B3D]':''}>{label}</span></li>)}
            </ol>
          </section>
        </aside>
      </div>
    </main>
  );
}
