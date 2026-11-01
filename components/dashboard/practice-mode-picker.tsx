'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PracticePreparing } from '@/components/dashboard/practice-preparing';
import { PracticeHistoryPanel } from '@/components/dashboard/practice-history-panel';
import type { PracticeHistoryEntry } from '@/lib/student-materials/practice-history';
import { ArrowRight, ArrowLeft, BookOpen, Check, ChevronDown, Clock3, FileText, Layers3, ListChecks, Mic, Network, Timer, Zap } from 'lucide-react';

type Material = { id: string; title: string };
const modes = [
  { title: 'Mixto', description: 'Una mezcla de todo, como en un examen.', Icon: Zap, color: 'from-[#FBF5E7] to-[#F9EDDB] text-[#98712E]' },
  { title: 'Flashcards', description: 'Recordá y girá las tarjetas.', Icon: Layers3, color: 'from-[#ECF8FA] to-[#DDEFF5] text-[#337F99]' },
  { title: 'Opciones', description: 'Decidí si cada afirmación es verdadera o falsa.', Icon: Check, color: 'from-[#EAF6EB] to-[#DDF0E1] text-[#398052]' },
  { title: 'Unir conceptos', description: 'Relacioná términos y definiciones.', Icon: Network, color: 'from-[#E9F7F5] to-[#D8EEEB] text-[#237F7B]' },
  { title: 'Completar', description: 'Encontrá la palabra que falta.', Icon: ListChecks, color: 'from-[#FDF0E6] to-[#FAE4D5] text-[#AC6137]' },
  { title: 'Casos', description: 'Aplicá conceptos a situaciones.', Icon: BookOpen, color: 'from-[#F1EBFA] to-[#E7DDF5] text-[#6650A4]' },
  { title: 'Con tus palabras', description: 'Explicá el tema como en un oral.', Icon: Mic, color: 'from-[#FBEFF1] to-[#F8E4E9] text-[#A94968]' },
  { title: 'Simulacro de examen', description: 'Con reloj y resultados al final.', Icon: Timer, color: 'from-[#F0F1F4] to-[#E3E6EB] text-[#596477]' },
] as const;

export function PracticeModePicker({ materials, initialMaterialId, history, advancedPracticeEnabled = false }: {
  materials: Material[];
  initialMaterialId: string | null;
  history: PracticeHistoryEntry[];
  advancedPracticeEnabled?: boolean;
}) {
  const [materialId, setMaterialId] = useState(() => materials.find(m => m.id === initialMaterialId)?.id ?? materials[0]?.id ?? '');
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [prepareError, setPrepareError] = useState('');
  const [sessionLength,setSessionLength] = useState<'rapido'|'completo'>('rapido');
  const router = useRouter();
  const material = materials.find(m => m.id === materialId);
  const available = (title: string) => title !== 'Con tus palabras';
  const routes: Record<string, string> = {
    'Flashcards': `/dashboard/practicar/${materialId}/flashcards`,
    'Opciones': `/dashboard/practicar/${materialId}/opciones`,
    'Unir conceptos': `/dashboard/practicar/${materialId}/unir`,
    'Completar': `/dashboard/practicar/${materialId}/completar`,
    'Casos': `/dashboard/practicar/${materialId}/casos`,
    'Mixto': `/dashboard/practicar/${materialId}/mixto`,
    'Simulacro de examen': `/dashboard/practicar/${materialId}/simulacro`,
  };
  const href = selectedMode ? routes[selectedMode] ?? '#' : '#';

  async function startPractice() {
    if (!selectedMode || !materialId || preparing || !available(selectedMode)) return;
    const destination = href + '?repaso=' + sessionLength;
    setPrepareError('');
    if (!advancedPracticeEnabled || selectedMode === 'Flashcards' || selectedMode === 'Opciones' ||
        selectedMode === 'Unir conceptos' || selectedMode === 'Completar' || selectedMode === 'Casos') {
      router.push(destination);
      return;
    }
    setPreparing(true);
    try {
      await fetch('/api/practice/prepare', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materialId, mode: href.split('/').at(-1) }),
        signal: AbortSignal.timeout(9000),
      });
    } catch {
      // Una preparación avanzada fallida no impide empezar la práctica básica.
    } finally {
      setPreparing(false);
      router.push(destination);
    }
  }
  if (preparing) return <PracticePreparing mode={href.split('/').at(-1) ?? 'práctica'} />;

  return (
    <main className="mx-auto w-full max-w-[1310px] px-4 pb-28 pt-6 sm:px-6 sm:pt-9 lg:px-8 lg:pt-12">
      <div className="grid items-start gap-x-10 gap-y-11 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)] xl:gap-x-16">
        <section aria-labelledby="practice-heading" className="min-w-0">
          <h1 id="practice-heading" className="text-[27px] font-semibold tracking-[-0.055em] text-[#0F1B3D] sm:text-[30px]">Practicar</h1>
          <p className="mt-1 text-[12px] text-slate-500">Elegí una modalidad para poner a prueba lo que aprendiste.</p>

          {material ? (
            <>
              <div className="relative mt-5 max-w-[410px]">
                <label htmlFor="practice-material" className="mb-1.5 block text-[11px] font-medium text-slate-600">Material de estudio</label>
                <FileText aria-hidden="true" className="pointer-events-none absolute bottom-[14px] left-3 size-4 text-[#2563EB]" />
                <select id="practice-material" value={materialId} onChange={event => {
                  setMaterialId(event.target.value); setSelectedMode(null); setPrepareError('');
                }} className="min-h-11 w-full appearance-none truncate rounded-xl border border-[#E2E8F2] bg-white py-2.5 pl-10 pr-9 text-[13px] font-medium text-slate-800 outline-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20">
                  {materials.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                </select>
                <ChevronDown aria-hidden="true" className="pointer-events-none absolute bottom-[14px] right-3 size-4 text-slate-400" />
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2.5 sm:gap-3">
                {modes.map(({ title, description, Icon, color }) => {
                  const supported = available(title);
                  const selected = selectedMode === title;
                  return (
                    <button key={title} type="button" aria-pressed={selected} onClick={() => { if (!supported) return; setSelectedMode(title); setSessionLength('rapido'); }}
                      className={`group relative flex min-h-[112px] flex-col items-start rounded-[17px] border bg-gradient-to-br px-3.5 py-3 text-left outline-none transition-[border-color,box-shadow,transform] duration-150 hover:-translate-y-[1px] hover:shadow-[0_5px_15px_rgba(15,27,61,0.035)] focus-visible:ring-2 focus-visible:ring-[#2563EB] sm:min-h-[116px] sm:px-4 ${color} ${selected ? 'border-[#4F5DFF] ring-2 ring-[#4F5DFF]/20' : 'border-transparent'}`}>
                      <span className="flex w-full items-start justify-between gap-2">
                        <Icon className="size-[17px] shrink-0" aria-hidden="true" strokeWidth={1.8} />
                        {selected && <Check className="size-[16px] shrink-0 text-[#2563EB]" aria-hidden="true"/>}
                      </span>
                      <span className="mt-auto pt-3 text-[13px] font-semibold leading-[1.2]">{title}</span>
                      <span className="mt-1 line-clamp-2 text-[11px] leading-[1.35] opacity-80">{description}</span>
                      {!supported && <span className="mt-1 text-[10px] font-medium opacity-65">Próximamente</span>}
                    </button>
                  );
                })}
              </div>

            </>
          ) : (
            <div className="mt-6 rounded-xl border border-[#E7EBF4] bg-slate-50 p-5 text-sm text-slate-600">
              Todavía no tenés materiales listos para practicar.
              <Link href="/dashboard" className="ml-1 font-medium text-[#2563EB] underline">Ir a Mi espacio</Link>
            </div>
          )}
        </section>
        <PracticeHistoryPanel key={materialId} materialId={materialId} history={history} />
      </div>
      {selectedMode && available(selectedMode) && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#0F1B3D]/35 px-4 py-6 backdrop-blur-[2px]" onMouseDown={event=>{if(event.target===event.currentTarget)setSelectedMode(null);}}>
          <section role="dialog" aria-modal="true" aria-labelledby="practice-intensity-title" className="w-full max-w-[410px] rounded-2xl border border-[#E7EBF4] bg-white p-5 shadow-[0_22px_70px_rgba(15,27,61,0.16)] sm:p-6">
            <button type="button" onClick={()=>setSelectedMode(null)} className="mb-4 inline-flex items-center gap-1.5 text-[12px] text-slate-500 hover:text-slate-800"><ArrowLeft className="size-3.5"/> Volver a Practicar</button>
            <span className="mb-3 inline-flex size-9 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#4F5DFF]"><Clock3 className="size-[18px]"/></span>
            <h2 id="practice-intensity-title" className="text-[20px] font-semibold tracking-[-.035em] text-[#0F1B3D]">¿Cuánto querés practicar?</h2>
            <p className="mt-1 text-[13px] leading-5 text-slate-500">Elegí cómo querés estudiar con {selectedMode.toLowerCase()}.</p>
            <div className="mt-5 grid gap-2.5">
              <button type="button" aria-pressed={sessionLength==='rapido'} onClick={()=>setSessionLength('rapido')} className={`flex items-center gap-3 rounded-xl border p-3.5 text-left transition ${sessionLength==='rapido'?'border-[#4F5DFF] bg-[#F6F7FF] ring-1 ring-[#4F5DFF]/20':'border-[#E7EBF4] bg-white hover:border-slate-300'}`}>
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#EEF2FF] text-[#4F5DFF]"><Zap className="size-[18px]"/></span>
                <span className="flex-1"><span className="block text-[13px] font-semibold text-slate-900">Repaso rápido</span><span className="mt-0.5 block text-[11px] leading-4 text-slate-500">Una sesión corta para practicar lo esencial</span></span>
                <span className={`flex size-4 shrink-0 items-center justify-center rounded-full border ${sessionLength==='rapido'?'border-[#4F5DFF] bg-[#4F5DFF]':'border-slate-300'}`}>{sessionLength==='rapido'&&<Check className="size-3 text-white"/>}</span>
              </button>
              <button type="button" aria-pressed={sessionLength==='completo'} onClick={()=>setSessionLength('completo')} className={`flex items-center gap-3 rounded-xl border p-3.5 text-left transition ${sessionLength==='completo'?'border-[#4F5DFF] bg-[#F6F7FF] ring-1 ring-[#4F5DFF]/20':'border-[#E7EBF4] bg-white hover:border-slate-300'}`}>
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#F0F3F9] text-[#53647B]"><BookOpen className="size-[18px]"/></span>
                <span className="flex-1"><span className="block text-[13px] font-semibold text-slate-900">Repaso completo</span><span className="mt-0.5 block text-[11px] leading-4 text-slate-500">Más ejercicios para profundizar en el material</span></span>
                <span className={`flex size-4 shrink-0 items-center justify-center rounded-full border ${sessionLength==='completo'?'border-[#4F5DFF] bg-[#4F5DFF]':'border-slate-300'}`}>{sessionLength==='completo'&&<Check className="size-3 text-white"/>}</span>
              </button>
            </div>
            <button type="button" onClick={()=>void startPractice()} disabled={preparing} className="mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 text-[13px] font-medium text-white transition hover:bg-[#1D4ED8] disabled:opacity-50">Empezar a practicar <ArrowRight className="size-4"/></button>
          </section>
        </div>
      )}
    </main>
  );
}
