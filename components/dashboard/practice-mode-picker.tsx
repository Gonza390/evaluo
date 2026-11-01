'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, Check, ChevronDown, CircleHelp, FileText, Layers3, ListChecks, Mic, Network, Timer, Zap } from 'lucide-react';

type Material = { id: string; title: string };
const modes = [
  { title: 'Mixto', description: 'Una mezcla de todo, como en un examen.', Icon: Zap, color: 'bg-[#FCF2DF] text-[#9A712C]' },
  { title: 'Flashcards', description: 'Te acordás la respuesta y le das la vuelta a la tarjeta.', Icon: Layers3, color: 'bg-[#E2F2F7] text-[#41839B]' },
  { title: 'Opciones', description: 'Verdadero o falso y elegir entre varias.', Icon: Check, color: 'bg-[#E3F2E5] text-[#398052]' },
  { title: 'Unir conceptos', description: 'Unís cada término con su definición.', Icon: Network, color: 'bg-[#E0F2F0] text-[#348C85]' },
  { title: 'Completar', description: 'Una frase del apunte con la palabra clave tapada.', Icon: ListChecks, color: 'bg-[#FAE9DE] text-[#AE663F]' },
  { title: 'Casos', description: 'Aplicás lo que sabés a un problema concreto.', Icon: BookOpen, color: 'bg-[#EBE4FA] text-[#6C52A8]' },
  { title: 'Con tus palabras', description: 'Lo explicás con tus palabras, como en un oral.', Icon: Mic, color: 'bg-[#FAE8EB] text-[#B65370]' },
  { title: 'Simulacro de examen', description: 'Con reloj y sin ver cómo te fue hasta el final, como el día del examen.', Icon: Timer, color: 'bg-[#E9EAED] text-[#626B7A]' },
] as const;

export function PracticeModePicker({ materials, initialMaterialId }: { materials: Material[]; initialMaterialId: string | null }) {
  const [materialId, setMaterialId] = useState(() => materials.find(m => m.id === initialMaterialId)?.id ?? materials[0]?.id ?? '');
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const material = materials.find(m => m.id === materialId);
  // Solamente las opciones ya implementadas conducen a una actividad real.
  const available = (title: string) => title === 'Opciones' || title === 'Flashcards';
  const href = selectedMode === 'Flashcards' ? `/materiales/${materialId}?tab=tarjetas` : `/materiales/${materialId}?tab=ejercicios`;

  return (
    <main className="mx-auto w-full max-w-[780px] px-4 py-6 pb-24 sm:px-6 sm:py-9">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="shrink-0 text-[20px] font-semibold tracking-[-0.035em] sm:text-[22px] lg:text-[24px] text-slate-900">Practicar</h1>
        <div className="relative min-w-0 w-full sm:w-[min(60%,360px)]">
          <label htmlFor="practice-material" className="sr-only">PDF para practicar</label>
          <FileText aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-blue-600" />
          <select id="practice-material" value={materialId} onChange={event => { setMaterialId(event.target.value); setSelectedMode(null); }}
            disabled={!materials.length}
            className="min-h-11 w-full appearance-none truncate rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-9 text-[13px] font-medium text-slate-800 outline-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20">
            {materials.length ? materials.map(m => <option key={m.id} value={m.id}>{m.title}</option>) : <option value="">No hay materiales disponibles</option>}
          </select>
          <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        </div>
      </header>
      {material ? (
        <>
          <h2 className="mb-3 text-[15px] font-normal tracking-tight text-slate-700">Elegí cómo practicar</h2>
          <div className="grid grid-cols-2 gap-3">
            {modes.map(({ title, description, Icon, color }) => {
              const supported = available(title);
              const selected = selectedMode === title;
              return (
                <button key={title} type="button" aria-pressed={selected} onClick={() => setSelectedMode(title)}
                  className={`relative flex min-h-[122px] flex-col items-start rounded-2xl border border-transparent p-3.5 text-left transition-all duration-150 hover:brightness-[0.985] hover:shadow-[0_4px_16px_rgba(15,23,42,0.035)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:min-h-[142px] sm:p-4 ${color} ${selected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}>
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
          <div className="mt-4 flex flex-col gap-2">
            {selectedMode && available(selectedMode) ? (
              <Link href={href} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-[13px] font-medium text-white transition hover:bg-blue-700">
                {selectedMode === 'Flashcards' ? 'Practicar con flashcards' : 'Comenzar práctica'} <ArrowRight className="size-4" />
              </Link>
            ) : selectedMode ? (
              <p className="flex min-h-11 items-center gap-2 rounded-xl bg-slate-50 px-3 text-xs text-slate-600" role="status">
                <CircleHelp className="size-4 shrink-0" /> Esta modalidad estará disponible próximamente.
              </p>
            ) : <p className="text-center text-xs text-slate-500">Elegí una opción para empezar.</p>}
          </div>
        </>
      ) : (
        <section className="mx-auto flex min-h-[420px] max-w-[520px] flex-col items-center justify-center px-4 py-12 text-center sm:min-h-[480px]" aria-labelledby="empty-practice-title">
          <div className="mb-5 flex size-[76px] items-center justify-center rounded-[24px] border border-[#E7EBF4] bg-[#EEF2FF] text-[#4F5DFF] shadow-[0_8px_25px_rgba(15,27,61,0.05)]">
            <BookOpen className="size-9" strokeWidth={1.6} aria-hidden="true" />
          </div>
          <h2 id="empty-practice-title" className="text-[22px] font-bold tracking-[-0.035em] text-[#0F1B3D] sm:text-[26px]">
            Tu próxima práctica empieza con un archivo
          </h2>
          <p className="mt-3 max-w-[38ch] text-[14px] leading-6 text-[#64748B] sm:text-[15px]">
            Subí tu PDF o documento Word y prepará actividades para poner a prueba lo que aprendiste.
          </p>
          <Link href="/dashboard/materiales/subir" className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-6 text-[14px] font-semibold text-white transition-colors hover:bg-[#1D4ED8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB] sm:w-auto">
            <FileText className="size-[18px]" aria-hidden="true" />
            Subir material
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <p className="mt-4 text-[12px] text-[#7F8AA3]">Cuando esté listo, vas a poder elegir cómo practicar.</p>
        </section>
      )}
    </main>
  );
}
