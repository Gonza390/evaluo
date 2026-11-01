'use client';
import Link from 'next/link';
import * as React from 'react';
import { BookOpen, Check, Lightbulb, LogOut, RefreshCw, Sparkles } from 'lucide-react';

type Pair={term:string;definition:string};
type CaseQuestion={prompt:string;options:string[];answer:string};
function Header({title,materialTitle,icon,progress,total,accent}:{title:string;materialTitle:string;icon:'match'|'case';progress:number;total:number;accent:string}) {
 return <header className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-end sm:justify-between">
  <div className="min-w-0"><p className="mb-2 truncate text-xs text-slate-500">Practicar <span className="mx-1.5">/</span> {materialTitle}</p>
   <div className="flex items-center gap-3"><span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${icon==='match'?'bg-emerald-50 text-emerald-600':'bg-violet-50 text-violet-600'}`}>{icon==='match'?<span className="text-xl leading-none">↔</span>:<BookOpen size={18}/>}</span>
   <h1 className="text-[20px] font-semibold tracking-[-.035em] text-slate-900 sm:text-[22px] lg:text-[24px]">{title}</h1></div>
  </div>
  <div className="w-full sm:w-[230px] sm:shrink-0"><p className="mb-2 text-right text-xs font-medium text-slate-700">{icon==='match'?`${progress} de ${total} unidos`:`Caso ${Math.min(progress+1,total)} de ${total}`}</p><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full transition-[width] duration-300" style={{width:`${total ? progress/total*100 : 0}%`,background:accent}}/></div></div>
 </header>;
}
export function MatchPracticeScreen({materialTitle,pairs,definitions,selectedTerm,onSelectTerm,matches,onMatch,onFinish}:{materialTitle:string;pairs:Pair[];definitions:{pair:Pair;pairIndex:number}[];selectedTerm:number|null;onSelectTerm:(n:number)=>void;matches:Record<number,number>;onMatch:(term:number,definition:number)=>void;onFinish:()=>void}){
 const [submitted,setSubmitted]=React.useState(false);
 const joined=Object.keys(matches).length;
 const correct=Object.entries(matches).filter(([k,v])=>Number(k)===v).length;
 const matchOf=(index:number)=>matches[index]!==undefined;
 const definitionOwner=(index:number)=>Object.keys(matches).find(key=>matches[Number(key)]===index);
 const rowHeight=62;
 const rowY=(i:number)=>i*rowHeight+26;
 return <main className="mx-auto w-full max-w-[1000px] px-3 py-4 pb-14 sm:px-5 sm:py-5 lg:px-6">
  <div className="mb-5"><Header title="Unir conceptos" materialTitle={materialTitle} icon="match" progress={joined} total={pairs.length} accent="#2fb67c"/></div>
  <div className="grid grid-cols-2 gap-x-2 lg:grid-cols-[minmax(0,1fr)_68px_minmax(0,1fr)] lg:gap-x-0">
   <div className="space-y-1.5"><p className="mb-2 text-[10px] font-semibold tracking-[.08em] text-slate-500">CONCEPTOS</p>{pairs.map((pair,i)=>{
    const linked=matchOf(i),good=linked&&matches[i]===i;
    return <button key={pair.term+i} type="button" disabled={submitted} aria-pressed={selectedTerm===i}
     onClick={()=>onSelectTerm(i)}
     className={`flex min-h-[56px] w-full items-center justify-between gap-2 rounded-xl border px-2.5 py-2 text-left text-[12px] font-medium leading-4 transition sm:px-3 sm:text-[13px] ${submitted&&linked?(good?'border-emerald-300 bg-emerald-50 text-emerald-900':'border-rose-300 bg-rose-50 text-rose-900'):selectedTerm===i?'border-blue-600 bg-blue-50 text-slate-900 ring-2 ring-blue-100':linked?'border-blue-200 bg-blue-50/50 text-slate-900':'border-slate-200 bg-white text-slate-800 hover:border-blue-300'}`}>
      <span>{pair.term}</span>{submitted&&linked?<span className="shrink-0 text-sm">{good?'✓':'×'}</span>:linked?<span className="size-2 shrink-0 rounded-full bg-blue-500"/>:null}
     </button>;
   })}</div>
   <div aria-hidden="true" className="relative hidden lg:block"><svg className="absolute left-0 top-[27px] overflow-visible" width="68" height={pairs.length*rowHeight} viewBox={`0 0 68 ${pairs.length*rowHeight}`} fill="none">
    {Object.entries(matches).map(([key,definitionId])=>{const i=Number(key),j=definitions.findIndex(d=>d.pairIndex===definitionId);if(j<0)return null;const good=i===definitionId;return <path key={key} d={`M0 ${rowY(i)-27} C34 ${rowY(i)-27} 34 ${rowY(j)-27} 68 ${rowY(j)-27}`} stroke={submitted?(good?'#16a34a':'#e11d48'):'#3b82f6'} strokeWidth="2.5" strokeLinecap="round"/>;})}
    {!submitted&&selectedTerm!==null&&<path d={`M0 ${rowY(selectedTerm)-27} C22 ${rowY(selectedTerm)-27} 35 ${rowY(selectedTerm)-15} 56 ${rowY(selectedTerm)-15}`} stroke="#2563eb" strokeWidth="2" strokeDasharray="2 6" strokeLinecap="round"/>}
   </svg></div>
   <div className="space-y-1.5"><p className="mb-2 text-[10px] font-semibold tracking-[.08em] text-slate-500">DEFINICIONES</p>{definitions.map(({pair,pairIndex})=>{
    const owner=definitionOwner(pairIndex),linked=owner!==undefined,good=linked&&Number(owner)===pairIndex;
    return <button key={pairIndex} type="button" disabled={submitted||selectedTerm===null}
     onClick={()=>selectedTerm!==null&&onMatch(selectedTerm,pairIndex)}
     className={`flex min-h-[56px] w-full items-center justify-between gap-2 rounded-xl border px-2.5 py-2 text-left text-[11px] leading-[1.35] transition sm:px-3 sm:text-[12px] ${submitted&&linked?(good?'border-emerald-300 bg-emerald-50 text-emerald-900':'border-rose-300 bg-rose-50 text-rose-900'):linked?'border-blue-200 bg-blue-50/50 text-slate-900':selectedTerm!==null?'border-slate-200 bg-white text-slate-700 hover:border-blue-400 hover:bg-blue-50':'border-slate-200 bg-white text-slate-700'}`}>
     <span>{pair.definition}</span>{submitted&&linked?<span className="shrink-0 text-sm">{good?'✓':'×'}</span>:linked?<span className="size-2 shrink-0 rounded-full bg-blue-500"/>:null}
    </button>;
   })}</div>
  </div>
  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
   <p className="text-[12px] text-slate-600" aria-live="polite">{submitted?`${correct} de ${pairs.length} asociaciones correctas.`:selectedTerm===null?'Elegí un concepto y después su definición.':`Tocá la definición de «${pairs[selectedTerm]?.term??''}».`}</p>
   <div className="flex items-center gap-2"><Link href="/dashboard/practicar" className="inline-flex min-h-10 items-center rounded-xl px-3 text-[13px] font-medium text-slate-600">Salir</Link>
    {!submitted?<button type="button" disabled={joined!==pairs.length} onClick={()=>setSubmitted(true)} className="min-h-10 rounded-xl bg-blue-600 px-5 text-[13px] font-medium text-white disabled:opacity-40">Terminar</button>:<button type="button" onClick={onFinish} className="min-h-10 rounded-xl bg-blue-600 px-5 text-[13px] font-medium text-white">Ver resultados</button>}
   </div>
  </div>
 </main>;
}
export function CasesPracticeScreen({materialTitle,question,index,total,value,checked,correct,explanation,onSelect,onNext,onPrevious,onSkip,onGenerate,generating}:{materialTitle:string;question:CaseQuestion;index:number;total:number;value:string;checked:boolean;correct:boolean;explanation:string;onSelect:(v:string)=>void;onNext:()=>void;onPrevious:()=>void;onSkip:()=>void;onGenerate:()=>void;generating:boolean}){
 return <main className="mx-auto w-full max-w-[1000px] px-3 py-4 pb-16 sm:px-5 sm:py-5 lg:px-6">
  <Header title="Casos" materialTitle={materialTitle} icon="case" progress={index} total={total} accent="#8b4fd1"/>
  <div className="grid items-start gap-4 lg:grid-cols-[1.14fr_1fr] lg:gap-6">
   <section className="rounded-2xl border border-violet-200 bg-[#f7f3fd] p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-5"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><span className="text-[11px] font-semibold tracking-[.08em] text-violet-900">SITUACIÓN</span><span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-white px-3 py-1.5 text-[11px] font-medium text-violet-800"><Sparkles size={14}/> Generado con IA</span></div><p className="whitespace-pre-line text-[13px] leading-[1.65] text-[#272238] sm:text-[14px]">{question.prompt}</p></section>
   <section><p className="mb-4 text-[11px] font-semibold tracking-[.08em] text-slate-500">¿QUÉ CONCEPTO APLICA?</p><div className="space-y-2">{question.options.map((option,i)=><button key={i} type="button" disabled={checked} aria-pressed={value===option} onClick={()=>onSelect(option)} className={`flex min-h-[48px] w-full items-center gap-2.5 rounded-xl border px-3 py-2 text-left text-[13px] font-medium leading-5 transition sm:text-[13px] ${value===option?'border-2 border-blue-600 bg-blue-50 px-[15px] ring-4 ring-blue-100':'border-slate-200 bg-white text-slate-900 hover:border-blue-200'}`}><span className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold ${value===option?'bg-blue-600 text-white':'bg-slate-100 text-slate-600'}`}>{String.fromCharCode(65+i)}</span><span>{option}</span></button>)}</div>{checked&&<div role="status" className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-[13px] leading-6"><p className={correct?'font-medium text-emerald-700':'font-medium text-rose-700'}>{correct?'Bien resuelto':'Para reforzar'}</p>{!correct&&<p className="mt-1 text-slate-700">Respuesta: {question.answer}</p>}<p className="mt-1 text-slate-600">{explanation}</p></div>}</section>
  </div>
  <div className="mt-5 flex flex-col gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-end"><div className="flex items-center justify-end gap-2"><button type="button" onClick={onPrevious} disabled={index===0} className="min-h-11 rounded-xl px-3 text-[13px] text-slate-600 disabled:opacity-30">Anterior</button><button type="button" onClick={onSkip} className="min-h-11 rounded-xl px-3 text-[13px] text-slate-600">Saltar</button><button type="button" disabled={!checked&&!value} onClick={onNext} className="min-h-11 rounded-xl bg-blue-600 px-5 text-[13px] font-medium text-white disabled:opacity-40">{checked?(index===total-1?'Ver resultados':'Siguiente'):'Confirmar'}</button></div></div>
 </main>;
}

export function CompletePracticeScreen({materialTitle,definition,index,total,value,checked,correct,answer,explanation,onChange,onConfirm,onSkip,onPrevious}:{materialTitle:string;definition:string;index:number;total:number;value:string;checked:boolean;correct:boolean;answer:string;explanation:string;onChange:(value:string)=>void;onConfirm:()=>void;onSkip:()=>void;onPrevious:()=>void}){
 const [hint,setHint]=React.useState(false);
 React.useEffect(()=>setHint(false),[index]);
 const words=answer.trim().split(/\s+/).filter(Boolean).length;
 const initial=answer.trim().charAt(0).toLocaleUpperCase('es');
 return <main className="mx-auto w-full max-w-[1000px] px-3 py-4 pb-16 sm:px-5 sm:py-5 lg:px-6">
  <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
   <div className="min-w-0"><p className="mb-2 truncate text-xs text-slate-500">Practicar <span className="mx-1.5">/</span> {materialTitle}</p><div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-xl bg-[#fdf0df] text-[#b9792d]"><span className="text-lg font-semibold">__</span></span><h1 className="text-[20px] font-semibold tracking-[-.035em] text-slate-900 sm:text-[22px] lg:text-[24px]">Completar</h1></div></div>
   <div className="w-full sm:w-[230px] sm:shrink-0"><p className="mb-2 text-right text-xs font-medium text-slate-700">Pregunta {index+1} de {total}</p><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#e8993a] transition-[width]" style={{width:`${total?(index+1)/total*100:0}%`}}/></div></div>
  </header>
  <div className="mx-auto max-w-[700px] space-y-4">
   <section className="rounded-2xl border border-[#f3dfc2] bg-[#fdf6ec] px-4 py-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:px-6 sm:py-6"><p className="mb-4 text-[11px] font-semibold tracking-[.08em] text-[#7a4310]">DEFINICIÓN</p><p className="text-[15px] font-medium leading-[1.55] text-[#1e1b2e] sm:text-[16px]"><span className="mr-1 inline-block min-w-[90px] border-b-[3px] border-[#e8993a] align-baseline sm:min-w-[150px]">&nbsp;</span>: {definition}</p></section>
   <section><label htmlFor="practice-complete-answer" className="mb-3 block text-[11px] font-semibold tracking-[.08em] text-slate-500">TU RESPUESTA</label><input id="practice-complete-answer" value={value} disabled={checked} onChange={e=>onChange(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&value.trim()&&!checked)onConfirm();}} placeholder="Escribí el concepto" autoComplete="off" maxLength={120} className="h-11 w-full rounded-xl border-2 border-blue-600 bg-white px-3 text-[14px] font-medium text-slate-900 outline-none ring-4 ring-blue-100 placeholder:font-normal placeholder:text-slate-400 focus-visible:ring-blue-200 sm:text-[15px]"/>
   {hint&&<div className="mt-4 flex flex-wrap gap-2" aria-live="polite"><span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">{words} {words===1?'palabra':'palabras'}</span><span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">Empieza con {initial}</span></div>}
   {checked&&<div role="status" className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6"><p className={correct?'font-medium text-emerald-700':'font-medium text-rose-700'}>{correct?'Bien resuelto':'Para reforzar'}</p>{!correct&&<p className="mt-1 text-slate-800">Respuesta: {answer}</p>}<p className="mt-1 text-slate-600">{explanation}</p></div>}
   </section>
   <div className="flex flex-wrap items-center justify-between gap-3"><button type="button" onClick={()=>setHint(true)} disabled={hint||checked} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium text-slate-600 disabled:opacity-50"><Lightbulb size={16}/> Pista</button><div className="flex items-center gap-2"><button type="button" disabled={index===0} onClick={onPrevious} className="min-h-11 rounded-xl px-3 text-sm text-slate-600 disabled:opacity-30">Anterior</button><button type="button" onClick={onSkip} className="min-h-11 rounded-xl px-3 text-sm font-medium text-slate-600">Saltar</button><button type="button" onClick={onConfirm} disabled={!checked&&!value.trim()} className="min-h-11 rounded-xl bg-blue-600 px-5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-40">{checked?(index===total-1?'Ver resultados':'Siguiente'):'Comprobar'}</button></div></div>
  </div>
 </main>;
}

export function MixedPracticeScreen({materialTitle,prompt,options,index,total,value,checked,correct,answer,explanation,onSelect,onConfirm,onSkip}:{materialTitle:string;prompt:string;options:string[];index:number;total:number;value:string;checked:boolean;correct:boolean;answer:string;explanation:string;onSelect:(s:string)=>void;onConfirm:()=>void;onSkip:()=>void}){
 const isBoolean=options.length===2&&options.every(v=>/^(verdadero|falso)$/i.test(v.trim()));
 const subtype=isBoolean?'Verdadero o falso':'Opción múltiple';
 return <main className="mx-auto w-full max-w-[1000px] px-3 py-4 pb-16 sm:px-5 sm:py-5 lg:px-6">
  <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
   <div className="min-w-0"><p className="mb-2 truncate text-xs text-slate-500">Practicar <span className="mx-1.5">/</span> {materialTitle}</p><div className="flex flex-wrap items-center gap-3"><span className="flex size-9 items-center justify-center rounded-xl bg-[#e6f6ef] text-[#2fb67c]"><Check size={18}/></span><h1 className="text-[20px] font-semibold tracking-[-.035em] text-slate-900 sm:text-[22px] lg:text-[24px]">Mixto</h1><span className="rounded-full bg-[#e6f6ef] px-3 py-1.5 text-xs font-medium text-[#14634a]">{subtype}</span></div></div>
   <div className="w-full sm:w-[230px] sm:shrink-0"><p className="mb-2 text-right text-xs font-medium text-slate-700">Pregunta {index+1} de {total}</p><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#2fb67c] transition-[width]" style={{width:`${total?(index+1)/total*100:0}%`}}/></div></div>
  </header>
  <div className="mx-auto max-w-[700px] space-y-4">
   <section className="rounded-2xl border border-[#cdeadb] bg-[#f1faf6] px-4 py-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:px-6 sm:py-6"><p className="mb-4 text-[11px] font-semibold tracking-[.08em] text-[#14634a]">{isBoolean?'AFIRMACIÓN':'PREGUNTA'}</p><p className="text-[15px] font-medium leading-[1.55] text-[#1e1b2e] sm:text-[16px]">{prompt}</p></section>
   <div className={isBoolean?'grid grid-cols-2 gap-2 sm:gap-3':'grid grid-cols-1 gap-3 sm:grid-cols-2'}>{options.map((option,i)=>{const selected=value===option;return <button key={i} type="button" aria-pressed={selected} disabled={checked} onClick={()=>onSelect(option)} className={`relative flex min-h-[64px] items-center justify-center gap-2 rounded-xl border px-3 py-3 text-[14px] font-medium transition sm:min-h-[68px] sm:text-[15px] ${selected?'border-2 border-blue-600 bg-blue-50 text-slate-900 ring-4 ring-blue-100':'border-slate-200 bg-white text-slate-900 hover:border-blue-300'}`}><span className="text-[18px] font-medium">{isBoolean?(option.trim().toLowerCase()==='verdadero'?'✓':'×'):String.fromCharCode(65+i)}</span><span className="min-w-0 break-words">{option}</span><kbd className="absolute right-2 top-2 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-500">{isBoolean?(option.toLowerCase()==='verdadero'?'V':'F'):String.fromCharCode(65+i)}</kbd></button>})}</div>
   {checked&&<div role="status" className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6"><p className={correct?'font-medium text-emerald-700':'font-medium text-rose-700'}>{correct?'Bien resuelto':'Para reforzar'}</p>{!correct&&<p className="mt-1 text-slate-700">Respuesta: {answer}</p>}<p className="mt-1 text-slate-600">{explanation}</p></div>}
   <div className="flex items-center justify-between gap-3"><button type="button" onClick={onSkip} className="min-h-11 rounded-xl px-3 text-sm font-medium text-slate-600">Saltar</button><button type="button" disabled={!checked&&!value} onClick={onConfirm} className="min-h-11 rounded-xl bg-blue-600 px-6 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-40">{checked?(index===total-1?'Ver resultados':'Siguiente'):'Confirmar'}</button></div>
  </div>
 </main>;
}
