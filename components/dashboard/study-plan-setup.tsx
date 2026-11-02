'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CalendarDays, Check, Clock3, FileText, BookOpen, Layers3, ListChecks, Brain } from 'lucide-react';

type Material = { id: string; title: string; topicCount: number };
const methods = [
  { id:'entender', title:'Entenderla bien', subtitle:'Resúmenes y conceptos', icon:BookOpen },
  { id:'memorizar', title:'Memorizarla', subtitle:'Flashcards y repasos', icon:Layers3 },
  { id:'practicar', title:'Practicar preguntas', subtitle:'Preguntas y simulacros', icon:ListChecks },
  { id:'casos', title:'Resolver casos', subtitle:'Aplicar lo aprendido', icon:Brain },
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
  const [preferences,setPreferences] = useState<string[]>([]);
  const [preview,setPreview] = useState(false);
  const selectable = step===0 ? !!exam : step===1 ? selected.length>0 : step===2 ? minutes!==null : preferences.length>0;
  const monthLabel = new Intl.DateTimeFormat('es-AR',{month:'long',year:'numeric'}).format(month);
  const daysInMonth = new Date(month.getFullYear(),month.getMonth()+1,0).getDate();
  const offset = (new Date(month.getFullYear(),month.getMonth(),1).getDay()+6)%7;
  const currentMonth = month.getFullYear()===today.getFullYear() && month.getMonth()===today.getMonth();
  const chosen = materials.filter(m=>selected.includes(m.id));
  const toggle = (list:string[],id:string,save:(x:string[])=>void) => save(list.includes(id) ? list.filter(x=>x!==id) : [...list,id]);
  return <main className="mx-auto w-full max-w-[1240px] px-3 py-4 text-[#0F1B3D] sm:px-4 sm:py-5 lg:px-6">
    <div className="mx-auto max-w-[560px]">
      <Link href="/dashboard/plan-de-estudio" className="mb-5 inline-flex items-center gap-1.5 text-[12px] font-medium text-[#42506A] hover:text-[#2563EB]"><ArrowLeft className="size-4"/> Plan de estudio</Link>
      {!preview ? <>
        <div className="mb-5 flex items-center justify-between">
          <span className="text-[12px] font-medium text-[#42506A]">Paso {step+1} de 4</span>
          <span className="text-[12px] text-[#7F8AA3]">Preparar mi plan</span>
        </div>
        <div className="mb-7 grid grid-cols-4 gap-1.5" aria-label={`Paso ${step+1} de 4`}>
          {[0,1,2,3].map(i=><div key={i} className={`h-1 rounded-full ${i<=step?'bg-[#2563EB]':'bg-[#E7EBF4]'}`}/>)}
        </div>
        <div className="mb-6">
          <h1 className="text-[22px] font-semibold tracking-[-0.035em] sm:text-[24px]">{['¿Cuándo es tu examen?','¿Qué vas a estudiar?','¿Cuánto tiempo tenés por día?','¿Cómo querés estudiar?'][step]}</h1>
          <p className="mt-2 text-[13px] leading-5 text-[#42506A]">{['Elegí la fecha para organizar tu estudio.','Elegí los materiales que entran en el examen.','Armo tu plan con ese tiempo.','Elegí qué actividades querés priorizar.'][step]}</p>
        </div>
        <section className="rounded-2xl border border-[#E7EBF4] bg-white p-4 sm:p-5">
          {step===0 && <div>
            <div className="mb-5 flex items-center justify-between">
              <button aria-label="Mes anterior" disabled={currentMonth} onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()-1,1))} className="flex size-9 items-center justify-center rounded-lg border border-[#E7EBF4] text-[18px] disabled:opacity-30">‹</button>
              <span className="text-[14px] font-semibold capitalize">{monthLabel}</span>
              <button aria-label="Mes siguiente" onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()+1,1))} className="flex size-9 items-center justify-center rounded-lg border border-[#E7EBF4] text-[18px]">›</button>
            </div>
            <div className="grid grid-cols-7 gap-1.5 text-center">
              {week.map((day,i)=><span key={i} className="py-2 text-[11px] font-medium text-[#7F8AA3]">{day}</span>)}
              {Array.from({length:offset},(_,i)=><span key={`blank-${i}`}/>)}
              {Array.from({length:daysInMonth},(_,i)=>{
                const date=new Date(month.getFullYear(),month.getMonth(),i+1);
                const value=localDate(date);
                const past=value<localDate(today);
                return <button key={value} type="button" disabled={past} onClick={()=>setExam(value)} aria-pressed={exam===value} className={`aspect-square min-h-9 rounded-lg text-[12px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-25 ${exam===value?'bg-[#2563EB] text-white':'text-[#0F1B3D] hover:bg-[#EEF2FF]'}`}>{i+1}</button>
              })}
            </div>
            {exam && <p className="mt-4 flex items-center gap-2 text-[12px] font-medium text-[#2563EB]"><CalendarDays className="size-4"/> Examen: {new Date(`${exam}T12:00:00`).toLocaleDateString('es-AR',{day:'numeric',month:'long',year:'numeric'})}</p>}
          </div>}
          {step===1 && <div className="space-y-2.5">
            {materials.length===0 ? <p className="text-[13px] leading-5 text-[#42506A]">Todavía no tenés materiales procesados. Subí uno desde Mi espacio para continuar.</p> : materials.map(m=><button key={m.id} type="button" onClick={()=>toggle(selected,m.id,setSelected)} aria-pressed={selected.includes(m.id)} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${selected.includes(m.id)?'border-[#2563EB] bg-[#EEF2FF]':'border-[#E7EBF4] hover:border-[#2563EB]/40'}`}>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#2563EB]"><FileText className="size-4"/></span>
              <span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-semibold">{m.title}</span><span className="text-[11px] text-[#7F8AA3]">{m.topicCount>0?`${m.topicCount} temas`:'Material listo'}</span></span>
              <span className={`flex size-5 shrink-0 items-center justify-center rounded-md border ${selected.includes(m.id)?'border-[#2563EB] bg-[#2563EB] text-white':'border-[#C5D0E0]'}`}>{selected.includes(m.id)&&<Check className="size-3.5"/>}</span>
            </button>)}
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 pt-2 text-[12px] font-medium text-[#2563EB]">+ Subir otro material</Link>
          </div>}
          {step===2 && <div className="grid grid-cols-2 gap-3">
            {[15,30,45,60].map(value=><button type="button" key={value} onClick={()=>setMinutes(value)} aria-pressed={minutes===value} className={`flex min-h-20 flex-col items-center justify-center gap-1 rounded-xl border transition-colors ${minutes===value?'border-[#2563EB] bg-[#EEF2FF] text-[#2563EB]':'border-[#E7EBF4] hover:border-[#2563EB]/40'}`}><Clock3 className="size-4"/><span className="text-[15px] font-semibold">{value} min</span></button>)}
          </div>}
          {step===3 && <div className="grid gap-3 sm:grid-cols-2">
            {methods.map(({id,title,subtitle,icon:Icon})=><button type="button" key={id} onClick={()=>toggle(preferences,id,setPreferences)} aria-pressed={preferences.includes(id)} className={`relative min-h-28 rounded-xl border p-3.5 text-left transition-colors ${preferences.includes(id)?'border-[#2563EB] bg-[#EEF2FF]':'border-[#E7EBF4] hover:border-[#2563EB]/40'}`}>
              <Icon className="mb-3 size-5 text-[#2563EB]"/><span className="block text-[13px] font-semibold">{title}</span><span className="mt-1 block text-[11px] text-[#42506A]">{subtitle}</span>
              {preferences.includes(id)&&<Check className="absolute right-3 top-3 size-4 text-[#2563EB]"/>}
            </button>)}
          </div>}
        </section>
        <div className="mt-5 flex items-center justify-between gap-3">
          {step===0?<Link href="/dashboard/plan-de-estudio" className="rounded-lg border border-[#E7EBF4] px-4 py-2.5 text-[12px] font-medium">Cancelar</Link>:<button type="button" onClick={()=>setStep(s=>s-1)} className="rounded-lg border border-[#E7EBF4] px-4 py-2.5 text-[12px] font-medium">Atrás</button>}
          <button type="button" disabled={!selectable} onClick={()=>step===3?setPreview(true):setStep(s=>s+1)} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#2563EB] px-4 text-[12px] font-medium text-white transition-colors hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-40">{step===3?'Preparar mi plan':'Continuar'}<ArrowRight className="size-4"/></button>
        </div>
      </> : <section className="rounded-2xl border border-[#E7EBF4] bg-white p-5">
        <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#2563EB]"><Check className="size-5"/></div>
        <h1 className="text-[22px] font-semibold tracking-[-0.035em]">Tu plan está configurado</h1>
        <p className="mt-2 text-[13px] text-[#42506A]">Esta es la vista previa de tus preferencias. La planificación diaria se conectará en una siguiente etapa.</p>
        <dl className="mt-5 space-y-3 text-[13px]">
          <div><dt className="text-[#7F8AA3]">Fecha del examen</dt><dd className="font-medium">{exam}</dd></div>
          <div><dt className="text-[#7F8AA3]">Materiales</dt><dd className="font-medium">{chosen.map(m=>m.title).join(', ')}</dd></div>
          <div><dt className="text-[#7F8AA3]">Tiempo disponible</dt><dd className="font-medium">{minutes} minutos por día</dd></div>
          <div><dt className="text-[#7F8AA3]">Preferencias</dt><dd className="font-medium">{methods.filter(m=>preferences.includes(m.id)).map(m=>m.title).join(', ')}</dd></div>
        </dl>
        <button onClick={()=>{setPreview(false);setStep(3)}} className="mt-6 rounded-lg border border-[#E7EBF4] px-4 py-2.5 text-[12px] font-medium">Editar preferencias</button>
      </section>}
    </div>
  </main>
}
