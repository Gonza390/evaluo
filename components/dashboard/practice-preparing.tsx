'use client';
import { useEffect,useState } from 'react';
import { useOptionalAppLocale } from '@/components/i18n/app-locale-provider';
const labels:Record<string,string>={unir:'Unir conceptos',completar:'Completar',casos:'Casos',mixto:'Mixto',opciones:'Opciones',simulacro:'Simulacro de examen',flashcards:'Flashcards'};
export function PracticePreparing({mode,ready=false}:{mode:string;ready?:boolean}){
 const english = useOptionalAppLocale() === 'en';
 const [leaving,setLeaving]=useState(false);
 useEffect(()=>{if(!ready){setLeaving(false);return;}const timer=window.setTimeout(()=>setLeaving(true),80);return()=>window.clearTimeout(timer);},[ready]);
 return <main role="status" aria-live="polite" className={`flex min-h-[min(520px,68dvh)] w-full items-center justify-center bg-white px-5 py-10 transition-all duration-300 ease-out motion-reduce:transition-none ${leaving?'translate-y-[-8px] opacity-0':'translate-y-0 opacity-100'}`}>
  <div className="flex flex-col items-center text-center"><img src="/evi-armando.svg" width={260} height={260} alt={english ? "Evi preparing your practice" : "Evi armando tu práctica"} className="mb-3 h-auto w-[160px] sm:w-[190px]"/>
   <h1 className="text-titulo-sm font-semibold tracking-titulo text-slate-900 sm:text-titulo">{english ? 'Preparing your practice' : 'Armando tu práctica'}<span aria-hidden="true" className="inline-flex"><span className="animate-pulse">.</span><span className="animate-pulse [animation-delay:200ms]">.</span><span className="animate-pulse [animation-delay:400ms]">.</span></span></h1>
   <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#e6f6ef] px-4 py-2 text-ui font-semibold text-[#14634a]"><span className="size-2.5 rounded-[3px] bg-[#55b183]"/>{english ? ({unir:'Match concepts',completar:'Fill in the blank',casos:'Cases',mixto:'Mixed practice',opciones:'True or false',simulacro:'Mock exam',flashcards:'Flashcards'} as Record<string,string>)[mode] ?? 'Practice' : labels[mode] ?? 'Practicar'}</span>
  </div>
 </main>;
}
