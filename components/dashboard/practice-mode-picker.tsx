'use client';

import { useState } from 'react';
import './practice-motion.css';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PracticePreparing } from '@/components/dashboard/practice-preparing';
import { PracticeHistoryPanel } from '@/components/dashboard/practice-history-panel';
import type { PracticeHistoryEntry } from '@/lib/student-materials/practice-history';
import scrollbarStyles from './practice-history-scrollbar.module.css';
import { ArrowRight, ArrowLeft, BookOpen, Check, ChevronDown, Clock3, FileText, Layers3, ListChecks, Mic, Network, Timer, Zap } from 'lucide-react';

type Material = { id: string; title: string };
const modes = [
  { title: 'Mixto', description: 'Una mezcla de todo, como en un examen.', Icon: Zap, color: 'bg-[#FCF2DF] text-[#9A712C]' },
  { title: 'Flashcards', description: 'Recordá y girá las tarjetas.', Icon: Layers3, color: 'bg-[#E2F2F7] text-[#41839B]' },
  { title: 'Opciones', description: 'Decidí si cada afirmación es verdadera o falsa.', Icon: Check, color: 'bg-[#E3F2E5] text-[#398052]' },
  { title: 'Unir conceptos', description: 'Relacioná términos y definiciones.', Icon: Network, color: 'bg-[#E0F2F0] text-[#348C85]' },
  { title: 'Completar', description: 'Encontrá la palabra que falta.', Icon: ListChecks, color: 'bg-[#FAE9DE] text-[#AE663F]' },
  { title: 'Casos', description: 'Aplicá conceptos a situaciones.', Icon: BookOpen, color: 'bg-[#EBE4FA] text-[#6C52A8]' },
  { title: 'Con tus palabras', description: 'Explicá el tema como en un oral.', Icon: Mic, color: 'bg-[#FAE8EB] text-[#B65370]' },
  { title: 'Simulacro de examen', description: 'Con reloj y resultados al final.', Icon: Timer, color: 'bg-[#E9EAED] text-[#626B7A]' },
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
  const [leavingReview, setLeavingReview] = useState(false);
  const [leavingPicker, setLeavingPicker] = useState(false);
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

  function openReview(title:string) {
    if (leavingPicker) return;
    setSessionLength('rapido');
    setLeavingPicker(true);
    window.setTimeout(() => {
      setSelectedMode(title);
      setLeavingPicker(false);
    }, 200);
  }
  function backToPicker() {
    if (leavingReview) return;
    setLeavingReview(true);
    window.setTimeout(() => {
      setSelectedMode(null);
      setLeavingReview(false);
    }, 200);
  }
  async function startPractice() {
    if (!selectedMode || !materialId || preparing || leavingReview || !available(selectedMode)) return;
    const destination = href + '?repaso=' + sessionLength;
    const requiresPreparation = advancedPracticeEnabled &&
      !['Flashcards','Opciones','Unir conceptos','Completar','Casos'].includes(selectedMode);
    const prepareMode = href.split('/').at(-1);
    setPrepareError('');
    setLeavingReview(true);
    await new Promise<void>(resolve => window.setTimeout(resolve, 210));
    setPreparing(true);
    if (requiresPreparation) {
      try {
        await fetch('/api/practice/prepare', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ materialId, mode: prepareMode }),
          signal: AbortSignal.timeout(9000),
        });
      } catch {
        // Optional preparation cannot block the ordinary practice session.
      }
    }
    router.push(destination);
  }
  if (preparing) return <PracticePreparing mode={href.split('/').at(-1) ?? 'práctica'} />;

  if (selectedMode && available(selectedMode)) return (
    <main className={`${leavingReview ? "practice-screen-leave" : "practice-screen-enter"} mx-auto flex w-full max-w-[880px] items-start justify-center px-3 py-3 sm:items-center sm:px-5 sm:py-5`}>
      <div className="w-full max-w-[650px] text-center">
        <img src="/evi-pensando.svg" alt="Evi pensando"
          className="mx-auto mb-1.5 h-[56px] w-[56px] motion-safe:animate-[bounce_3s_ease-in-out_infinite] sm:mb-2 sm:h-[76px] sm:w-[76px]" />
        <h1 className="text-[21px] font-semibold leading-[1.2] tracking-[-.045em] text-[#0F1B3D] sm:text-[23px]">¿Cómo querés repasar?</h1>
        <p className="mx-auto mt-1 max-w-[370px] text-[11px] leading-[1.4] text-slate-500 sm:text-[12px]">
          Elegí cuánto tiempo querés dedicarle. Después podés cambiarlo.
        </p>
        <div role="radiogroup" aria-label="Tipo de repaso" className="mt-3 grid gap-2 text-left sm:mt-4 sm:grid-cols-2 sm:gap-3">
          {([
            {id:'rapido' as const,title:'Repaso rápido',description:'Lo esencial en pocos minutos: los conceptos clave y lo que más se repite.',time:'≈ 10 min',Icon:Zap,iconClass:'bg-[#FFF3D0] text-[#8B650F]'},
            {id:'completo' as const,title:'Repaso completo',description:'Recorré el material con más ejercicios y profundizá en cada tema.',time:'≈ 40 min',Icon:BookOpen,iconClass:'bg-[#EEF2FF] text-[#2563EB]'},
          ]).map(option=>{
            const chosen=sessionLength===option.id;
            return <button key={option.id} type="button" role="radio" aria-checked={chosen}
              onClick={()=>setSessionLength(option.id)}
              className={`relative flex h-full min-w-0 flex-col rounded-xl border px-3 py-2.5 text-left transition-colors sm:rounded-2xl sm:p-3.5 ${chosen?'border-[#2563EB] bg-[#F7FAFF] ring-2 ring-[#DBE8FF]':'border-[#E7EBF4] bg-white hover:border-blue-200'}`}>
              <span className="flex items-center gap-2.5 pr-7">
                <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${option.iconClass}`}><option.Icon className="size-[16px]"/></span>
                <span className="text-[14px] font-semibold tracking-tight text-[#0F1B3D]">{option.title}</span>
              </span>
              <span aria-hidden="true" className={`absolute right-3 top-3 flex size-[18px] items-center justify-center rounded-full border ${chosen?'border-[#2563EB] bg-[#2563EB]':'border-slate-300'}`}>{chosen&&<Check className="size-3 text-white"/>}</span>
              <span className="mt-2 block text-[11px] leading-[1.4] text-slate-600 sm:min-h-[32px]">{option.description}</span>
              <span className="mt-2 flex items-center gap-1.5 border-t border-slate-100 pt-2 text-[10px] font-medium leading-[1.35] text-slate-700 sm:text-[11px]">
                <Clock3 className="size-3.5 shrink-0 text-slate-500"/>{option.time}
              </span>
            </button>;
          })}
        </div>
        <div className="mt-3 flex items-center justify-center gap-2 sm:mt-4">
          <button type="button" onClick={backToPicker} disabled={leavingReview} className="min-h-10 rounded-xl px-4 text-[12px] font-medium text-slate-600 hover:bg-slate-50">Volver</button>
          <button type="button" onClick={()=>void startPractice()} disabled={leavingReview} className="inline-flex min-h-10 min-w-[145px] items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 text-[12px] font-medium text-white hover:bg-blue-700">
            Continuar <ArrowRight className="size-4"/>
          </button>
        </div>
      </div>
    </main>
  );

  return (
    <main data-practice-dual-pane className={`${leavingPicker ? "practice-screen-leave" : "practice-screen-enter"} mx-auto w-full max-w-[1190px] px-3 pb-24 pt-5 sm:px-5 sm:pt-7 lg:flex lg:h-[calc(100dvh-52px)] lg:min-h-0 lg:flex-col lg:overflow-hidden lg:px-7 lg:pb-5 lg:pt-6`}>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6 lg:shrink-0">
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
              className="min-h-11 w-full appearance-none truncate border-0 bg-transparent py-2.5 pl-10 pr-9 text-[12px] font-medium text-[#0F1B3D] shadow-none outline-none transition-colors hover:text-[#2563EB] focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-[#2563EB]/25 sm:text-[13px]">
              {materials.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
            </select>
            <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          </div>
        )}
      </header>

      <div className={`mt-6 grid items-start gap-7 lg:min-h-0 lg:flex-1 lg:items-stretch lg:gap-6 xl:gap-9 ${material ? 'lg:grid-cols-[minmax(0,1.22fr)_minmax(310px,0.86fr)]' : ''}`}>
        <section aria-labelledby="practice-modes-title" className="min-w-0 lg:flex lg:min-h-0 lg:flex-col">
          {material ? (
            <>
              <h2 id="practice-modes-title" className="text-[17px] font-medium tracking-[-0.025em] text-[#0F1B3D] lg:shrink-0">
                Elegí cómo practicar
              </h2>
              <div tabIndex={0} role="region" aria-label="Modalidades de práctica: desplazate para ver todas" className={`${scrollbarStyles.scrollArea} mt-3 grid grid-cols-2 gap-3 lg:min-h-0 lg:flex-1 lg:content-start lg:overflow-y-auto lg:overscroll-contain lg:pr-1.5 lg:pb-3 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#4F5DFF]`}>
                {modes.map(({ title, description, Icon, color }) => {
                  const supported = available(title);
                  const selected = selectedMode === title;
                  return (
                    <button key={title} type="button" aria-pressed={selected} disabled={!supported}
                      onClick={() => openReview(title)}
                      className={`relative flex min-h-[122px] min-w-0 flex-col items-start rounded-2xl border border-transparent p-3.5 text-left transition-all duration-150 enabled:hover:brightness-[0.985] enabled:hover:shadow-[0_4px_16px_rgba(15,23,42,0.035)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed sm:min-h-[142px] sm:p-4 ${color} ${selected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}>
                      <span className="flex w-full items-center justify-between">
                        <Icon className="size-[16px]" aria-hidden="true" />
                        {selected ? <Check className="size-[16px] text-blue-600" aria-hidden="true" /> : null}
                      </span>
                      <span className="mt-auto pt-4 text-[13px] font-medium leading-4">{title}</span>
                      <span className="mt-1 max-w-[31ch] text-[11px] leading-[1.4] opacity-85">{description}</span>
                      {!supported ? <span className="mt-1.5 text-[10px] font-medium opacity-65">Próximamente</span> : null}
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-[11px] text-slate-500 lg:shrink-0">
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
        {material && <PracticeHistoryPanel key={materialId} materialId={materialId} history={history}
          historyLoadError={historyLoadError}
          onStartFlashcards={() => openReview('Flashcards')} />}
      </div>
    </main>
  );
}
