'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PracticePreparing } from '@/components/dashboard/practice-preparing';
import { PracticeHistoryPanel } from '@/components/dashboard/practice-history-panel';
import type { PracticeHistoryEntry } from '@/lib/student-materials/practice-history';
import { ArrowRight, BookOpen, Check, ChevronDown, CircleHelp, FileText, Layers3, ListChecks, Mic, Network, Timer, Zap } from 'lucide-react';

type Material = { id: string; title: string };
const modes = [
  { title: 'Mixto', description: 'Una mezcla de todo, como en un examen.', Icon: Zap, color: 'from-[#FBF5E7] to-[#F9EDDB] text-[#98712E]' },
  { title: 'Flashcards', description: 'Recordá y girá las tarjetas.', Icon: Layers3, color: 'from-[#ECF8FA] to-[#DDEFF5] text-[#337F99]' },
  { title: 'Opciones', description: 'Verdadero, falso y múltiples opciones.', Icon: Check, color: 'from-[#EAF6EB] to-[#DDF0E1] text-[#398052]' },
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
    setPrepareError('');
    if (!advancedPracticeEnabled || selectedMode === 'Flashcards' || selectedMode === 'Opciones' ||
        selectedMode === 'Unir conceptos' || selectedMode === 'Completar' || selectedMode === 'Casos') {
      router.push(href);
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
      router.push(href);
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
                    <button key={title} type="button" aria-pressed={selected} onClick={() => setSelectedMode(title)}
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
              <div className="mt-4">
                {selectedMode && available(selectedMode) ? (
                  <button type="button" disabled={preparing} onClick={() => void startPractice()}
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-5 text-[13px] font-medium text-white transition hover:bg-[#1D4ED8] disabled:opacity-60">
                    {selectedMode === 'Flashcards' ? 'Practicar con flashcards' : 'Comenzar práctica'} <ArrowRight className="size-4" aria-hidden="true"/>
                  </button>
                ) : selectedMode ? (
                  <p className="flex min-h-11 items-center gap-2 rounded-xl bg-slate-50 px-3 text-xs text-slate-600" role="status">
                    <CircleHelp className="size-4 shrink-0" /> Esta modalidad estará disponible próximamente.
                  </p>
                ) : <p className="text-center text-[12px] text-slate-500">Seleccioná una modalidad para empezar.</p>}
                {prepareError && <p role="alert" className="mt-2 text-xs text-amber-800">{prepareError}</p>}
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
    </main>
  );
}
