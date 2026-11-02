import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

/** Misma tarjeta de acceso al plan con o sin documentos: sin calendario deshabilitado. */
export function StudyPlanExamCard({ hasMaterials, hasSavedPlan = false }: { hasMaterials: boolean; hasSavedPlan?: boolean }) {
  return (
    <section className="relative min-h-[210px] overflow-hidden rounded-[18px] bg-[#eaf1ff] px-4 py-6 text-[#143c85] sm:min-h-[218px] sm:px-5 sm:py-7">
    <div className="absolute -right-6 -top-6 size-36 rounded-full bg-blue-200/50 blur-2xl" />
    <div className="relative flex min-h-[162px] items-center gap-2.5">
    <div className="min-w-0 flex-1">
    <div className="flex items-center gap-2 text-xs font-medium text-blue-700"><Sparkles className="size-4" /> Prepará tu examen</div>
    <h2 className="mt-2 text-[18px] font-medium leading-[1.15] tracking-[-0.04em] sm:text-[19px]">Tu estudio, organizado hasta el examen.</h2>
    <p className="mt-2 text-[12px] leading-[18px] text-[#5473a2]">Elegí la fecha para organizar tus temas y prácticas.</p>
    <Link href={hasMaterials ? "/dashboard/plan-de-estudio/preparar" : "/dashboard/materiales/subir"} className="mt-2.5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-[12px] font-medium text-white transition hover:bg-blue-700">{hasSavedPlan ? "Continuar mi plan" : hasMaterials ? "Armar mi plan" : "Subir mi primer PDF"} <ArrowRight className="size-4" /></Link>
    </div>
    <div aria-hidden="true" className="relative hidden h-[116px] w-[90px] shrink-0 items-center justify-center min-[420px]:flex sm:h-[132px] sm:w-[100px]">
    <div className="absolute inset-2 rotate-6 rounded-xl bg-[#c9dcff]/55" />
    <div className="relative flex h-[110px] w-[82px] -rotate-3 flex-col rounded-[10px] border border-[#bad0f3] bg-white/95 px-3 pt-4 shadow-[0_8px_22px_rgba(33,79,151,0.12)] sm:h-[124px] sm:w-[92px]">
    <div className="mb-3 h-1.5 w-10 rounded-full bg-[#4f5dff]/65" />
    <div className="mb-1.5 h-1 w-full rounded-full bg-[#d8e3f5]" />
    <div className="mb-1.5 h-1 w-4/5 rounded-full bg-[#d8e3f5]" />
    <div className="mb-3 h-1 w-11/12 rounded-full bg-[#d8e3f5]" />
    <div className="flex items-center gap-1.5">
    <div className="flex size-3.5 shrink-0 items-center justify-center rounded-[4px] bg-[#e4edff] text-[#4f5dff]"><span className="text-[10px] leading-none">✓</span></div>
    <div className="h-1 w-8 rounded-full bg-[#afc5ea]" />
    </div>
    <div className="mt-2 flex items-center gap-1.5">
    <div className="size-3.5 shrink-0 rounded-[4px] border border-[#c5d6ef]" />
    <div className="h-1 w-7 rounded-full bg-[#d8e3f5]" />
    </div>
    </div>
    </div>
    </div>
    </section>
  );
}
