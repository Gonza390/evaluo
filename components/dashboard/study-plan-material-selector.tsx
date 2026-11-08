'use client';
import { useRouter } from 'next/navigation';
import { useOptionalAppLocale } from '@/components/i18n/app-locale-provider';
export function StudyPlanMaterialSelector({selectedId,materials}:{selectedId:string;materials:Array<{id:string;title:string}>}) {
 const router=useRouter();
 const english = useOptionalAppLocale() === 'en';
 return <label className="flex items-center gap-2 text-[11px] text-slate-500">
  <span className="sr-only">{english ? 'Choose PDF' : 'Elegir PDF'}</span>
  <select aria-label={english ? "Choose PDF for study plan" : "Elegir PDF para el plan"} value={selectedId} onChange={event=>router.push(`/dashboard/plan-de-estudio?material=${encodeURIComponent(event.target.value)}`)} className="min-w-0 max-w-[min(58vw,230px)] border-0 bg-transparent px-0 py-1 text-[12px] font-medium text-[#42506A] shadow-none outline-none hover:text-[#456DBD] focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-[#456DBD]/30">
   {materials.map(material=><option key={material.id} value={material.id}>{material.title}</option>)}
  </select>
 </label>;
}
