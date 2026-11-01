'use client';
import { useEffect,useState } from 'react';
const labels:Record<string,string>={unir:'Unir conceptos',completar:'Completar',casos:'Casos',mixto:'Mixto',opciones:'Opciones',simulacro:'Simulacro de examen',flashcards:'Flashcards'};
export function PracticePreparing({mode,ready=false}:{mode:string;ready?:boolean}){
 const [leaving,setLeaving]=useState(false);
 useEffect(()=>{if(!ready){setLeaving(false);return;}const timer=window.setTimeout(()=>setLeaving(true),80);return()=>window.clearTimeout(timer);},[ready]);
 return <main role="status" aria-live="polite" className={`flex min-h-[min(680px,75dvh)] w-full items-center justify-center bg-white px-5 py-10 transition-all duration-300 ease-out motion-reduce:transition-none ${leaving?'translate-y-[-8px] opacity-0':'translate-y-0 opacity-100'}`}>
  <div className="flex flex-col items-center text-center"><img src="/evi-armando.svg" width={260} height={260} alt="Evi armando tu práctica" className="mb-5 h-auto w-[210px] sm:w-[260px]"/>
   <h1 className="text-[25px] font-semibold tracking-[-.035em] text-slate-900 sm:text-[31px]">Armando tu práctica<span aria-hidden="true" className="inline-flex"><span className="animate-pulse">.</span><span className="animate-pulse [animation-delay:200ms]">.</span><span className="animate-pulse [animation-delay:400ms]">.</span></span></h1>
   <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#e6f6ef] px-4 py-2 text-[13px] font-semibold text-[#14634a]"><span className="size-2.5 rounded-[3px] bg-[#2fb67c]"/>{labels[mode]??'Practicar'}</span>
  </div>
 </main>;
}
