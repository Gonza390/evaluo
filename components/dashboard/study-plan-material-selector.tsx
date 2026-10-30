'use client';
import { useRouter } from 'next/navigation';
export function StudyPlanMaterialSelector({selectedId,materials}:{selectedId:string;materials:Array<{id:string;title:string}>}) {
 const router=useRouter();
 return <label className="flex items-center gap-2 text-[11px] text-slate-500">
  <span className="sr-only">Elegir PDF</span>
  <select aria-label="Elegir PDF para el plan" value={selectedId} onChange={event=>router.push(`/dashboard/plan-de-estudio?material=${encodeURIComponent(event.target.value)}`)} className="min-w-0 max-w-[min(58vw,230px)] rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[12px] font-medium text-slate-700">
   {materials.map(material=><option key={material.id} value={material.id}>{material.title}</option>)}
  </select>
 </label>;
}
