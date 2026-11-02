'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { distributeStudyTopics } from '@/lib/student-materials/study-plan-distribution';
import { ArrowLeft, ArrowRight, CalendarDays, Check, Clock3, FileText, BookOpen, Layers3, ListChecks, Brain } from 'lucide-react';

type Material = { id: string; title: string; topicCount: number; topics: Array<{title:string;estimatedMinutes:number}> };
const methods = [
  { id:'entender', title:'Entenderla bien', subtitle:'Resúmenes y conceptos', icon:BookOpen, tone:'bg-[#EEF2FF]', iconTone:'bg-[#DCE7FF] text-[#2563EB]' },
  { id:'memorizar', title:'Memorizarla', subtitle:'Flashcards y repasos', icon:Layers3, tone:'bg-[#E7F5EC]', iconTone:'bg-[#D3EEDD] text-[#338458]' },
  { id:'practicar', title:'Practicar preguntas', subtitle:'Preguntas y simulacros', icon:ListChecks, tone:'bg-[#FFF0E6]', iconTone:'bg-[#FFE0CA] text-[#B86A36]' },
  { id:'casos', title:'Resolver casos', subtitle:'Aplicar lo aprendido', icon:Brain, tone:'bg-[#F1EBFF]', iconTone:'bg-[#E4D9FF] text-[#7657B8]' },
];
const week = ['L','M','X','J','V','S','D'];
const pad = (n:number) => String(n).padStart(2,'0');
const localDate = (date:Date) => `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`;
export function StudyPlanSetup({ materials }: { materials:Material[] }) {
  const today = useMemo(()=>new Date(),[]);
  const [step,setStep] = useState(0);
  const [month,setMonth] = useState(new Date(today.getFullYear(),today.getMonth(),1));
  const [exam,setExam] = useState('');
  const [selected,setSelected] = useState<string[]>([]);
  const [minutes,setMinutes] = useState<number|null>(null);
  const [preferences,setPreferences] = useState<string[]>(['entender','practicar']);
  const [preview,setPreview] = useState(false);
  const selectable = step===0 ? !!exam : step===1 ? selected.length>0 : step===2 ? minutes!==null : preferences.length>0;
  const monthLabel = new Intl.DateTimeFormat('es-AR',{month:'long',year:'numeric'}).format(month);
  const daysInMonth = new Date(month.getFullYear(),month.getMonth()+1,0).getDate();
  const offset = (new Date(month.getFullYear(),month.getMonth(),1).getDay()+6)%7;
  const currentMonth = month.getFullYear()===today.getFullYear() && month.getMonth()===today.getMonth();
  const chosen = materials.filter(m=>selected.includes(m.id));
  const topics = chosen.flatMap(material=>material.topics.map(topic=>({...topic,materialId:material.id,materialTitle:material.title})));
  const distribution = distributeStudyTopics(topics,exam,minutes??0,today);
  const toggle = (list:string[],id:string,save:(x:string[])=>void) => save(list.includes(id) ? list.filter(x=>x!==id) : [...list,id]);
  return <main className="mx-auto w-full max-w-[1240px] px-3 py-3 text-[#0F1B3D] sm:px-4 sm:py-4 lg:px-6 lg:py-5">
    <div className="relative mx-auto max-w-[500px]">
      {!preview && (step===0
        ? <Link href="/dashboard/plan-de-estudio" className="absolute right-0 top-0 z-10 inline-flex min-h-8 items-center gap-1 rounded-lg px-2 text-[12px] font-medium text-[#42506A] hover:bg-[#EEF2FF] hover:text-[#2563EB]"><ArrowLeft className="size-3.5"/> Volver</Link>
        : <button type="button" onClick={()=>setStep(s=>s-1)} className="absolute right-0 top-0 z-10 inline-flex min-h-8 items-center gap-1 rounded-lg px-2 text-[12px] font-medium text-[#42506A] hover:bg-[#EEF2FF] hover:text-[#2563EB]"><ArrowLeft className="size-3.5"/> Volver</button>)}
      {!preview ? <>
        <div className="mb-4 pr-[76px]">
          <h1 className="text-[20px] font-semibold leading-tight tracking-[-0.035em] sm:text-[22px]">{['¿Cuándo es tu examen?','¿Qué vas a estudiar?','¿Cuánto tiempo tenés por día?','¿Cómo querés estudiar?'][step]}</h1>
          <p className="mt-1.5 text-[12px] leading-[18px] text-[#42506A]">{['Elegí la fecha para organizar tu estudio.','Elegí los materiales que entran en el examen.','Armo tu plan con ese tiempo.','Elegí qué actividades querés priorizar.'][step]}</p>
        </div>
        <section className="rounded-2xl border border-[#E7EBF4] bg-white p-3 sm:p-4">
          {step===0 && <div>
            <div className="mx-auto mb-2 flex max-w-[364px] items-center justify-between">
              <button type="button" aria-label="Mes anterior" disabled={currentMonth} onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()-1,1))} className="flex size-8 items-center justify-center rounded-lg border border-[#E7EBF4] text-[16px] disabled:opacity-30">‹</button>
              <span className="text-[13px] font-semibold capitalize">{monthLabel}</span>
              <button type="button" aria-label="Mes siguiente" onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()+1,1))} className="flex size-8 items-center justify-center rounded-lg border border-[#E7EBF4] text-[16px]">›</button>
            </div>
            <div className="mx-auto grid max-w-[364px] grid-cols-7 gap-x-1 gap-y-0.5 text-center">
              {week.map((day,i)=><span key={i} className="py-1 text-[11px] font-medium text-[#7F8AA3]">{day}</span>)}
              {Array.from({length:offset},(_,i)=><span key={`blank-${i}`}/>)}
              {Array.from({length:daysInMonth},(_,i)=>{
                const date=new Date(month.getFullYear(),month.getMonth(),i+1);
                const value=localDate(date);
                const past=value<localDate(today);
                return <button key={value} type="button" disabled={past} onClick={()=>setExam(value)} aria-label={date.toLocaleDateString('es-AR',{day:'numeric',month:'long',year:'numeric'})} aria-pressed={exam===value} className={`mx-auto flex size-9 items-center justify-center rounded-lg text-[12px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-25 ${exam===value?'bg-[#2563EB] text-white':'text-[#0F1B3D] hover:bg-[#EEF2FF]'}`}>{i+1}</button>
              })}
            </div>
            {exam && <p className="mx-auto mt-2 flex max-w-[364px] items-center gap-2 text-[11px] font-medium text-[#2563EB]"><CalendarDays className="size-3.5"/> Examen: {new Date(`${exam}T12:00:00`).toLocaleDateString('es-AR',{day:'numeric',month:'long',year:'numeric'})}</p>}
          </div>}
          {step===1 && <div className="space-y-2.5">
            {materials.length===0 ? <p className="text-[12px] leading-[18px] text-[#42506A]">Todavía no tenés materiales procesados. Subí uno desde Mi espacio para continuar.</p> : materials.map(m=><button key={m.id} type="button" onClick={()=>toggle(selected,m.id,setSelected)} aria-pressed={selected.includes(m.id)} className={`flex w-full items-center gap-2.5 rounded-xl border p-2.5 text-left transition-colors ${selected.includes(m.id)?'border-[#2563EB] bg-[#EEF2FF]':'border-[#E7EBF4] hover:border-[#2563EB]/40'}`}>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#2563EB]"><FileText className="size-4"/></span>
              <span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-semibold">{m.title}</span><span className="text-[11px] text-[#7F8AA3]">{m.topicCount>0?`${m.topicCount} temas`:'Material listo'}</span></span>
              <span className={`flex size-5 shrink-0 items-center justify-center rounded-md border ${selected.includes(m.id)?'border-[#2563EB] bg-[#2563EB] text-white':'border-[#C5D0E0]'}`}>{selected.includes(m.id)&&<Check className="size-3.5"/>}</span>
            </button>)}
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 pt-2 text-[12px] font-medium text-[#2563EB]">+ Subir otro material</Link>
          </div>}
          {step===2 && <div className="grid grid-cols-2 gap-2.5">
            {[15,30,45,60].map((value,i)=><button type="button" key={value} onClick={()=>setMinutes(value)} aria-pressed={minutes===value} className={`flex min-h-[68px] flex-col items-center justify-center gap-1 rounded-xl border transition-colors ${['bg-[#EEF2FF]','bg-[#E7F5EC]','bg-[#FFF0E6]','bg-[#F1EBFF]'][i]} ${minutes===value?'border-[#2563EB] ring-1 ring-[#2563EB]/20':'border-transparent hover:border-[#C9D8F1]'}`}><Clock3 className="size-4 text-[#2563EB]"/><span className="text-[13px] font-semibold text-[#0F1B3D]">{value} min</span></button>)}
          </div>}
          {step===3 && <div className="grid grid-cols-2 gap-2.5">
            {methods.map(({id,title,subtitle,icon:Icon,tone,iconTone})=><button type="button" key={id} onClick={()=>toggle(preferences,id,setPreferences)} aria-pressed={preferences.includes(id)} className={`relative flex min-h-[112px] flex-col items-start rounded-xl border p-3 text-left transition-colors ${tone} ${preferences.includes(id)?'border-[#2563EB] ring-1 ring-[#2563EB]/15':'border-transparent hover:border-[#C9D8F1]'}`}>
              <span className={`mb-2 flex size-8 items-center justify-center rounded-lg ${iconTone}`}><Icon className="size-4" aria-hidden="true"/></span>
              <span className="block text-[12px] font-semibold leading-[16px] text-[#0F1B3D] sm:text-[13px]">{title}</span><span className="mt-1 block text-[11px] leading-[15px] text-[#42506A]">{subtitle}</span>
              {preferences.includes(id)&&<span className="absolute right-2 top-2 flex size-[18px] items-center justify-center rounded-full bg-[#2563EB] text-white"><Check className="size-3"/></span>}
            </button>)}
          </div>}
        </section>
        <div className="mt-3 flex justify-end">
          <button type="button" disabled={!selectable} onClick={()=>step===3?setPreview(true):setStep(s=>s+1)} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#2563EB] px-4 text-[12px] font-medium text-white transition-colors hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-40">{step===3?'Preparar mi plan':'Continuar'}<ArrowRight className="size-3.5"/></button>
        </div>
      </> : <section className="rounded-2xl border border-[#E7EBF4] bg-white p-4">
        <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#2563EB]"><CalendarDays className="size-5"/></div>
        <h1 className="text-[20px] font-semibold tracking-[-0.035em] sm:text-[22px]">Tu distribución de temas</h1>
        <p className="mt-2 text-[13px] leading-5 text-[#42506A]">Organizamos los temas de tus materiales según los días antes del examen y tus {minutes} minutos diarios. Por ahora no asignamos prácticas específicas.</p>
        {topics.length===0 ? <p className="mt-5 rounded-xl bg-[#F5F7FB] p-4 text-[13px] text-[#42506A]">Los materiales seleccionados todavía no tienen temas extraídos. No podemos distribuirlos hasta que estén disponibles.</p> : <>
          {distribution.days.filter(day=>day.topics.length>0).length===0 && <p className="mt-5 text-[13px] text-[#42506A]">No hay días disponibles antes del examen. Elegí una fecha posterior.</p>}
          <div className="mt-5 space-y-3">
            {distribution.days.filter(day=>day.topics.length>0).map(day=><div key={day.date} className="rounded-xl border border-[#E7EBF4] p-3.5">
              <div className="mb-2 flex items-center justify-between gap-2"><h2 className="text-[13px] font-semibold capitalize">{new Date(`${day.date}T12:00:00`).toLocaleDateString('es-AR',{weekday:'long',day:'numeric',month:'long'})}</h2><span className="shrink-0 text-[11px] text-[#7F8AA3]">{day.estimatedMinutes} min aprox.</span></div>
              <ul className="space-y-2">{day.topics.map((topic,i)=><li key={`${topic.materialId}-${i}`} className="flex gap-2 text-[12px]"><BookOpen className="mt-0.5 size-4 shrink-0 text-[#2563EB]"/><span><span className="font-medium">{topic.title}</span><span className="block text-[11px] text-[#7F8AA3]">{topic.materialTitle} · {topic.estimatedMinutes} min estimados</span></span></li>)}</ul>
            </div>)}
          </div>
          {distribution.unassigned.length>0 && <p role="status" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-900">Con el tiempo disponible quedan {distribution.unassigned.length} temas sin asignar. Podés ampliar el tiempo diario o elegir otra fecha.</p>}
        </>}
        <button type="button" onClick={()=>{setPreview(false);setStep(2)}} className="mt-6 rounded-lg border border-[#E7EBF4] px-4 py-2.5 text-[12px] font-medium">Modificar mi plan</button>
      </section>}
    </div>
  </main>
}
