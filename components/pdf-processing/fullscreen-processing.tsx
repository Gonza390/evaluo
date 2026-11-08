'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, BookOpen, Check, CheckCircle2, Lightbulb, Loader2, RotateCcw } from 'lucide-react';
import type { StudentMaterialProcessingState } from '@/app/dashboard/materiales/actions';
import { processStudentMaterialAction } from '@/app/dashboard/materiales/processing-actions';
import { fetchStudentMaterialProcessingState } from '@/lib/student-materials/processing-state-client';
import { createSingleFlightPolling } from '@/lib/student-materials/processing-polling';
import { getStudentMaterialRoute } from '@/lib/routes';
import './fullscreen-processing.css';
import { useOptionalAppLocale } from '@/components/i18n/app-locale-provider';
import { EnglishProcessingScene } from './english-processing-scene';

const STEPS = ['Organizar', 'Entender', 'Memorizar', 'Practicar'] as const;
const ENGLISH_STEPS = ['Organize', 'Understand', 'Remember', 'Practice'] as const;
const SCENE_MS = 6500;

const titles = [
  'Estamos organizando tu material',
  'Primero, entendé lo importante',
  'Recordá lo que aprendiste',
  'Practicá y descubrí qué reforzar',
];
const englishTitles = ['Organizing your material', 'Understanding the essentials', 'Preparing active recall', 'Building meaningful practice'];
const englishDescriptions = [
  'Identifying the main concepts and sections of your document.',
  'Preparing focused explanations grounded in your source.',
  'Creating flashcards and important terms to review.',
  'Preparing questions and feedback to check your understanding.',
];
const descriptions = [
  'Transformamos tus apuntes en un recorrido de estudio organizado por temas.',
  'Vas a poder estudiar cada tema sin perder de vista tu material original.',
  'Usá tarjetas y conceptos clave para repasar antes de practicar.',
  'Cada práctica te ayuda a identificar qué entendiste y qué necesitás reforzar.',
];

function ExampleTag() {
  return <span className="rounded-full border border-[#dbe6f8] bg-white px-2.5 py-0.5 text-[10px] font-semibold text-[#3c6cba]">Ejemplo</span>;
}
function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#344054]">{children}</p>;
}
function ExampleDocument() {
  const lines = [56,94,88,92,60,42,90,96,70,48,93,86,52];
  return <section className="flex min-w-0 flex-1 flex-col gap-3.5 rounded-[20px] border border-[#e3eaf5] bg-[#f8faff] p-3.5 shadow-[0_6px_20px_rgba(20,60,140,0.035)] sm:p-4">
    <Label>TU DOCUMENTO</Label>
    <div aria-hidden="true" className="relative flex min-h-[165px] flex-1 flex-col gap-1.5 overflow-hidden rounded-2xl border border-[#dbe6f8] bg-white p-4 sm:min-h-[205px]">
      {lines.map((width, index) => <div key={index} className={`shrink-0 rounded-[5px] ${index === 0 || index === 5 || index === 9 ? 'h-2 bg-[#c9d1e0]' : index===6||index===7 ? 'h-1.5 bg-[#ede4c7]' : 'h-1.5 bg-[#e8ecf2]'}`} style={{ width: `${width}%` }} />)}
      <div className="pointer-events-none absolute inset-x-0 top-[48%] h-12 border-y border-[#3c6cba] bg-[#3c6cba]/[.08]" />
    </div>
  </section>;
}
function TopicsExample() {
  return <section className="flex min-w-0 flex-[1.1] flex-col gap-3.5 rounded-[20px] border border-[#e8ecf2] bg-white p-3.5 sm:p-[22px]">
    <Label>TEMAS DETECTADOS</Label>
    {[
      ['Oferta y demanda', 'Ley de la demanda · Curva de oferta · Equilibrio'],
      ['Elasticidad', 'Elasticidad precio · Demanda inelástica'],
      ['Costos de producción', ''],
    ].map(([name, detail], index) => <div className="flex gap-3" key={name}>
      <span className="flex size-[24px] shrink-0 items-center justify-center rounded-full bg-[#eaf0fb] text-[12px] font-bold text-[#2a5193]">{index+1}</span>
      <div className="min-w-0">
        <p className="text-[14px] font-semibold text-[#0f1623]">{name}</p>
        {detail ? <p className="mt-1 text-[12px] leading-5 text-[#667085]">{detail}</p> : null}
      </div>
    </div>)}
    {[1,2].map(i=><div key={i} className="flex items-center gap-3 opacity-50"><span className="size-[24px] rounded-full bg-[#f2f4f7]"/><div className="h-2 w-2/3 rounded-full bg-[#e8ecf2]"/></div>)}
  </section>;
}
function SceneOrganize() {
  return <div data-processing-layout="organize" className="mx-auto flex w-full max-w-[800px] flex-col items-stretch justify-center gap-4 lg:flex-row">
    <ExampleDocument/><div data-processing-arrow aria-hidden="true" className="flex items-center justify-center text-[#3c6cba] lg:-mx-1"><ArrowRight className="size-4 rotate-90 lg:rotate-0"/></div><TopicsExample/>
  </div>;
}
function SceneUnderstand({fileName}: {fileName:string}) {
  return <div data-processing-layout="understand" className="mx-auto flex w-full max-w-[800px] flex-col items-stretch justify-center gap-4 lg:flex-row">
    <section aria-label="Ejemplo de resumen de un tema" className="flex min-w-0 flex-[1.6] flex-col gap-3 rounded-[20px] border border-[#e3eaf5] bg-gradient-to-b from-[#f3f7ff] to-white px-4 py-4 shadow-[0_6px_20px_rgba(20,60,140,0.035)] sm:px-5 sm:py-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><Label>TEMA 2 · RESUMEN</Label><ExampleTag/></div>
      <h2 className="text-[18px] font-bold leading-[1.2] tracking-[-.02em] text-[#0f1623] sm:text-[21px]">Elasticidad precio de la demanda</h2>
      <p className="text-[13px] leading-[1.55] text-[#344054] sm:text-[14px]">Mide cuánto cambia la cantidad demandada de un bien cuando varía su precio. Si la demanda es <span className="rounded-md bg-[#f5f1e0] px-1.5 py-0.5 font-semibold text-[#0f1623]">elástica</span>, una pequeña suba de precio reduce mucho las ventas.</p>
      <p className="text-[13px] leading-[1.55] text-[#344054] sm:text-[14px]">En cambio, si es <span className="rounded-md bg-[#f5f1e0] px-1.5 py-0.5 font-semibold text-[#0f1623]">inelástica</span>, los compradores casi no reaccionan. Pasa con los bienes de primera necesidad.</p>
      <div className="mt-0.5 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-[12px] font-semibold text-[#4b5565]">Conceptos clave</span>
        {['Elasticidad','Demanda inelástica','Bien sustituto'].map(item=><span key={item} className="rounded-full bg-[#eaf0fb] px-3 py-1.5 text-[12px] font-semibold text-[#2a5193]">{item}</span>)}
      </div>
      <div className="mt-2"><div className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#3c6cba] px-4 text-[13px] font-semibold text-white shadow-[0_8px_20px_rgba(11,99,229,.20)]" aria-label="Ejemplo de botón, no disponible durante el procesamiento"><BookOpen size={18}/> Practicar este tema</div></div>
    </section>
    <section aria-label="Fragmento de tu material original" className="flex min-w-0 flex-1 flex-col gap-3 rounded-[20px] border border-[#e8ecf2] bg-white p-3.5 shadow-[0_5px_18px_rgba(20,40,80,0.03)] sm:p-4 lg:max-w-[290px]">
      <Label>EN TU MATERIAL</Label>
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-[26px] shrink-0 items-center justify-center rounded-md bg-[#bb5654] text-[9px] font-bold text-white">PDF</span>
        <div className="min-w-0"><p className="truncate text-[13px] font-semibold">{fileName}</p><p className="text-[12px] text-[#667085]">Página 14</p></div>
      </div>
      <div className="flex flex-1 flex-col gap-2.5 rounded-2xl border border-[#dbe6f8] bg-[#f8faff] px-3.5 py-4">
        {[90,82,94,88,64,86].map((width,index)=><div key={index} className={`h-2 rounded ${index===2||index===3?'bg-[#ede4c7]':'bg-[#e1e6ef]'}`} style={{width:`${width}%`}} />)}
      </div>
      <p className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#3c6cba]">Ver en el documento <ArrowRight size={16}/></p>
    </section>
  </div>;
}
function SceneMemorize() {
  return <div data-processing-layout="memorize" className="mx-auto flex w-full max-w-[800px] flex-col items-start justify-center gap-4 lg:flex-row">
    <section aria-label="Ejemplo de flashcard" className="w-full min-w-0 flex-[1.5] pb-5 lg:max-w-[540px]">
      <div className="flex min-h-[205px] flex-col justify-between gap-4 rounded-[20px] border border-[#cfdcf5] bg-gradient-to-b from-[#f3f7ff] to-white px-4 py-5 shadow-[0_10px_0_-5px_#e4ecfa,0_18px_0_-10px_#f0f4fc,0_12px_26px_rgba(20,60,140,0.05)] sm:min-h-[230px] sm:px-5 sm:py-5">
        <div className="flex items-center justify-between gap-3"><Label>PREGUNTA</Label><ExampleTag/></div>
        <p className="text-[19px] font-bold leading-[1.25] tracking-[-.025em] sm:text-[22px]">¿Qué mide la elasticidad precio de la demanda?</p>
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex min-h-[40px] items-center gap-2.5 rounded-full bg-[#3c6cba] px-5 text-[13px] font-semibold text-white shadow-[0_8px_20px_rgba(11,99,229,.20)]" aria-label="Ejemplo de tarjeta, no disponible durante el procesamiento">Ver respuesta</div>
          <span className="text-[13px] text-[#4b5565]">Pensala antes de darla vuelta.</span>
        </div>
      </div>
    </section>
    <section aria-label="Ejemplo de glosario" className="flex w-full min-w-0 flex-1 flex-col rounded-[20px] border border-[#e8ecf2] bg-white px-4 pb-2 pt-4 shadow-[0_5px_18px_rgba(20,40,80,0.03)] sm:px-[22px] lg:max-w-[320px]">
      <div className="pb-3.5"><Label>GLOSARIO</Label></div>
      {[
        ['Elasticidad','Sensibilidad de la cantidad demandada ante un cambio en el precio.'],
        ['Demanda inelástica','Los compradores casi no ajustan su consumo cuando el precio cambia.'],
        ['Bien sustituto','Producto que puede reemplazar a otro cuando este se encarece.']
      ].map(([term,definition])=><div className="flex flex-col gap-1 border-t border-[#e8ecf2] py-2.5" key={term}>
        <h3 className="text-[14px] font-bold text-[#0f1623]">{term}</h3>
        <p className="text-[13px] leading-[1.5] text-[#4b5565]">{definition}</p>
      </div>)}
    </section>
  </div>;
}
function ScenePractice() {
  return <div data-processing-layout="practice" className="mx-auto flex w-full max-w-[800px] flex-col gap-4 lg:flex-row">
    <section className="min-w-0 flex-[1.6] space-y-4 rounded-[20px] border border-[#e8ecf2] bg-white p-3.5 shadow-[0_6px_20px_rgba(20,60,140,0.035)] sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2"><Label>PRÁCTICA · PREGUNTA 3</Label><ExampleTag/></div>
      <h2 className="text-[16px] font-bold leading-6 tracking-[-.02em] text-[#0f1623] sm:text-[18px]">Si la demanda de un bien es elástica y su precio sube, ¿qué pasa con la cantidad demandada?</h2>
      <div className="space-y-2.5">
        {['Aumenta','Se mantiene igual','Disminuye bastante'].map((answer,index)=><div key={answer} className={`flex items-center gap-3 rounded-2xl border-[1.5px] p-3 text-left text-[13px] font-medium ${index===1?'border-[#edaba5] bg-[#fff1f0] text-[#a04034]':'border-[#d0d5dd] bg-white text-[#344054]'}`}>
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-current/20">{String.fromCharCode(65+index)}</span>
          <span className="flex-1">{answer}</span>{index===1?<span className="text-[12px] font-semibold">Incorrecta</span>:null}
        </div>)}
      </div>
      <div className="space-y-2.5 rounded-[17px] border border-[#dbe6f8] bg-[#f8faff] p-3.5 sm:p-4">
        <p className="flex items-center gap-2 text-[14px] font-bold text-[#0f1623]"><Lightbulb size={18} className="text-[#3c6cba]"/> Casi. Así se razona esta pregunta</p>
        <p className="text-[13px] leading-6 text-[#344054]">Cuando la demanda es elástica, los compradores reaccionan mucho al precio. Por eso, si el precio sube, la cantidad demandada baja más que proporcionalmente.</p>
        <p className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#3c6cba]">Repasar en el resumen del tema <ArrowRight size={15}/></p>
      </div>
    </section>
    <section className="min-w-0 flex-1 space-y-4 rounded-[20px] border border-[#e8ecf2] bg-white p-3.5 sm:p-4 lg:max-w-[245px]">
      <Label>TU AVANCE</Label>
      <div className="flex flex-wrap gap-2">{[1,2,3,4,5].map(i=><span key={i} className={`flex size-8 items-center justify-center rounded-full text-[12px] font-semibold ${i<3?'bg-[#067647] text-white':i===3?'bg-[#ba5649] text-white':'border-2 border-[#d0d5dd] text-[#667085]'}`}>{i<3?<Check size={16}/>:i===3?'×':i}</span>)}</div>
      <div className="space-y-2 border-t border-[#e8ecf2] pt-4">
        <p className="text-[12px] font-semibold text-[#4b5565]">Para reforzar</p>
        <span className="inline-flex rounded-full bg-[#f5f1e0] px-3.5 py-2 text-[12px] font-semibold text-[#7a5500]">Elasticidad</span>
      </div>
    </section>
  </div>;
}

function ProcessingScene({ scene, fileName }: {scene:number; fileName:string}) {
  const parts=[<SceneOrganize key="organize"/>,<SceneUnderstand key="understand" fileName={fileName}/>,<SceneMemorize key="memorize"/>,<ScenePractice key="practice"/>];
  return <div className="w-full" data-pdf-processing-scene-content>{parts[scene] ?? parts[3]}</div>;
}

/** Keep every complete illustration visible within one viewport, including small screens. */
function ProcessingFit({children,sceneKey}:{children:React.ReactNode;sceneKey:number|string}) {
  const viewportRef=useRef<HTMLDivElement>(null);
  const contentRef=useRef<HTMLDivElement>(null);
  const [scale,setScale]=useState(1);
  useLayoutEffect(()=>{
    const viewport=viewportRef.current,content=contentRef.current;
    if(!viewport||!content)return;
    const fit=()=>{
      const vh=viewport.clientHeight,vw=viewport.clientWidth;
      const h=content.scrollHeight,w=content.scrollWidth;
      if(!vh||!vw||!h||!w)return;
      const next=Math.max(0.1,Math.min(1,(vh-6)/h,(vw-6)/w));
      setScale(current=>Math.abs(current-next)>0.005?next:current);
    };
    const observer=new ResizeObserver(fit);
    observer.observe(viewport);
    observer.observe(content);
    fit();
    return ()=>observer.disconnect();
  },[sceneKey]);
  return <div data-processing-fit-viewport ref={viewportRef} className="relative min-h-0 w-full flex-1 overflow-hidden">
    <div data-processing-fit-content ref={contentRef} className="absolute left-1/2 top-1/2 w-full max-w-[800px]"
      style={{transform:`translate(-50%, -50%) scale(${scale})`,transformOrigin:'center center'}}>
      {children}
    </div>
  </div>;
}

export function FullscreenProcessing({ initialState, preview = false }: {initialState: StudentMaterialProcessingState; preview?: boolean}) {
  const router=useRouter();
  const english = useOptionalAppLocale() === 'en';
  const [state,setState]=useState(initialState);
  const [elapsed,setElapsed]=useState(0);
  const [previewScene,setPreviewScene]=useState(0);
  const [visibleScene,setVisibleScene]=useState(0);
  const [sceneExiting,setSceneExiting]=useState(false);
  const sceneTransitionRef=useRef<number|null>(null);
  const [retrying,setRetrying]=useState(false);
  const [connectionIssues,setConnectionIssues]=useState(false);
  const [poller]=useState(()=>createSingleFlightPolling<StudentMaterialProcessingState|null>());
  const materialId=initialState.materialId;
  const ready=preview ? previewScene===4 : state.status==='ready';
  const failed=!preview && state.status==='failed';
  const progress=preview ? [18,41,68,92,100][previewScene] : ready?100:Math.min(96,Math.max(0,state.progress));
  const scene=preview ? Math.min(3,previewScene) : Math.min(3,Math.floor(elapsed/SCENE_MS));
  useEffect(()=>{
    if(!preview||previewScene>=4)return;
    const timer=window.setTimeout(()=>setPreviewScene(current=>Math.min(4,current+1)),SCENE_MS);
    return ()=>window.clearTimeout(timer);
  },[preview,previewScene]);
  useEffect(()=>{
    if(ready||failed)return;
    if(scene===visibleScene)return;
    setSceneExiting(true);
    sceneTransitionRef.current=window.setTimeout(()=>{
      setVisibleScene(scene);
      setSceneExiting(false);
      sceneTransitionRef.current=null;
    },160);
    return ()=>{
      if(sceneTransitionRef.current!==null){window.clearTimeout(sceneTransitionRef.current);sceneTransitionRef.current=null;}
    };
  },[scene,visibleScene,ready,failed,preview]);
  useEffect(()=>{
    if(preview||ready||failed)return;
    const started=Date.now();
    const timer=window.setInterval(()=>setElapsed(Date.now()-started),250);
    return ()=>window.clearInterval(timer);
  },[ready,failed,preview]);
  useEffect(()=>{
    if(preview||ready||failed)return;
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
  },[ready,failed,materialId,poller,router,preview]);
  useEffect(()=>{
    if(preview||initialState.status!=='uploaded')return;
    void processStudentMaterialAction(materialId).catch(()=>undefined);
  },[materialId,initialState.status,preview]);
  const retry=useCallback(async()=>{
    if(preview||retrying)return;
    setRetrying(true);
    setState(current=>({...current,status:'processing',stage:'extracting',error:null,message:english?'Retrying processing…':'Reintentando procesamiento…'}));
    try{await processStudentMaterialAction(materialId)}catch{setConnectionIssues(true)}
    finally{setRetrying(false)}
  },[materialId,retrying,preview,english]);
  const readHref=`${getStudentMaterialRoute(materialId)}?inicio=1${state.isFirstReadyMaterial && !english?'&recorrido=1':'&tab=resumen'}`;
  return <main data-pdf-processing-screen className="flex h-dvh min-h-0 w-full min-w-0 flex-col overflow-hidden bg-white font-sans text-[#0f1623]">
    <header className="grid shrink-0 grid-cols-2 items-center gap-x-3 gap-y-1.5 border-b border-[#e8ecf2] px-3.5 py-2 sm:grid-cols-3 sm:gap-x-4 sm:px-6 sm:py-2.5 lg:px-8">
      <div className="col-start-1 row-start-1 flex min-w-0 items-center gap-2.5" aria-label="Evaluo">
        <Image src="/evaluo-logo-icono.svg" width={24} height={24} alt="" className="size-6 object-contain"/>
        <span className="text-[14px] font-bold tracking-[-.01em]">Evaluo</span>
      </div>
      {!ready?<div data-processing-file-name className="col-span-2 row-start-2 flex min-w-0 items-center justify-center gap-2 sm:col-span-1 sm:col-start-2 sm:row-start-1">
        <span className="flex h-6 w-[22px] shrink-0 items-center justify-center rounded-md bg-[#bb5654] text-[9px] font-semibold text-white">{state.fileName.toLowerCase().endsWith('.docx')?'DOC':'PDF'}</span>
        <span title={state.fileName} className="max-w-[min(72vw,280px)] truncate text-[11px] font-medium text-[#42506A] sm:max-w-[190px] sm:text-[12px] lg:max-w-[250px]">{state.fileName}</span>
      </div>:null}
      <div className="col-start-2 row-start-1 flex w-full max-w-[280px] min-w-0 items-center justify-self-end gap-2.5 sm:col-start-3 sm:gap-3">
        <div role="progressbar" aria-label={english ? 'Document processing progress' : state.message||'Progreso del procesamiento'} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#e8ecf2]">
          <div className={`h-full rounded-full transition-[width] duration-500 ${ready?'bg-[#067647]':'bg-[#3c6cba]'}`} style={{width:`${progress}%`}}/>
        </div>
        <span className={`min-w-12 text-right text-[12px] font-bold tabular-nums ${ready?'text-[#067647]':''}`}>{progress} %</span>
      </div>
    </header>
    <div data-processing-content className="flex min-h-0 min-w-0 flex-1 flex-col px-3 py-2 sm:px-5 sm:py-3 lg:px-8">
      <ProcessingFit sceneKey={ready?'ready':failed?'failed':visibleScene}>
      {failed? <section data-processing-final-motion role="alert" className="mx-auto w-full max-w-[600px] space-y-5 rounded-[22px] border border-[#e3eaf5] bg-[#f8faff] p-5 text-center">
        <h1 className="text-[22px] font-bold">{english ? "We couldn't process your document" : 'No pudimos procesar tu material'}</h1>
        <p className="text-[13px] text-[#4b5565]">{english ? 'Processing was interrupted. Try again or return later.' : state.error||state.message}</p>
        <div className="flex flex-wrap justify-center gap-3"><button type="button" disabled={retrying} onClick={()=>void retry()} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#3c6cba] px-5 text-sm font-semibold text-white disabled:opacity-50"><RotateCcw size={16}/> {english ? 'Try again' : 'Reintentar'}</button><Link href="/dashboard" className="inline-flex min-h-11 items-center rounded-full border border-[#dbe6f8] px-5 text-sm font-semibold">{english ? 'Back to my study space' : 'Volver a Mi espacio'}</Link></div>
      </section> : ready? <section data-processing-ready data-processing-final-motion className="mx-auto flex w-full max-w-[660px] flex-col items-center rounded-[20px] border border-[#e3eaf5] bg-gradient-to-b from-[#f3f7ff] to-white px-4 py-5 text-center sm:px-6 sm:py-6">
        <Image src="/evi-procesamiento-listo.svg" alt="" width={96} height={96} className="mx-auto size-20 object-contain sm:size-24"/>
        <span className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#c3e7d0] bg-[#f1fbf5] px-3.5 py-1.5 text-[12px] font-semibold text-[#067647]"><CheckCircle2 size={15}/> {english ? 'Processing complete' : 'Procesamiento completo'}</span>
        <h1 className="mt-4 text-[21px] font-bold leading-tight tracking-[-.03em] sm:text-[27px]">{english ? 'Your document is ready to study' : 'Tu material está listo para estudiar'}</h1>
        <p className="mt-3 max-w-[480px] text-[13px] leading-6 text-[#4b5565] sm:text-[14px]">{english ? 'Start with your first topic, then learn at your own pace.' : 'Ya podés comenzar por el primer tema y avanzar a tu ritmo.'}</p>
        <div className="mt-5 flex w-full max-w-[520px] flex-wrap items-center gap-3 rounded-[17px] border border-[#dbe6f8] bg-white p-3.5 text-left">
          <span className="flex h-11 w-9 shrink-0 items-center justify-center rounded-lg bg-[#bb5654] text-[12px] font-bold text-white">{state.fileName.toLowerCase().endsWith('.docx')?'DOC':'PDF'}</span>
          <div className="min-w-0 flex-1"><p className="truncate text-[14px] font-semibold">{state.fileName}</p><p className="mt-2 text-[12px] text-[#667085]">{english ? 'Topic summaries · Flashcards and glossary · Practice' : 'Resúmenes por tema · Tarjetas y glosario · Práctica'}</p></div>
        </div>
        <div className="mt-5 flex w-full max-w-[290px] flex-col gap-3">
          <Link href={readHref} aria-disabled={preview||undefined} onClick={preview?(event)=>event.preventDefault():undefined} tabIndex={preview?-1:undefined} className="flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#3c6cba] px-5 text-[14px] font-semibold text-white hover:bg-[#2a5193]" >{english ? 'Start studying' : 'Empezar a estudiar'} <ArrowRight size={17}/></Link>
          <Link href={`/dashboard/plan-de-estudio/preparar?material=${encodeURIComponent(materialId)}`} aria-disabled={preview||undefined} onClick={preview?(event)=>event.preventDefault():undefined} tabIndex={preview?-1:undefined} className="flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#dbe6f8] bg-white px-4 text-[13px] font-semibold text-[#3c6cba] hover:bg-[#eef4ff]" >{english ? 'Create my study plan' : 'Preparar mi plan de estudios'}</Link>
        </div>
      </section> : <div data-processing-scene-stage className="mx-auto flex w-full max-w-[850px] flex-1 flex-col items-center justify-center gap-4 sm:gap-5">
        <div data-processing-scene-motion data-phase={sceneExiting?'exit':'enter'} key={visibleScene} className="flex w-full flex-col items-center gap-4 sm:gap-5">
        <div className="w-full space-y-2 text-center">
          <h1 className="text-[21px] font-bold leading-tight tracking-[-.03em] sm:text-[25px] lg:text-[27px]">{english ? englishTitles[visibleScene] : titles[visibleScene]}</h1>
          <p className="mx-auto max-w-[480px] text-[13px] leading-6 text-[#4b5565] sm:text-[14px]">{english ? englishDescriptions[visibleScene] : descriptions[visibleScene]}</p>
        </div>
        {english ? <EnglishProcessingScene scene={visibleScene} fileName={state.fileName}/> : <ProcessingScene scene={visibleScene} fileName={state.fileName}/>}
        </div>
        <span className="sr-only" role="status">{english ? (connectionIssues ? 'Still preparing your study materials. Reconnecting…' : 'Preparing your study materials…') : connectionIssues?'Seguimos preparando tu material. Estamos restableciendo la conexión.':state.message}</span>
      </div>}
      </ProcessingFit>
    </div>
    <footer className="flex min-w-0 shrink-0 flex-col items-start justify-between gap-1.5 border-t border-[#e8ecf2] px-3.5 py-2.5 sm:px-6 sm:py-3 lg:flex-row lg:items-center lg:px-8">
      <ol className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3" aria-label={english ? 'Study workflow' : 'Recorrido de estudio'}>
        {(english ? ENGLISH_STEPS : STEPS).map((step,index)=><li key={step} className="flex items-center gap-2">
          {index>0?<span aria-hidden="true" className="mr-1 h-0.5 w-3 bg-[#e8ecf2] sm:w-6"/>:null}
          <span className={`flex size-3 items-center justify-center rounded-full ${ready?'bg-[#067647]':index===visibleScene?'bg-[#3c6cba] ring-4 ring-[#dbe6f8]':index<visibleScene?'bg-[#3c6cba]':'bg-[#d0d5dd]'}`}>{ready||index<visibleScene?<Check className="size-2.5 text-white"/>:null}</span>
          <span className={`text-[12px] sm:text-[12px] ${!ready&&index===visibleScene?'font-semibold text-[#0f1623]':'text-[#667085]'}`}>{step}</span>
        </li>)}
      </ol>
      <div className="flex min-w-0 items-start gap-3 text-[12px] leading-5 text-[#4b5565] sm:text-[12px]">
        {!ready&&!failed?<Loader2 size={16} className="mt-0.5 shrink-0 animate-spin text-[#3c6cba]"/>:<CheckCircle2 size={16} className="text-[#067647]"/>}
        <span>{english ? (failed ? 'Try again without uploading your file a second time.' : ready ? 'Everything is ready. Start whenever you like.' : connectionIssues ? 'Still processing. Reconnecting…' : visibleScene === 0 ? 'Reading your document and finding its main topics…' : visibleScene === 1 ? 'Preparing clear summaries for each topic…' : visibleScene === 2 ? 'Creating flashcards and a glossary to review…' : 'Checking and saving your study materials…') : failed?'Podés reintentar sin volver a subir el archivo.':ready?'Todo preparado. Podés empezar cuando quieras.':connectionIssues?'Seguimos procesando. Restableciendo la conexión…':visibleScene===0?'Leyendo tu documento y detectando los temas principales…':visibleScene===1?'Armando resúmenes claros para cada tema…':visibleScene===2?'Preparando tarjetas y glosario para que repases…':'Revisando y guardando todo tu material…'}</span>
      </div>

    </footer>
  </main>;
}
