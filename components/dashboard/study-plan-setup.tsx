'use client';
import { useEffect, useMemo, useState } from 'react';
import './practice-motion.css';
import Link from 'next/link';
import { useOptionalAppLocale } from '@/components/i18n/app-locale-provider';
import { studyUiText } from '@/lib/i18n/study-ui-copy';
import { useRouter } from 'next/navigation';
import { SavedStudyPlanRoadmap } from '@/components/dashboard/saved-study-plan-roadmap';
import { SavedStudyPlanSchedule } from '@/components/dashboard/saved-study-plan-schedule';
import { completeStudySchedule, estimateTopicSessionMinutes, recommendTopicActivities, type PlanDay } from '@/lib/student-materials/study-plan-distribution';
import { ArrowLeft, ArrowRight, CalendarDays, Check, Clock3, FileText, BookOpen, Layers3, ListChecks, Brain } from 'lucide-react';

type Material = { id: string; title: string; topicCount: number; topics: Array<{title:string;estimatedMinutes:number}> };
type SavedPlan = { exam_date:string; daily_minutes:number; material_ids:string[]; preferences:string[]; schedule:PlanDay[]; updated_at:string };
type InitialPlanData = { plan: SavedPlan; completedKeys: string[]; planCompletedKeys: string[]; preparationProgress: {percent:number} };
const methods = [
  { id:'entender', title:'Entenderla bien', subtitle:'Resúmenes y conceptos', icon:BookOpen, tone:'bg-[#EEF2FF]', iconTone:'bg-[#DCE7FF] text-[#456DBD]' },
  { id:'memorizar', title:'Memorizarla', subtitle:'Flashcards y repasos', icon:Layers3, tone:'bg-[#E7F5EC]', iconTone:'bg-[#D3EEDD] text-[#338458]' },
  { id:'practicar', title:'Practicar preguntas', subtitle:'Preguntas y simulacros', icon:ListChecks, tone:'bg-[#FFF0E6]', iconTone:'bg-[#FAE2D0] text-[#B86A36]' },
  { id:'casos', title:'Resolver casos', subtitle:'Aplicar lo aprendido', icon:Brain, tone:'bg-[#F1EBFF]', iconTone:'bg-[#E4D9FF] text-[#7657B8]' },
];
const week = ['L','M','X','J','V','S','D'];
const pad = (n:number) => String(n).padStart(2,'0');
const localDate = (date:Date) => `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`;
export function StudyPlanSetup({ materials, mode = 'setup', initialMaterialId, initialExamDate, initialPlanData }: { materials:Material[]; mode?: 'setup' | 'view'; initialMaterialId?: string; initialExamDate?: string; initialPlanData?: InitialPlanData }) {
  const router = useRouter();
  const locale = useOptionalAppLocale();
  const english = locale === 'en';
  const t = (value: string) => studyUiText(locale, value);
  const today = useMemo(()=>new Date(),[]);
  const [step,setStep] = useState(0);
  const [month,setMonth] = useState(new Date(today.getFullYear(),today.getMonth(),1));
  const [exam,setExam] = useState(initialPlanData?.plan.exam_date ?? initialExamDate ?? '');
  const [selected,setSelected] = useState<string[]>(() => initialPlanData?.plan.material_ids ?? (initialMaterialId && materials.some(m => m.id === initialMaterialId) ? [initialMaterialId] : []));
  const [minutes,setMinutes] = useState<number|null>(initialPlanData?.plan.daily_minutes ?? null);
  const [preferences,setPreferences] = useState<string[]>(initialPlanData?.plan.preferences ?? ['entender','practicar']);
  const [preview,setPreview] = useState(initialPlanData !== undefined && mode === 'view');
  const [savedPlan,setSavedPlan] = useState<SavedPlan|null>(initialPlanData?.plan ?? null);
  const [completedKeys,setCompletedKeys] = useState<string[]>(initialPlanData?.completedKeys ?? []);
  const [planCompletedKeys,setPlanCompletedKeys] = useState<string[]>(initialPlanData?.planCompletedKeys ?? []);
  const [preparationPercent,setPreparationPercent] = useState(initialPlanData?.preparationProgress.percent ?? 0);
  const [loading,setLoading] = useState(!initialPlanData);
  const [saving,setSaving] = useState(false);
  const [marking,setMarking] = useState<string|null>(null);
  const [error,setError] = useState('');
  useEffect(()=>{
    if (initialPlanData) return;
    let mounted=true;
    void fetch('/api/study-plans',{cache:'no-store'}).then(async response=>{
      if(!response.ok)throw new Error('No pudimos recuperar tu planificación.');
      return response.json() as Promise<{plan:SavedPlan|null;completedKeys:string[];planCompletedKeys?:string[];preparationProgress?:{completed:number;total:number;percent:number}}>;
    }).then(data=>{
      if(!mounted)return;
      setSavedPlan(data.plan);
      setCompletedKeys(data.completedKeys??[]);
      setPlanCompletedKeys(data.planCompletedKeys??[]);
      setPreparationPercent(data.preparationProgress?.percent??0);
      if(data.plan){
        setExam(data.plan.exam_date);
        setSelected(data.plan.material_ids);
        setMinutes(data.plan.daily_minutes);
        setPreferences(data.plan.preferences);
        setPreview(mode==='view');
      }
    }).catch((cause:unknown)=>{
      if(mounted)setError(cause instanceof Error ? t(cause.message) : (english ? 'Could not load the study plan.' : 'No pudimos recuperar el plan.'));
    }).finally(()=>{if(mounted)setLoading(false)});
    return ()=>{mounted=false};
  },[]);
  const selectable = step===0 ? !!exam : step===1 ? selected.length>0 : step===2 ? minutes!==null : preferences.length>0;
  const monthLabel = new Intl.DateTimeFormat(english ? 'en-US' : 'es-AR',{month:'long',year:'numeric'}).format(month);
  const daysInMonth = new Date(month.getFullYear(),month.getMonth()+1,0).getDate();
  const offset = (new Date(month.getFullYear(),month.getMonth(),1).getDay()+6)%7;
  const currentMonth = month.getFullYear()===today.getFullYear() && month.getMonth()===today.getMonth();
  const chosen = materials.filter(m=>selected.includes(m.id));
  const topics = chosen.flatMap(material=>material.topics.map((topic,topicIndex)=>({...topic,topicIndex,materialId:material.id,materialTitle:material.title,estimatedMinutes:estimateTopicSessionMinutes(topic.estimatedMinutes,preferences,minutes??15)})));
  const distribution = completeStudySchedule(topics,exam,minutes??0,today);
  const days=savedPlan?.schedule??distribution.days;
  const overloaded=days.some(day=>day.estimatedMinutes>(savedPlan?.daily_minutes??minutes??0)) ||
    new Set(days.flatMap(day=>day.topics.map(topic=>`${topic.materialId}:${topic.topicIndex}`))).size<topics.length;
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
      const data=await latest.json() as {plan:SavedPlan|null;completedKeys:string[];planCompletedKeys?:string[];preparationProgress?:{completed:number;total:number;percent:number}};
      setSavedPlan(data.plan);setCompletedKeys(data.completedKeys??[]);
      setPlanCompletedKeys(data.planCompletedKeys??[]);
      setPreparationPercent(data.preparationProgress?.percent??0);
      if(mode==='setup') router.push('/dashboard/plan-de-estudio');
      else setPreview(true);
    }catch(cause){setError(cause instanceof Error ? t(cause.message) : (english ? 'Could not save the study plan.' : 'No pudimos guardar el plan.'))}
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
    }catch(cause){setError(cause instanceof Error ? t(cause.message) : (english ? 'Could not save your progress.' : 'No pudimos guardar el avance.'))}
    finally{setMarking(null)}
  }
  const toggle = (list:string[],id:string,save:(x:string[])=>void) => save(list.includes(id) ? list.filter(x=>x!==id) : [...list,id]);
  return <main data-study-plan-shell className={`mx-auto w-full max-w-[1240px] px-3 py-3 text-[#0F1B3D] sm:px-4 sm:py-4 lg:px-6 lg:py-5 ${preview ? 'xl:h-[calc(100dvh-52px)] xl:overflow-hidden' : ''}`}>
    {loading&&<p role="status" className="mx-auto max-w-[500px] pb-3 text-[12px] text-[#7F8AA3]">{english ? "Loading your schedule…" : "Recuperando tu planificación…"}</p>}
    {error&&<p role="alert" className="mx-auto mb-3 max-w-[500px] rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">{error}</p>}
    {mode==='view' && (loading || !savedPlan) ? <div role="status" className="mx-auto max-w-[500px] rounded-xl border border-[#E7EBF4] bg-white px-4 py-5 text-[12px] text-[#66758D]">{t(loading ? 'Cargando tu plan de estudio…' : 'No encontramos un plan guardado. Podés crear uno desde Plan de estudio.')}</div> : <div className={`relative mx-auto ${preview ? "w-full xl:h-full xl:min-h-0" : "max-w-[500px]"}`}>
      {!preview && step!==2 && (step===0
        ? <Link href="/dashboard/plan-de-estudio" className="absolute right-0 top-0 z-10 inline-flex min-h-8 items-center gap-1 rounded-lg px-2 text-[12px] font-medium text-[#42506A] hover:bg-[#EEF2FF] hover:text-[#456DBD]"><ArrowLeft className="size-3.5"/> {t('Volver')}</Link>
        : <button type="button" onClick={()=>setStep(s=>s-1)} className="absolute right-0 top-0 z-10 inline-flex min-h-8 items-center gap-1 rounded-lg px-2 text-[12px] font-medium text-[#42506A] hover:bg-[#EEF2FF] hover:text-[#456DBD]"><ArrowLeft className="size-3.5"/> {t('Volver')}</button>)}
      {!preview ? <div key={`plan-step-${step}`} className="practice-screen-enter">
        <div className={step===2 ? 'mb-6 text-center sm:mb-7' : 'mb-4 pr-[76px]'}>
          <h1 className="text-[20px] font-semibold leading-tight tracking-[-0.035em] sm:text-[22px]">{(english ? ['When is your exam?', 'What will you study?', 'How much time can you study each day?', 'How would you like to study?'] : ['¿Cuándo es tu examen?','¿Qué vas a estudiar?','¿Cuánto tiempo tenés por día?','¿Cómo querés estudiar?'])[step]}</h1>
          <p className="mt-1.5 text-[12px] leading-[18px] text-[#42506A]">{(english ? ['Choose the date to organize your studies.', 'Choose the documents covered by your exam.', 'I’ll build your plan around that time.', 'Choose the activities you want to prioritize.'] : ['Elegí la fecha para organizar tu estudio.','Elegí los materiales que entran en el examen.','Armo tu plan con ese tiempo.','Elegí qué actividades querés priorizar.'])[step]}</p>
        </div>
        <section className={step===2 ? 'bg-white' : 'rounded-2xl border border-[#E7EBF4] bg-white p-3 sm:p-4'}>
          {step===0 && <div>
            <div className="mx-auto mb-2 flex max-w-[364px] items-center justify-between">
              <button type="button" aria-label={english ? "Previous month" : "Mes anterior"} disabled={currentMonth} onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()-1,1))} className="flex size-8 items-center justify-center rounded-lg border border-[#E7EBF4] text-[16px] disabled:opacity-30">‹</button>
              <span className="text-[13px] font-semibold capitalize">{monthLabel}</span>
              <button type="button" aria-label={english ? "Next month" : "Mes siguiente"} onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()+1,1))} className="flex size-8 items-center justify-center rounded-lg border border-[#E7EBF4] text-[16px]">›</button>
            </div>
            <div className="mx-auto grid max-w-[364px] grid-cols-7 gap-x-1 gap-y-0.5 text-center">
              {(english ? ['M','T','W','T','F','S','S'] : week).map((day,i)=><span key={i} className="py-1 text-[11px] font-medium text-[#7F8AA3]">{day}</span>)}
              {Array.from({length:offset},(_,i)=><span key={`blank-${i}`}/>)}
              {Array.from({length:daysInMonth},(_,i)=>{
                const date=new Date(month.getFullYear(),month.getMonth(),i+1);
                const value=localDate(date);
                const past=value<localDate(today);
                return <button key={value} type="button" disabled={past} onClick={()=>setExam(value)} aria-label={date.toLocaleDateString(english ? 'en-US' : 'es-AR',{day:'numeric',month:'long',year:'numeric'})} aria-pressed={exam===value} className={`mx-auto flex size-9 items-center justify-center rounded-lg text-[12px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-25 ${exam===value?'bg-[#456DBD] text-white':'text-[#0F1B3D] hover:bg-[#EEF2FF]'}`}>{i+1}</button>
              })}
            </div>
            {exam && <p className="mx-auto mt-2 flex max-w-[364px] items-center gap-2 text-[11px] font-medium text-[#456DBD]"><CalendarDays className="size-3.5"/> {english ? 'Exam' : 'Examen'}: {new Date(`${exam}T12:00:00`).toLocaleDateString(english ? 'en-US' : 'es-AR',{day:'numeric',month:'long',year:'numeric'})}</p>}
          </div>}
          {step===1 && <div className="space-y-2.5">
            {materials.length===0 ? <p className="text-[12px] leading-[18px] text-[#42506A]">{t("Todavía no tenés materiales procesados. Subí uno desde Mi espacio para continuar.")}</p> : materials.map(m=><button key={m.id} type="button" onClick={()=>toggle(selected,m.id,setSelected)} aria-pressed={selected.includes(m.id)} className={`flex w-full items-center gap-2.5 rounded-xl border p-2.5 text-left transition-colors ${selected.includes(m.id)?'border-[#456DBD] bg-[#EEF2FF]':'border-[#E7EBF4] hover:border-[#456DBD]/40'}`}>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#456DBD]"><FileText className="size-4"/></span>
              <span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-semibold">{m.title}</span><span className="text-[11px] text-[#7F8AA3]">{m.topicCount>0?`${m.topicCount} ${english ? 'topics' : 'temas'}`:t('Material listo')}</span></span>
              <span className={`flex size-5 shrink-0 items-center justify-center rounded-md border ${selected.includes(m.id)?'border-[#456DBD] bg-[#456DBD] text-white':'border-[#C5D0E0]'}`}>{selected.includes(m.id)&&<Check className="size-3.5"/>}</span>
            </button>)}
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 pt-2 text-[12px] font-medium text-[#456DBD]">{english ? "+ Upload another document" : "+ Subir otro material"}</Link>
          </div>}
          {step===2 && <div data-study-plan-time-options role="group" aria-label={english ? "Daily study time" : "Tiempo disponible por día"} className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
            {[15,30,45,60].map(value=><button type="button" key={value} onClick={()=>setMinutes(value)} aria-pressed={minutes===value} className={`flex min-h-[50px] items-center justify-center rounded-xl border px-3 py-2.5 text-[13px] font-semibold transition-colors sm:min-h-[52px] ${minutes===value?'border-[#456DBD] bg-[#EEF2FF] text-[#456DBD] ring-1 ring-[#456DBD]/15':'border-[#E7EBF4] bg-white text-[#42506A] hover:border-[#456DBD]/40'}`}>{value} min</button>)}
          </div>}
          {step===3 && <div className="grid grid-cols-2 gap-2.5">
            {methods.map(({id,title,subtitle,icon:Icon,tone,iconTone})=><button type="button" key={id} onClick={()=>toggle(preferences,id,setPreferences)} aria-pressed={preferences.includes(id)} className={`relative flex min-h-[112px] flex-col items-start rounded-xl border p-3 text-left transition-colors ${tone} ${preferences.includes(id)?'border-[#456DBD] ring-1 ring-[#456DBD]/15':'border-transparent hover:border-[#C9D8F1]'}`}>
              <span className={`mb-2 flex size-8 items-center justify-center rounded-lg ${iconTone}`}><Icon className="size-4" aria-hidden="true"/></span>
              <span className="block text-[12px] font-semibold leading-[16px] text-[#0F1B3D] sm:text-[13px]">{t(title)}</span><span className="mt-1 block text-[11px] leading-[15px] text-[#42506A]">{t(subtitle)}</span>
              {preferences.includes(id)&&<span className="absolute right-2 top-2 flex size-[18px] items-center justify-center rounded-full bg-[#456DBD] text-white"><Check className="size-3"/></span>}
            </button>)}
          </div>}
        </section>
        {step===2 ? (
          <div data-study-plan-time-actions className="mt-6 flex items-center justify-center gap-3 sm:mt-7">
            <button type="button" onClick={()=>setStep(1)} className="inline-flex min-h-10 items-center justify-center rounded-xl px-4 text-[12px] font-medium text-[#42506A] hover:bg-[#F5F7FB]">{english ? "Back" : "Atrás"}</button>
            <button type="button" disabled={!selectable||saving||loading} onClick={()=>setStep(3)} className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#456DBD] px-6 text-[12px] font-semibold text-white transition-colors hover:bg-[#3A5CA8] disabled:cursor-not-allowed disabled:opacity-40">{english ? "Continue" : "Continuar"}</button>
          </div>
        ) : (
          <div className="mt-3 flex justify-end">
            <button type="button" disabled={!selectable||saving||loading} onClick={()=>step===3?void savePlan():setStep(s=>s+1)} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#456DBD] px-4 text-[12px] font-medium text-white transition-colors hover:bg-[#3A5CA8] disabled:cursor-not-allowed disabled:opacity-40">{step===3?(saving ? (english ? 'Saving…' : 'Guardando…') : (english ? 'Prepare my plan' : 'Preparar mi plan')) : (english ? 'Continue' : 'Continuar')}<ArrowRight className="size-3.5"/></button>
          </div>
        )}
      </div> : <section key="plan-preview" data-study-plan-dashboard className="practice-screen-enter xl:flex xl:h-full xl:min-h-0 xl:flex-col">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)] xl:min-h-0 xl:flex-1 xl:overflow-hidden">
          <div className="min-w-0 xl:flex xl:min-h-0 xl:flex-col">
            <div className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-2">
              <h1 className="text-[20px] font-semibold tracking-[-0.035em] sm:text-[22px] lg:text-[24px]">{t("Plan de estudio")}</h1>
              <Link href="/dashboard/plan-de-estudio/preparar" className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#E7EBF4] bg-white px-3 text-[12px] font-medium text-[#42506A] hover:bg-[#F5F7FB]"><CalendarDays className="size-3.5"/> {english ? 'Edit plan' : 'Editar plan'}</Link>
            </div>
            <div className="min-w-0 space-y-3 xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:scroll-smooth xl:overscroll-contain xl:pr-2 xl:[scrollbar-width:none] xl:[&::-webkit-scrollbar]:hidden xl:[mask-image:linear-gradient(to_bottom,transparent,black_14px,black_calc(100%-18px),transparent)]">
            {savedPlan && <SavedStudyPlanRoadmap key={savedPlan.updated_at} days={days} examDate={savedPlan.exam_date} completedKeys={planCompletedKeys}/>}

            {overloaded&&<p role="status" data-study-plan-time-warning className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-4 text-amber-900">{english ? `With ${minutes} minutes per day there isn't enough time for every topic before your exam. Your full plan is shown, but some days need extra study time. You can edit it.` : `Con ${minutes} minutos por día no alcanza para cubrir todos los temas antes del examen. Te mostramos el plan completo, pero algunos días necesitan más tiempo. Podés editarlo si querés.`}</p>}
            <SavedStudyPlanSchedule days={days} examDate={savedPlan?.exam_date??exam} completedKeys={completedKeys} planCompletedKeys={planCompletedKeys} preferences={preferences} dailyMinutes={minutes??15}/>
            </div>
          </div>
          <aside className="min-w-0 space-y-3 xl:min-h-0 xl:overflow-hidden">
            <section className="h-[210px] overflow-hidden rounded-[18px] bg-[#EAF1FF] px-4 py-5 sm:h-[218px] sm:px-5 sm:py-6">
              <p className="flex items-center gap-2 text-[12px] font-medium text-[#456DBD]"><CalendarDays className="size-4"/> {english ? 'Next exam' : 'Próximo examen'}</p>
              <h2 className="mt-2 text-[23px] font-semibold leading-tight tracking-[-0.045em]">{exam?`${english ? 'In' : 'En'} ${Math.max(0,Math.ceil((new Date(`${exam}T12:00:00`).getTime()-new Date(`${localDate(today)}T12:00:00`).getTime())/86400000))} ${english ? 'days' : 'días'}`:(english ? 'No date' : 'Sin fecha')}</h2>
              {exam&&<p className="mt-1 text-[12px] text-[#42506A]">{new Date(`${exam}T12:00:00`).toLocaleDateString(english ? 'en-US' : 'es-AR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</p>}
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#D8E3FF]"><div className="h-full rounded-full bg-[#5D70C4]" style={{width:`${assignedKeys.size?Math.round(100*completedCount/assignedKeys.size):0}%`}}/></div>
              <div className="mt-2 flex justify-between text-[11px] text-[#66758D]"><span>{completedCount} {english ? 'of' : 'de'} {assignedKeys.size} {english ? 'topics read' : 'temas leídos'}</span><span>{assignedKeys.size?Math.round(100*completedCount/assignedKeys.size):0}%</span></div>
            </section>
            <section className="rounded-2xl border border-[#E7EBF4] bg-white p-3.5">
              <h2 className="text-[14px] font-medium tracking-tight">{english ? "Your preparation" : "Tu preparación"}</h2>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-[#F5F7FB] p-3"><p className="text-[20px] font-semibold">{planCompletedKeys.filter(key=>assignedKeys.has(key)).length}/{assignedKeys.size}</p><p className="mt-1 text-[11px] text-[#7F8AA3]">{english ? "Topics completed" : "Temas completados"}</p></div>
                <div className="rounded-xl bg-[#F5F7FB] p-3"><p className="text-[20px] font-semibold">{preparationPercent}%</p><p className="mt-1 text-[11px] text-[#7F8AA3]">{english ? "Preparation completed" : "Preparación completada"}</p></div>
              </div>
            </section>

          </aside>
        </div>
      </section>}
    </div>}
  </main>
}
