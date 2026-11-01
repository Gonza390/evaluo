'use client';

import { useState } from 'react';
import './practice-motion.css';
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

export function PracticeModePicker({ materials, initialMaterialId, history, historyLoadError = false, advancedPracticeEnabled = false }: {
  materials: Material[];
  initialMaterialId: string | null;
  history: PracticeHistoryEntry[];
  historyLoadError?: boolean;
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

  if (selectedMode && available(selectedMode)) return (
    <main className="practice-screen-enter mx-auto flex min-h-[calc(100dvh-100px)] w-full max-w-[1040px] items-center justify-center px-4 py-7 sm:px-6 sm:py-10">
      <div className="w-full max-w-[720px] text-center">
        <img src="/evi-pensando.svg" alt="Evi pensando" className="mx-auto mb-3 h-[112px] w-[112px] motion-safe:animate-[bounce_3s_ease-in-out_infinite] sm:h-[136px] sm:w-[136px]"/>
        <h1 className="text-[23px] font-semibold tracking-[-.045em] text-[#0F1B3D] sm:text-[26px]">¿Cómo querés repasar?</h1>
        <p className="mx-auto mt-1 max-w-[310px] text-[12px] leading-5 text-slate-500 sm:text-[13px]">Elegí cuánto tiempo querés dedicarle. Después podés cambiarlo.</p>
        <div className="mx-auto mt-4 inline-flex max-w-full items-center gap-2.5 rounded-xl border border-[#E7EBF4] bg-white px-3 py-2 text-left">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#EEF2FF] text-[#2563EB]"><FileText className="size-4"/></span>
          <span className="min-w-0"><span className="block text-[9px] font-semibold tracking-[.08em] text-slate-500">MATERIAL</span><span className="block max-w-[250px] truncate text-[12px] font-medium text-slate-900">{material?.title ?? 'Tu material'}</span></span>
        </div>
        <div role="radiogroup" aria-label="Tipo de repaso" className="mt-6 grid gap-3 text-left sm:grid-cols-2 sm:gap-4">
          {([
            {id:'rapido' as const,title:'Repaso rápido',description:'Lo esencial en pocos minutos: los conceptos clave y lo que más se repite.',time:'≈ 10 min',detail:'Conceptos clave y preguntas frecuentes',Icon:Zap,iconClass:'bg-[#FFF3D0] text-[#8B650F]'},
            {id:'completo' as const,title:'Repaso completo',description:'Recorré el material con más ejercicios y profundizá en cada tema.',time:'≈ 40 min',detail:'Más preguntas y práctica en cada modalidad',Icon:BookOpen,iconClass:'bg-[#EEF2FF] text-[#2563EB]'},
          ]).map(option=>{
            const chosen=sessionLength===option.id;
            return <button key={option.id} type="button" role="radio" aria-checked={chosen} onClick={()=>setSessionLength(option.id)} className={`relative flex h-full flex-col rounded-2xl border p-4 text-left transition sm:p-5 ${chosen?'border-[#2563EB] bg-[#F7FAFF] ring-[3px] ring-[#DBE8FF]':'border-[#E7EBF4] bg-white hover:border-blue-200'}`}>
              <span className={`flex size-10 items-center justify-center rounded-xl ${option.iconClass}`}><option.Icon className="size-[18px]"/></span>
              <span className={`absolute right-4 top-4 flex size-5 items-center justify-center rounded-full border ${chosen?'border-[#2563EB] bg-[#2563EB]':'border-slate-300'}`}>{chosen&&<Check className="size-3 text-white"/>}</span>
              <span className="mt-3 block text-[16px] font-semibold tracking-tight text-[#0F1B3D]">{option.title}</span>
              <span className="mt-1 block min-h-[54px] text-[12px] leading-[1.55] text-slate-600">{option.description}</span>
              <span className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3 text-[11px] font-medium text-slate-700">
                <span className="flex items-center gap-2"><Clock3 className="size-[15px] shrink-0 text-slate-500"/>{option.time}</span>
                <span className="flex items-start gap-2"><ListChecks className="mt-0.5 size-[15px] shrink-0 text-slate-500"/>{option.detail}</span>
              </span>
            </button>;
          })}
        </div>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button type="button" onClick={()=>setSelectedMode(null)} className="min-h-10 rounded-xl px-4 text-[13px] font-medium text-slate-600 hover:bg-slate-50">Volver</button>
          <button type="button" onClick={()=>void startPractice()} className="inline-flex min-h-11 min-w-[170px] items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-5 text-[13px] font-medium text-white hover:bg-blue-700">Continuar <ArrowRight className="size-4"/></button>
        </div>
      </div>
    </main>
  );

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

      <div className={`mt-6 grid items-start gap-7 lg:gap-6 xl:gap-9 ${material ? 'lg:grid-cols-[minmax(0,1.22fr)_minmax(310px,0.86fr)]' : ''}`}>
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
        {material && <PracticeHistoryPanel key={materialId} materialId={materialId} materialTitle={material.title} history={history}
          historyLoadError={historyLoadError}
          onStartFlashcards={() => { setSessionLength('rapido'); setSelectedMode('Flashcards'); }} />}
      </div>
    </main>
  );
}
