'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, BookOpen, Check, CheckCircle2, FileText, Layers3, Lightbulb, Loader2, RotateCcw } from 'lucide-react';
import type { StudentMaterialProcessingState } from '@/app/dashboard/materiales/actions';
import { processStudentMaterialAction } from '@/app/dashboard/materiales/processing-actions';
import { fetchStudentMaterialProcessingState } from '@/lib/student-materials/processing-state-client';
import { createSingleFlightPolling } from '@/lib/student-materials/processing-polling';
import { getStudentMaterialRoute } from '@/lib/routes';

const STEPS = ['Organizar', 'Entender', 'Memorizar', 'Practicar'] as const;
const SCENE_MS = 6500;

const titles = [
  'Estamos organizando tu material',
  'Primero, entendé lo importante',
  'Recordá lo que aprendiste',
  'Practicá y descubrí qué reforzar',
];
const descriptions = [
  'Transformamos tus apuntes en un recorrido de estudio organizado por temas.',
  'Vas a poder estudiar cada tema sin perder de vista tu material original.',
  'Usá tarjetas y conceptos clave para repasar antes de practicar.',
  'Cada práctica te ayuda a identificar qué entendiste y qué necesitás reforzar.',
];

function ExampleTag() {
  return <span className="rounded-full border border-[#dbe6f8] bg-white px-3 py-1 text-[11px] font-semibold text-[#0b63e5]">Ejemplo</span>;
}
function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#344054]">{children}</p>;
}
function ExampleDocument() {
  const lines = [56,94,88,92,60,42,90,96,70,48,93,86,52];
  return <section className="flex min-w-0 flex-1 flex-col gap-5 rounded-[28px] border border-[#e3eaf5] bg-[#f7faff] p-5 sm:p-[22px]">
    <Label>TU DOCUMENTO</Label>
    <div aria-hidden="true" className="relative flex min-h-[225px] flex-1 flex-col gap-2 overflow-hidden rounded-2xl border border-[#dbe6f8] bg-white p-6 sm:min-h-[300px]">
      {lines.map((width, index) => <div key={index} className={`shrink-0 rounded-[5px] ${index === 0 || index === 5 || index === 9 ? 'h-3 bg-[#c9d1e0]' : index===6||index===7 ? 'h-2 bg-[#ffe28a]' : 'h-2 bg-[#e8ecf2]'}`} style={{ width: `${width}%` }} />)}
      <div className="pointer-events-none absolute inset-x-0 top-[48%] h-16 border-y-2 border-[#0b63e5] bg-[#0b63e5]/[.08]" />
    </div>
  </section>;
}
function TopicsExample() {
  return <section className="flex min-w-0 flex-[1.1] flex-col gap-5 rounded-[28px] border border-[#e8ecf2] bg-white p-5 sm:p-[26px]">
    <Label>TEMAS DETECTADOS</Label>
    {[
      ['Oferta y demanda', 'Ley de la demanda · Curva de oferta · Equilibrio'],
      ['Elasticidad', 'Elasticidad precio · Demanda inelástica'],
      ['Costos de producción', ''],
    ].map(([name, detail], index) => <div className="flex gap-3.5" key={name}>
      <span className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-[#eaf0fb] text-[13px] font-bold text-[#084bb0]">{index+1}</span>
      <div className="min-w-0">
        <p className="text-[16px] font-semibold text-[#0f1623]">{name}</p>
        {detail ? <p className="mt-1 text-[13px] leading-5 text-[#667085]">{detail}</p> : null}
      </div>
    </div>)}
    {[1,2].map(i=><div key={i} className="flex items-center gap-3.5 opacity-50"><span className="size-[30px] rounded-full bg-[#f2f4f7]"/><div className="h-2.5 w-2/3 rounded-full bg-[#e8ecf2]"/></div>)}
  </section>;
}
function SceneOrganize() {
  return <div className="mx-auto flex w-full max-w-[1040px] flex-col items-stretch justify-center gap-5 lg:flex-row">
    <ExampleDocument/><div aria-hidden="true" className="flex items-center justify-center text-[#0b63e5] lg:-mx-1"><ArrowRight className="size-6 rotate-90 lg:rotate-0"/></div><TopicsExample/>
  </div>;
}
function SceneUnderstand() {
  return <div className="mx-auto flex w-full max-w-[1040px] flex-col gap-5 lg:flex-row">
    <section className="min-w-0 flex-[1.6] rounded-[28px] border border-[#e3eaf5] bg-gradient-to-b from-[#eef4ff] to-white p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3"><Label>TEMA 2 · RESUMEN</Label><ExampleTag/></div>
      <h2 className="mt-5 text-[22px] font-bold tracking-[-.02em] text-[#0f1623] sm:text-[25px]">Elasticidad precio de la demanda</h2>
      <p className="mt-4 text-[15px] leading-7 text-[#344054]">Mide cuánto cambia la cantidad demandada de un bien cuando varía su precio. Si la demanda es <strong>elástica</strong>, una pequeña suba de precio reduce mucho las ventas.</p>
      <div className="mt-5 rounded-2xl border-l-4 border-[#0b63e5] bg-[#f7faff] p-4 text-[15px] leading-6 text-[#344054]">En cambio, si es <strong>inelástica</strong>, los compradores casi no reaccionan. Pasa con los bienes de primera necesidad.</div>
      <div className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#0b63e5] px-5 text-[14px] font-semibold text-white" aria-label="Ejemplo de botón, no disponible durante el procesamiento">Practicar este tema <ArrowRight size={16}/></div>
    </section>
    <section className="flex min-w-0 flex-1 flex-col gap-4 rounded-[28px] border border-[#e8ecf2] bg-white p-5 sm:p-6">
      <Label>TU PDF, SIEMPRE A MANO</Label>
      <div className="flex min-h-[225px] flex-1 flex-col gap-2 rounded-2xl border border-[#dbe6f8] bg-[#f7faff] p-5">
        <div className="h-3 w-2/3 rounded bg-[#c9d1e0]"/>{[90,95,70,88,65,93,78].map((w,i)=><div key={i} className={`h-2 rounded ${i===3||i===4?'bg-[#ffe28a]':'bg-[#dce3ed]'}`} style={{width:`${w}%`}}/>)}
      </div>
      <p className="text-[13px] leading-5 text-[#667085]">Estudiá el resumen sin perder de vista tus apuntes.</p>
    </section>
  </div>;
}
function SceneMemorize() {
  return <div className="mx-auto flex w-full max-w-[1040px] flex-col gap-5 lg:flex-row">
    <section className="flex min-w-0 flex-[1.2] flex-col items-center justify-center rounded-[28px] border border-[#e3eaf5] bg-gradient-to-b from-[#eef4ff] to-white p-5 text-center sm:p-8">
      <div className="mb-5 flex w-full items-center justify-between"><Label>PREGUNTA</Label><ExampleTag/></div>
      <div className="flex min-h-[235px] w-full max-w-[460px] flex-col items-center justify-center gap-5 rounded-[24px] border border-[#dbe6f8] bg-white px-6 py-9 shadow-[0_12px_34px_rgba(47,75,255,.07)]">
        <Layers3 className="size-7 text-[#0b63e5]"/>
        <p className="text-[20px] font-bold leading-7 text-[#0f1623] sm:text-[24px]">¿Qué mide la elasticidad precio de la demanda?</p>
      </div>
      <div className="mt-5 inline-flex min-h-[50px] items-center gap-2 rounded-full bg-[#0b63e5] px-7 text-[14px] font-semibold text-white" aria-label="Ejemplo de tarjeta, no disponible durante el procesamiento">Ver respuesta <ArrowRight size={16}/></div>
    </section>
    <section className="min-w-0 flex-1 space-y-5 rounded-[28px] border border-[#e8ecf2] bg-white p-5 sm:p-7">
      <Label>GLOSARIO</Label>
      {[['Elasticidad','Sensibilidad de la cantidad demandada ante un cambio en el precio.'],['Demanda inelástica','Los compradores casi no ajustan su consumo cuando el precio cambia.'],['Bien sustituto','Producto que puede reemplazar a otro cuando este se encarece.']].map(([term,definition],i)=><div className="border-b border-[#e8ecf2] pb-4 last:border-0" key={term}>
        <span className="text-[12px] font-semibold text-[#0b63e5]">0{i+1}</span>
        <h3 className="mt-1 text-[16px] font-bold text-[#0f1623]">{term}</h3>
        <p className="mt-1.5 text-[14px] leading-6 text-[#667085]">{definition}</p>
      </div>)}
    </section>
  </div>;
}
function ScenePractice() {
  return <div className="mx-auto flex w-full max-w-[1040px] flex-col gap-5 lg:flex-row">
    <section className="min-w-0 flex-[1.6] space-y-5 rounded-[28px] border border-[#e3eaf5] bg-gradient-to-b from-[#eef4ff] to-white p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-2"><Label>PRÁCTICA · PREGUNTA 3</Label><ExampleTag/></div>
      <h2 className="text-[19px] font-bold leading-7 tracking-[-.02em] text-[#0f1623] sm:text-[22px]">Si la demanda de un bien es elástica y su precio sube, ¿qué pasa con la cantidad demandada?</h2>
      <div className="space-y-2.5">
        {['Aumenta','Se mantiene igual','Disminuye bastante'].map((answer,index)=><div key={answer} className={`flex items-center gap-3.5 rounded-2xl border-[1.5px] p-3 text-left text-[14px] font-medium ${index===1?'border-[#fda29b] bg-[#fff1f0] text-[#b42318]':'border-[#d0d5dd] bg-white text-[#344054]'}`}>
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-current/20">{String.fromCharCode(65+index)}</span>
          <span className="flex-1">{answer}</span>{index===1?<span className="text-[12px] font-semibold">Incorrecta</span>:null}
        </div>)}
      </div>
      <div className="space-y-2.5 rounded-[20px] border border-[#dbe6f8] bg-[#f7faff] p-4 sm:p-5">
        <p className="flex items-center gap-2 text-[15px] font-bold text-[#0f1623]"><Lightbulb size={18} className="text-[#0b63e5]"/> Casi. Así se razona esta pregunta</p>
        <p className="text-[14px] leading-6 text-[#344054]">Cuando la demanda es elástica, los compradores reaccionan mucho al precio. Por eso, si el precio sube, la cantidad demandada baja más que proporcionalmente.</p>
        <p className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#0b63e5]">Repasar en el resumen del tema <ArrowRight size={15}/></p>
      </div>
    </section>
    <section className="min-w-0 flex-1 space-y-6 rounded-[28px] border border-[#e8ecf2] bg-white p-5 sm:p-6 lg:max-w-[300px]">
      <Label>TU AVANCE</Label>
      <div className="flex flex-wrap gap-2">{[1,2,3,4,5].map(i=><span key={i} className={`flex size-8 items-center justify-center rounded-full text-[13px] font-semibold ${i<3?'bg-[#067647] text-white':i===3?'bg-[#d92d20] text-white':'border-2 border-[#d0d5dd] text-[#667085]'}`}>{i<3?<Check size={16}/>:i===3?'×':i}</span>)}</div>
      <div className="space-y-2 border-t border-[#e8ecf2] pt-5">
        <p className="text-[13px] font-semibold text-[#4b5565]">Para reforzar</p>
        <span className="inline-flex rounded-full bg-[#fff1bd] px-4 py-2 text-[13px] font-semibold text-[#7a5500]">Elasticidad</span>
      </div>
    </section>
  </div>;
}

function ProcessingScene({ scene }: {scene:number}) {
  const parts=[<SceneOrganize key="organize"/>,<SceneUnderstand key="understand"/>,<SceneMemorize key="memorize"/>,<ScenePractice key="practice"/>];
  return <div key={scene} data-evaluo-route-enter className="w-full">{parts[scene] ?? parts[3]}</div>;
}

export function FullscreenProcessing({ initialState }: {initialState: StudentMaterialProcessingState}) {
  const router=useRouter();
  const [state,setState]=useState(initialState);
  const [elapsed,setElapsed]=useState(0);
  const [retrying,setRetrying]=useState(false);
  const [connectionIssues,setConnectionIssues]=useState(false);
  const [poller]=useState(()=>createSingleFlightPolling<StudentMaterialProcessingState|null>());
  const materialId=initialState.materialId;
  const ready=state.status==='ready',failed=state.status==='failed';
  const progress=ready?100:Math.min(96,Math.max(0,state.progress));
  const scene=Math.min(3,Math.floor(elapsed/SCENE_MS));
  useEffect(()=>{
    if(ready||failed)return;
    const started=Date.now();
    const timer=window.setInterval(()=>setElapsed(Date.now()-started),250);
    return ()=>window.clearInterval(timer);
  },[ready,failed]);
  useEffect(()=>{
    if(ready||failed)return;
    let active=true;
    const check=async()=>{
      if(document.visibilityState==='hidden')return;
      const outcome=await poller.run(()=>fetchStudentMaterialProcessingState(materialId));
      if(!active||outcome.kind==='busy')return;
      if(outcome.kind==='error'){if(outcome.consecutiveFailures>=3)setConnectionIssues(true);return;}
      setConnectionIssues(false);
      if(outcome.value){
        setState(outcome.value);
        if(outcome.value.status==='ready')router.refresh();
      }
    };
    void check();
    const timer=window.setInterval(()=>{void check()},3500);
    const visibility=()=>{if(document.visibilityState==='visible')void check()};
    document.addEventListener('visibilitychange',visibility);
    return ()=>{active=false;window.clearInterval(timer);document.removeEventListener('visibilitychange',visibility)};
  },[ready,failed,materialId,poller,router]);
  useEffect(()=>{
    if(initialState.status!=='uploaded')return;
    void processStudentMaterialAction(materialId).catch(()=>undefined);
  },[materialId,initialState.status]);
  const retry=useCallback(async()=>{
    if(retrying)return;
    setRetrying(true);
    setState(current=>({...current,status:'processing',stage:'extracting',error:null,message:'Reintentando procesamiento…'}));
    try{await processStudentMaterialAction(materialId)}catch{setConnectionIssues(true)}
    finally{setRetrying(false)}
  },[materialId,retrying]);
  const readHref=`${getStudentMaterialRoute(materialId)}?inicio=1${state.isFirstReadyMaterial?'&recorrido=1':'&tab=resumen'}`;
  return <main data-pdf-processing-screen className="flex min-h-[calc(100dvh-52px)] w-full min-w-0 flex-col bg-white font-sans text-[#0f1623] lg:min-h-[calc(100dvh-52px)]">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e8ecf2] px-4 py-4 sm:px-6 lg:px-9">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#eef4ff] text-[#0b63e5]"><FileText size={20}/></span>
        <div className="min-w-0"><p className="text-[12px] font-semibold text-[#667085]">Preparación de material</p><p className="max-w-[240px] truncate text-[14px] font-semibold sm:max-w-[360px]">{state.fileName}</p></div>
      </div>
      <div className="flex w-full items-center gap-3 sm:w-[280px]">
        <div role="progressbar" aria-label={state.message||'Progreso del procesamiento'} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} className="h-2 flex-1 overflow-hidden rounded-full bg-[#e8ecf2]">
          <div className={`h-full rounded-full transition-[width] duration-500 ${ready?'bg-[#067647]':'bg-[#0b63e5]'}`} style={{width:`${progress}%`}}/>
        </div>
        <span className={`min-w-12 text-right text-[14px] font-bold tabular-nums ${ready?'text-[#067647]':''}`}>{progress} %</span>
      </div>
    </header>
    <div className="flex flex-1 flex-col items-center justify-center gap-7 px-4 py-7 sm:gap-8 sm:px-6 lg:px-9">
      {failed? <section role="alert" className="mx-auto w-full max-w-[650px] space-y-5 rounded-[28px] border border-[#e3eaf5] bg-[#f7faff] p-7 text-center">
        <h1 className="text-[25px] font-bold">No pudimos procesar tu material</h1>
        <p className="text-[14px] text-[#4b5565]">{state.error||state.message}</p>
        <div className="flex flex-wrap justify-center gap-3"><button type="button" disabled={retrying} onClick={()=>void retry()} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#0b63e5] px-6 text-sm font-semibold text-white disabled:opacity-50"><RotateCcw size={16}/> Reintentar</button><Link href="/dashboard" className="inline-flex min-h-11 items-center rounded-full border border-[#dbe6f8] px-6 text-sm font-semibold">Volver a Mi espacio</Link></div>
      </section> : ready? <section data-processing-ready className="mx-auto flex w-full max-w-[880px] flex-col items-center rounded-[32px] border border-[#e3eaf5] bg-gradient-to-b from-[#eef4ff] to-white px-5 py-8 text-center sm:px-10 sm:py-11">
        <Image src="/evi-bienvenida.svg" alt="" width={128} height={128} className="h-24 w-24 object-contain sm:h-32 sm:w-32"/>
        <span className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#abefc6] bg-[#ecfdf3] px-4 py-1.5 text-[12px] font-semibold text-[#067647]"><CheckCircle2 size={15}/> Procesamiento completo</span>
        <h1 className="mt-4 text-[27px] font-bold leading-tight tracking-[-.03em] sm:text-[40px]">Tu material está listo para estudiar</h1>
        <p className="mt-3 max-w-[520px] text-[15px] leading-6 text-[#4b5565] sm:text-[17px]">Ya podés comenzar por el primer tema y avanzar a tu ritmo.</p>
        <div className="mt-7 flex w-full max-w-[600px] flex-wrap items-center gap-4 rounded-[24px] border border-[#dbe6f8] bg-white p-4 text-left sm:p-5">
          <span className="flex h-[54px] w-11 shrink-0 items-center justify-center rounded-lg bg-[#d92d3a] text-[12px] font-bold text-white">{state.fileName.toLowerCase().endsWith('.docx')?'DOC':'PDF'}</span>
          <div className="min-w-0 flex-1"><p className="truncate text-[16px] font-semibold">{state.fileName}</p><p className="mt-2 text-[12px] text-[#667085]">Resúmenes por tema · Tarjetas y glosario · Práctica</p></div>
        </div>
        <div className="mt-7 flex w-full max-w-[340px] flex-col gap-3">
          <Link href={readHref} className="flex min-h-14 items-center justify-center gap-2 rounded-full bg-[#0b63e5] px-6 text-[15px] font-semibold text-white hover:bg-[#084bb0]">Empezar a estudiar <ArrowRight size={17}/></Link>
          <Link href={`/dashboard/plan-de-estudio/preparar?material=${encodeURIComponent(materialId)}`} className="flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#dbe6f8] bg-white px-5 text-[14px] font-semibold text-[#0b63e5] hover:bg-[#eef4ff]">Preparar mi plan de estudios</Link>
        </div>
      </section> : <>
        <div key={scene} className="space-y-3 text-center" data-evaluo-route-enter>
          <h1 className="text-[26px] font-bold leading-tight tracking-[-.03em] sm:text-[32px] lg:text-[38px]">{titles[scene]}</h1>
          <p className="mx-auto max-w-[560px] text-[14px] leading-6 text-[#4b5565] sm:text-[17px]">{descriptions[scene]}</p>
        </div>
        <ProcessingScene scene={scene}/>
        <span className="sr-only" role="status">{connectionIssues?'Seguimos preparando tu material. Estamos restableciendo la conexión.':state.message}</span>
      </>}
    </div>
    <footer className="flex flex-col items-start justify-between gap-3 border-t border-[#e8ecf2] px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:px-9">
      <ol className="flex flex-wrap items-center gap-2 sm:gap-3" aria-label="Recorrido de estudio">
        {STEPS.map((step,index)=><li key={step} className="flex items-center gap-2">
          {index>0?<span aria-hidden="true" className="mr-1 h-0.5 w-3 bg-[#e8ecf2] sm:w-6"/>:null}
          <span className={`flex size-3 items-center justify-center rounded-full ${ready?'bg-[#067647]':index===scene?'bg-[#0b63e5] ring-4 ring-[#dbe6f8]':index<scene?'bg-[#0b63e5]':'bg-[#d0d5dd]'}`}>{ready||index<scene?<Check className="size-2.5 text-white"/>:null}</span>
          <span className={`text-[12px] sm:text-[13px] ${!ready&&index===scene?'font-semibold text-[#0f1623]':'text-[#667085]'}`}>{step}</span>
        </li>)}
      </ol>
      <div className="flex items-center gap-3 text-[12px] text-[#4b5565] sm:text-[13px]">
        {!ready&&!failed?<Loader2 size={16} className="animate-spin text-[#0b63e5]"/>:<CheckCircle2 size={16} className="text-[#067647]"/>}
        <span>{failed?'Podés reintentar sin volver a subir el archivo.':ready?'Todo preparado. Podés empezar cuando quieras.':connectionIssues?'Seguimos procesando. Restableciendo la conexión…':scene===0?'Leyendo tu documento y detectando los temas principales…':scene===1?'Organizando la guía de estudio…':scene===2?'Preparando recursos para repasar…':'Revisando y guardando todo tu material…'}</span>
      </div>
      {!ready&&!failed?<Link href="/dashboard" className="text-[12px] font-semibold text-[#0b63e5] hover:underline">Volver a Mi espacio</Link>:null}
    </footer>
  </main>;
}
