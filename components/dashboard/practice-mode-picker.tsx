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
    <main className="mx-auto w-full max-w-[1190px] px-3 pb-24 pt-5 sm:px-5 sm:pt-7 lg:px-7 lg:pt-9">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div className="min-w-0">
          <h1 id="practice-heading" className="text-[25px] font-semibold tracking-[-0.045em] text-[#0F1B3D] sm:text-[27px]">
            Practicar
          </h1>
          <p className="mt-1 text-[12px] text-[#66758D]">Elegí cómo querés poner a prueba lo que aprendiste.</p>
        </div>
        {material && (
          <div className="relative w-full min-w-0 sm:max-w-[340px]">
            <label htmlFor="practice-material" className="sr-only">Material de estudio</label>
            <FileText aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#2563EB]" />
            <select id="practice-material" value={materialId} onChange={event => {
              setMaterialId(event.target.value); setSelectedMode(null); setPrepareError('');
            }}
              className="min-h-11 w-full appearance-none truncate rounded-xl border border-[#E2E8F2] bg-white py-2.5 pl-10 pr-9 text-[12px] font-medium text-[#0F1B3D] outline-none transition-colors focus-visible:border-[#2563EB] focus-visible:ring-2 focus-visible:ring-[#2563EB]/20 sm:text-[13px]">
              {materials.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
            </select>
            <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          </div>
        )}
      </header>

      <div className="mt-6 grid items-start gap-7 lg:grid-cols-[minmax(0,1.22fr)_minmax(310px,0.86fr)] lg:gap-6 xl:gap-9">
        <section aria-labelledby="practice-modes-title" className="min-w-0">
          {material ? (
            <>
              <h2 id="practice-modes-title" className="text-[17px] font-medium tracking-[-0.025em] text-[#0F1B3D]">
                Elegí cómo practicar
              </h2>
              <div className="mt-3 grid grid-cols-2 gap-2.5 sm:gap-3">
                {modes.map(({ title, description, Icon, color }) => {
                  const supported = available(title);
                  const selected = selectedMode === title;
                  return (
                    <button key={title} type="button" aria-pressed={selected} disabled={!supported}
                      onClick={() => { setSelectedMode(title); setSessionLength('rapido'); }}
                      className={`group flex min-h-[108px] min-w-0 flex-col items-start gap-2 rounded-[15px] border bg-gradient-to-br px-3 py-3 text-left outline-none transition-[border-color,box-shadow,transform] duration-150 enabled:hover:-translate-y-[1px] enabled:hover:shadow-[0_5px_16px_rgba(15,27,61,0.05)] focus-visible:ring-2 focus-visible:ring-[#2563EB] disabled:cursor-not-allowed sm:min-h-[96px] sm:flex-row sm:gap-2.5 sm:px-3.5 sm:py-3 ${color} ${selected ? 'border-[#4F5DFF] ring-2 ring-[#4F5DFF]/20' : 'border-transparent'}`}>
                      <span className="flex size-[31px] shrink-0 items-center justify-center rounded-[10px] bg-white/60 sm:size-[34px]">
                        <Icon className="size-[16px]" aria-hidden="true" strokeWidth={1.8} />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col sm:pt-0.5">
                        <span className="flex min-w-0 items-center justify-between gap-1 text-[12px] font-semibold leading-[1.3] sm:text-[13px]">
                          {title}
                          {selected && <Check className="size-3.5 shrink-0 text-[#2563EB]" aria-hidden="true" />}
                        </span>
                        <span className="mt-1 line-clamp-2 text-[10px] leading-[1.4] opacity-85 sm:text-[11px]">
                          {description}
                        </span>
                        {!supported && <span className="mt-1 text-[10px] font-medium opacity-70">Próximamente</span>}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-[11px] text-slate-500">
                Elegí una actividad para definir tu repaso.
              </p>
              {prepareError && <p role="alert" className="mt-2 text-[11px] text-amber-800">{prepareError}</p>}
            </>
          ) : (
            <div className="rounded-xl border border-[#E7EBF4] bg-slate-50 p-5 text-[13px] text-slate-600">
              Todavía no tenés materiales listos para practicar.
              <Link href="/dashboard" className="ml-1 font-medium text-[#2563EB] underline">Ir a Mi espacio</Link>
            </div>
          )}
        </section>
        <PracticeHistoryPanel key={materialId} materialId={materialId} materialTitle={material?.title} history={history} />
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
