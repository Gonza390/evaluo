'use client';
import { useEffect, useMemo, useState } from 'react';
import './practice-motion.css';
import Link from 'next/link';
import { distributeStudyTopics, type PlanDay } from '@/lib/student-materials/study-plan-distribution';
import { ArrowLeft, ArrowRight, CalendarDays, Check, Clock3, FileText, BookOpen, Layers3, ListChecks, Brain } from 'lucide-react';

type Material = { id: string; title: string; topicCount: number; topics: Array<{title:string;estimatedMinutes:number}> };
type SavedPlan = { exam_date:string; daily_minutes:number; material_ids:string[]; preferences:string[]; schedule:PlanDay[]; updated_at:string };
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
  const [savedPlan,setSavedPlan] = useState<SavedPlan|null>(null);
  const [completedKeys,setCompletedKeys] = useState<string[]>([]);
  const [loading,setLoading] = useState(true);
  const [saving,setSaving] = useState(false);
  const [marking,setMarking] = useState<string|null>(null);
  const [error,setError] = useState('');
  useEffect(()=>{
    let mounted=true;
    void fetch('/api/study-plans',{cache:'no-store'}).then(async response=>{
      if(!response.ok)throw new Error('No pudimos recuperar tu planificación.');
      return response.json() as Promise<{plan:SavedPlan|null;completedKeys:string[]}>;
    }).then(data=>{
      if(!mounted)return;
      setSavedPlan(data.plan);
      setCompletedKeys(data.completedKeys??[]);
      if(data.plan){
        setExam(data.plan.exam_date);
        setSelected(data.plan.material_ids);
        setMinutes(data.plan.daily_minutes);
        setPreferences(data.plan.preferences);
        setPreview(true);
      }
    }).catch((cause:unknown)=>{
      if(mounted)setError(cause instanceof Error?cause.message:'No pudimos recuperar el plan.');
    }).finally(()=>{if(mounted)setLoading(false)});
    return ()=>{mounted=false};
  },[]);
  const selectable = step===0 ? !!exam : step===1 ? selected.length>0 : step===2 ? minutes!==null : preferences.length>0;
  const monthLabel = new Intl.DateTimeFormat('es-AR',{month:'long',year:'numeric'}).format(month);
  const daysInMonth = new Date(month.getFullYear(),month.getMonth()+1,0).getDate();
  const offset = (new Date(month.getFullYear(),month.getMonth(),1).getDay()+6)%7;
  const currentMonth = month.getFullYear()===today.getFullYear() && month.getMonth()===today.getMonth();
  const chosen = materials.filter(m=>selected.includes(m.id));
  const topics = chosen.flatMap(material=>material.topics.map((topic,topicIndex)=>({...topic,topicIndex,materialId:material.id,materialTitle:material.title})));
  const distribution = distributeStudyTopics(topics,exam,minutes??0,today);
  const days=savedPlan?.schedule??distribution.days;
  const assignedKeys=new Set(days.flatMap(day=>day.topics.map(topic=>`${topic.materialId}:${topic.topicIndex}`)));
  const completedCount=completedKeys.filter(key=>assignedKeys.has(key)).length;
  async function savePlan() {
    if(saving||!exam||!minutes||!selected.length||!preferences.length)return;
    setSaving(true);setError('');
    try {
      const response=await fetch('/api/study-plans',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({examDate:exam,minutesPerDay:minutes,materialIds:selected,preferences,startDate:localDate(today)})
      });
      const result=await response.json() as {error?:string};
      if(!response.ok)throw new Error(result.error||'No pudimos guardar el plan.');
      const latest=await fetch('/api/study-plans',{cache:'no-store'});
      if(!latest.ok)throw new Error('El plan se guardó, pero no pudimos recuperarlo.');
      const data=await latest.json() as {plan:SavedPlan|null;completedKeys:string[]};
      setSavedPlan(data.plan);setCompletedKeys(data.completedKeys??[]);setPreview(true);
    }catch(cause){setError(cause instanceof Error?cause.message:'No pudimos guardar el plan.')}
    finally{setSaving(false)}
  }
  async function markCompleted(materialId:string,topicIndex:number) {
    const key=`${materialId}:${topicIndex}`;
    if(marking||completedKeys.includes(key))return;
    setMarking(key);setError('');
    try{
      const response=await fetch('/api/study-plans',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({materialId,topicIndex})});
      const result=await response.json() as {error?:string};
      if(!response.ok)throw new Error(result.error||'No pudimos registrar esta actividad.');
      setCompletedKeys(previous=>[...new Set([...previous,key])]);
    }catch(cause){setError(cause instanceof Error?cause.message:'No pudimos guardar el avance.')}
    finally{setMarking(null)}
  }
  const toggle = (list:string[],id:string,save:(x:string[])=>void) => save(list.includes(id) ? list.filter(x=>x!==id) : [...list,id]);
  return <main className="mx-auto w-full max-w-[1240px] px-3 py-3 text-[#0F1B3D] sm:px-4 sm:py-4 lg:px-6 lg:py-5">
    {loading&&<p role="status" className="mx-auto max-w-[500px] pb-3 text-[12px] text-[#7F8AA3]">Recuperando tu planificación…</p>}
    {error&&<p role="alert" className="mx-auto mb-3 max-w-[500px] rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">{error}</p>}
    <div className={`relative mx-auto ${preview ? "max-w-[1190px]" : "max-w-[500px]"}`}>
      {!preview && step!==2 && (step===0
        ? <Link href="/dashboard/plan-de-estudio" className="absolute right-0 top-0 z-10 inline-flex min-h-8 items-center gap-1 rounded-lg px-2 text-[12px] font-medium text-[#42506A] hover:bg-[#EEF2FF] hover:text-[#2563EB]"><ArrowLeft className="size-3.5"/> Volver</Link>
        : <button type="button" onClick={()=>setStep(s=>s-1)} className="absolute right-0 top-0 z-10 inline-flex min-h-8 items-center gap-1 rounded-lg px-2 text-[12px] font-medium text-[#42506A] hover:bg-[#EEF2FF] hover:text-[#2563EB]"><ArrowLeft className="size-3.5"/> Volver</button>)}
      {!preview ? <div key={`plan-step-${step}`} className="practice-screen-enter">
        <div className={step===2 ? 'mb-6 text-center sm:mb-7' : 'mb-4 pr-[76px]'}>
          <h1 className="text-[20px] font-semibold leading-tight tracking-[-0.035em] sm:text-[22px]">{['¿Cuándo es tu examen?','¿Qué vas a estudiar?','¿Cuánto tiempo tenés por día?','¿Cómo querés estudiar?'][step]}</h1>
          <p className="mt-1.5 text-[12px] leading-[18px] text-[#42506A]">{['Elegí la fecha para organizar tu estudio.','Elegí los materiales que entran en el examen.','Armo tu plan con ese tiempo.','Elegí qué actividades querés priorizar.'][step]}</p>
        </div>
        <section className={step===2 ? 'bg-white' : 'rounded-2xl border border-[#E7EBF4] bg-white p-3 sm:p-4'}>
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
          {step===2 && <div data-study-plan-time-options role="group" aria-label="Tiempo disponible por día" className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
            {[15,30,45,60].map(value=><button type="button" key={value} onClick={()=>setMinutes(value)} aria-pressed={minutes===value} className={`flex min-h-[50px] items-center justify-center rounded-xl border px-3 py-2.5 text-[13px] font-semibold transition-colors sm:min-h-[52px] ${minutes===value?'border-[#2563EB] bg-[#EEF2FF] text-[#2563EB] ring-1 ring-[#2563EB]/15':'border-[#E7EBF4] bg-white text-[#42506A] hover:border-[#2563EB]/40'}`}>{value} min</button>)}
          </div>}
          {step===3 && <div className="grid grid-cols-2 gap-2.5">
            {methods.map(({id,title,subtitle,icon:Icon,tone,iconTone})=><button type="button" key={id} onClick={()=>toggle(preferences,id,setPreferences)} aria-pressed={preferences.includes(id)} className={`relative flex min-h-[112px] flex-col items-start rounded-xl border p-3 text-left transition-colors ${tone} ${preferences.includes(id)?'border-[#2563EB] ring-1 ring-[#2563EB]/15':'border-transparent hover:border-[#C9D8F1]'}`}>
              <span className={`mb-2 flex size-8 items-center justify-center rounded-lg ${iconTone}`}><Icon className="size-4" aria-hidden="true"/></span>
              <span className="block text-[12px] font-semibold leading-[16px] text-[#0F1B3D] sm:text-[13px]">{title}</span><span className="mt-1 block text-[11px] leading-[15px] text-[#42506A]">{subtitle}</span>
              {preferences.includes(id)&&<span className="absolute right-2 top-2 flex size-[18px] items-center justify-center rounded-full bg-[#2563EB] text-white"><Check className="size-3"/></span>}
            </button>)}
          </div>}
        </section>
        {step===2 ? (
          <div data-study-plan-time-actions className="mt-6 flex items-center justify-center gap-3 sm:mt-7">
            <button type="button" onClick={()=>setStep(1)} className="inline-flex min-h-10 items-center justify-center rounded-xl px-4 text-[12px] font-medium text-[#42506A] hover:bg-[#F5F7FB]">Atrás</button>
            <button type="button" disabled={!selectable||saving||loading} onClick={()=>setStep(3)} className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#2563EB] px-6 text-[12px] font-semibold text-white transition-colors hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-40">Continuar</button>
          </div>
        ) : (
          <div className="mt-3 flex justify-end">
            <button type="button" disabled={!selectable||saving||loading} onClick={()=>step===3?void savePlan():setStep(s=>s+1)} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#2563EB] px-4 text-[12px] font-medium text-white transition-colors hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-40">{step===3?(saving?'Guardando…':'Preparar mi plan'):'Continuar'}<ArrowRight className="size-3.5"/></button>
          </div>
        )}
      </div> : <section key="plan-preview" data-study-plan-dashboard className="practice-screen-enter pb-8">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div><p className="text-[11px] font-medium text-[#7F8AA3]">MI ESPACIO / PLAN DE ESTUDIOS</p>
            <h1 className="mt-1 text-[22px] font-semibold tracking-[-0.035em] sm:text-[25px]">Mi plan de estudio</h1>
            <p className="mt-1 text-[12px] text-[#66758D]">Tus temas organizados hasta el examen.</p></div>
          <button type="button" onClick={()=>{setPreview(false);setStep(0);setSavedPlan(null)}} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#E7EBF4] bg-white px-3 text-[12px] font-medium text-[#42506A] hover:bg-[#F5F7FB]"><CalendarDays className="size-4"/> Editar plan</button>
        </div>
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(310px,0.85fr)] lg:gap-6">
          <div className="min-w-0 space-y-5">
            <section className="rounded-2xl border border-[#E7EBF4] bg-white p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><p className="text-[11px] font-medium text-[#7F8AA3]">TU PRÓXIMA SESIÓN</p>
                  <h2 className="mt-1 text-[18px] font-semibold tracking-tight sm:text-[20px]">Para estudiar</h2></div>
                <span className="rounded-full bg-[#F5F7FB] px-3 py-1.5 text-[11px] font-medium text-[#42506A]"><Clock3 className="mr-1 inline size-3.5"/>{minutes} min por día</span>
              </div>
              {(()=>{
                const next=days.flatMap(day=>day.topics.map(topic=>({...topic,date:day.date}))).find(topic=>!completedKeys.includes(`${topic.materialId}:${topic.topicIndex}`));
                if(!next)return <p className="mt-4 text-[12px] text-[#66758D]">{assignedKeys.size?'Ya marcaste como leídos todos los temas de este plan.':'Todavía no hay temas asignados. Editá tu plan para continuar.'}</p>;
                return <div className="mt-4 rounded-xl border border-[#E7EBF4] p-3.5">
                  <p className="text-[11px] capitalize text-[#7F8AA3]">{new Date(`${next.date}T12:00:00`).toLocaleDateString('es-AR',{weekday:'long',day:'numeric',month:'long'})}</p>
                  <h3 className="mt-2 text-[14px] font-semibold">{next.title}</h3>
                  <p className="mt-1 text-[11px] text-[#7F8AA3]">{next.materialTitle} · {next.estimatedMinutes} min estimados</p>
                  <div className="mt-4 space-y-3 border-t border-[#E7EBF4] pt-4">
                    <Link href={`/materiales/${next.materialId}?tab=resumen&studyTopic=${next.topicIndex}`} className="flex items-center gap-3 text-[12px] text-[#42506A] hover:text-[#2563EB]"><BookOpen className="size-4 text-[#2563EB]"/> Leer el resumen <ArrowRight className="ml-auto size-3.5"/></Link>
                    {preferences.includes('memorizar')&&<Link href={`/materiales/${next.materialId}?tab=tarjetas&studyTopic=${next.topicIndex}`} className="flex items-center gap-3 text-[12px] text-[#42506A] hover:text-[#2563EB]"><Layers3 className="size-4 text-[#2563EB]"/> Repasar con flashcards <ArrowRight className="ml-auto size-3.5"/></Link>}
                    {preferences.includes('practicar')&&<Link href={`/materiales/${next.materialId}?tab=ejercicios&studyTopic=${next.topicIndex}`} className="flex items-center gap-3 text-[12px] text-[#42506A] hover:text-[#2563EB]"><ListChecks className="size-4 text-[#2563EB]"/> Practicar el tema <ArrowRight className="ml-auto size-3.5"/></Link>}
                  </div>
                  <Link href={`/materiales/${next.materialId}?tab=resumen&studyTopic=${next.topicIndex}`} className="mt-4 flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 text-[12px] font-semibold text-white hover:bg-[#1D4ED8]">Empezar a estudiar <ArrowRight className="size-4"/></Link>
                </div>;
              })()}
            </section>
            <section className="rounded-2xl border border-[#E7EBF4] bg-white p-4 sm:p-5">
              <h2 className="text-[16px] font-semibold tracking-tight">Los días que quedan</h2>
              {days.filter(day=>day.topics.length>0).length===0&&<p className="mt-3 text-[12px] text-[#66758D]">No hay días disponibles antes del examen. Editá la fecha o el tiempo del plan.</p>}
              <div className="mt-4 space-y-3">
                {days.filter(day=>day.topics.length>0).map(day=><div key={day.date} className="rounded-xl border border-[#E7EBF4] p-3">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h3 className="text-[12px] font-semibold capitalize">{new Date(`${day.date}T12:00:00`).toLocaleDateString('es-AR',{weekday:'long',day:'numeric',month:'long'})}</h3>
                    <span className="shrink-0 text-[11px] text-[#7F8AA3]">{day.estimatedMinutes} min aprox.</span>
                  </div>
                  <ul className="space-y-3">{day.topics.map(topic=>{
                    const key=`${topic.materialId}:${topic.topicIndex}`,done=completedKeys.includes(key);
                    return <li key={key} className="flex items-start gap-2">
                      <BookOpen className="mt-0.5 size-4 shrink-0 text-[#2563EB]"/>
                      <div className="min-w-0 flex-1"><p className="text-[12px] font-medium">{topic.title}</p><p className="text-[11px] text-[#7F8AA3]">{topic.materialTitle}</p><Link href={`/materiales/${topic.materialId}?tab=resumen&studyTopic=${topic.topicIndex}`} className="mt-1 inline-flex text-[11px] font-medium text-[#2563EB] hover:underline">Estudiar este tema</Link></div>
                      <button type="button" disabled={!savedPlan||done||marking===key} onClick={()=>void markCompleted(topic.materialId,topic.topicIndex)} className="shrink-0 rounded-lg bg-[#EEF2FF] px-2 py-1.5 text-[11px] font-medium text-[#2563EB] disabled:opacity-50">{done?'Completado':marking===key?'Guardando…':'Marcar leído'}</button>
                    </li>;
                  })}</ul>
                </div>)}
              </div>
            </section>
          </div>
          <aside className="min-w-0 space-y-5">
            <section className="rounded-2xl bg-[#EAF1FF] p-4 sm:p-5">
              <p className="flex items-center gap-2 text-[12px] font-medium text-[#2563EB]"><CalendarDays className="size-4"/> Próximo examen</p>
              <h2 className="mt-3 text-[27px] font-semibold tracking-[-0.045em]">{exam?`En ${Math.max(0,Math.ceil((new Date(`${exam}T12:00:00`).getTime()-new Date(`${localDate(today)}T12:00:00`).getTime())/86400000))} días`:'Sin fecha'}</h2>
              {exam&&<p className="mt-1 text-[12px] text-[#42506A]">{new Date(`${exam}T12:00:00`).toLocaleDateString('es-AR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</p>}
              <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-[#D8E3FF]"><div className="h-full rounded-full bg-[#4F5DFF]" style={{width:`${assignedKeys.size?Math.round(100*completedCount/assignedKeys.size):0}%`}}/></div>
              <div className="mt-2 flex justify-between text-[11px] text-[#66758D]"><span>{completedCount} de {assignedKeys.size} temas leídos</span><span>{assignedKeys.size?Math.round(100*completedCount/assignedKeys.size):0}%</span></div>
              <p className="mt-4 text-[11px] leading-4 text-[#42506A]">El avance indica temas leídos, no prácticas completadas.</p>
            </section>
            <section className="rounded-2xl border border-[#E7EBF4] bg-white p-4 sm:p-5">
              <h2 className="text-[16px] font-semibold tracking-tight">Entran al examen</h2>
              <div className="mt-3 divide-y divide-[#E7EBF4]">{chosen.map(material=><div key={material.id} className="flex items-center gap-3 py-3"><FileText className="size-4 shrink-0 text-[#2563EB]"/><span className="min-w-0 flex-1 truncate text-[12px] text-[#42506A]">{material.title}</span><span className="text-[11px] text-[#7F8AA3]">{days.flatMap(day=>day.topics).filter(topic=>topic.materialId===material.id&&completedKeys.includes(`${topic.materialId}:${topic.topicIndex}`)).length} de {days.flatMap(day=>day.topics).filter(topic=>topic.materialId===material.id).length}</span></div>)}</div>
            </section>
            <section className="rounded-2xl border border-[#E7EBF4] bg-white p-4 sm:p-5">
              <h2 className="text-[16px] font-semibold tracking-tight">Tu preparación</h2>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-[#F5F7FB] p-3"><p className="text-[20px] font-semibold">{completedCount}/{assignedKeys.size}</p><p className="mt-1 text-[11px] text-[#7F8AA3]">Temas leídos</p></div>
                <div className="rounded-xl bg-[#F5F7FB] p-3"><p className="text-[20px] font-semibold">{days.filter(day=>day.topics.length>0).length}</p><p className="mt-1 text-[11px] text-[#7F8AA3]">Días planificados</p></div>
              </div>
            </section>
            {distribution.unassigned.length>0&&<p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-900">Con el tiempo disponible quedan {distribution.unassigned.length} temas sin asignar. Podés ampliar el tiempo diario o elegir otra fecha.</p>}
          </aside>
        </div>
      </section>}
    </div>
  </main>
}
