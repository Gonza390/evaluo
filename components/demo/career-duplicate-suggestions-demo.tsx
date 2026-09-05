'use client';

import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, GraduationCap, Search, Sparkles } from 'lucide-react';
import { findCareerMatches, findStrongCareerMatch, type CareerMatchCandidate } from '@/lib/career-matching';

type Props = {
  universityName: string;
  careers: CareerMatchCandidate[];
};

type GuardState = 'idle' | 'confirm' | 'created';

export function CareerDuplicateSuggestionsDemo({ universityName, careers }: Props) {
  const [query, setQuery] = useState('Martillero');
  const [guardState, setGuardState] = useState<GuardState>('idle');
  const [selected, setSelected] = useState<CareerMatchCandidate | null>(null);

  const matches = useMemo(() => findCareerMatches(query, careers), [careers, query]);
  const strongMatch = useMemo(() => findStrongCareerMatch(query, careers), [careers, query]);

  function reset(nextQuery: string) {
    setQuery(nextQuery);
    setGuardState('idle');
    setSelected(null);
  }

  function useCareer(career: CareerMatchCandidate) {
    setSelected(career);
    setGuardState('idle');
  }

  function requestNewCareer() {
    if (strongMatch) {
      setGuardState('confirm');
      return;
    }
    setGuardState('created');
  }

  return (
    <main className="h-[100svh] overflow-hidden bg-[radial-gradient(circle_at_top,#eef2ff_0,white_42%)] px-4 py-3 sm:py-4">
      <div className="mx-auto flex h-full w-full max-w-xl flex-col">
        <div className="mb-3 flex shrink-0 items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-600">Preview · onboarding</p>
            <h1 className="mt-0.5 text-lg font-bold tracking-[-0.04em] text-slate-950">Evitar carreras duplicadas</h1>
          </div>
          <div className="flex gap-2">
            {['Martillero', 'Abigacia', 'Ciencias ambientales'].map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => reset(example)}
                className="hidden rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-indigo-200 hover:text-indigo-700 sm:block"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.12)]">
          <div className="shrink-0 border-b border-slate-100 px-5 pt-4 sm:px-8 sm:pt-4">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
              <span>Paso 2 de 4</span>
              <span>Tu carrera</span>
            </div>
            <div className="mt-2 flex gap-1.5 pb-3">
              <div className="h-1 flex-1 rounded-full bg-indigo-300" />
              <div className="h-1 flex-1 rounded-full bg-indigo-600" />
              <div className="h-1 flex-1 rounded-full bg-slate-100" />
              <div className="h-1 flex-1 rounded-full bg-slate-100" />
            </div>
          </div>

          <div className="min-h-0 flex-1 px-5 py-4 sm:px-8 sm:py-5">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
                <GraduationCap className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-[1.4rem] font-bold tracking-[-0.04em] text-slate-950">¿Qué carrera estudiás?</h2>
                <p className="mt-0.5 text-sm leading-5 text-slate-500">{universityName}. Si no aparece, comprobamos primero si ya existe con otro nombre.</p>
              </div>
            </div>

            {selected ? (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white"><Check className="h-4 w-4" /></span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-emerald-900">Buenas noticias: ya está disponible</p>
                    <p className="mt-1 text-base font-bold text-slate-950">{selected.nombre}</p>
                    <p className="mt-1 text-sm text-slate-600">La usamos como tu carrera y evitamos crear un duplicado.</p>
                  </div>
                </div>
                <button type="button" onClick={() => setSelected(null)} className="mt-3 text-sm font-semibold text-indigo-700">Probar otra búsqueda</button>
              </div>
            ) : guardState === 'confirm' && strongMatch ? (
              <div className="mt-4 rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-4 shadow-[0_14px_34px_rgba(79,70,229,0.08)]">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-indigo-600"><Sparkles className="h-4 w-4" /> Antes de crearla</div>
                <h3 className="mt-2 text-lg font-bold tracking-[-0.03em] text-slate-950">Encontramos una carrera muy parecida que ya está disponible.</h3>
                <div className="mt-3 rounded-xl border border-indigo-100 bg-white p-3">
                  <p className="font-bold text-slate-950">{strongMatch.career.nombre}</p>
                  <p className="mt-0.5 text-sm text-slate-500">{universityName}</p>
                </div>
                <button type="button" onClick={() => useCareer(strongMatch.career)} className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white transition hover:bg-indigo-700">Usar esta carrera <ArrowRight className="h-4 w-4" /></button>
                <button type="button" onClick={() => setGuardState('created')} className="mt-2 w-full text-center text-sm font-semibold text-slate-500 hover:text-slate-800">No, es otra carrera</button>
              </div>
            ) : guardState === 'created' ? (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
                <p className="text-sm font-bold text-slate-900">Solicitud nueva lista para enviar</p>
                <p className="mt-1 text-sm leading-5 text-slate-500">En el onboarding real, recién acá se crea la carrera pendiente. Este preview no modifica datos.</p>
                <button type="button" onClick={() => setGuardState('idle')} className="mt-2 text-sm font-semibold text-indigo-700">Volver</button>
              </div>
            ) : (
              <>
                <label htmlFor="career-demo" className="mt-4 block text-sm font-semibold text-slate-800">Nombre de tu carrera</label>
                <div className="relative mt-1.5">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="career-demo"
                    value={query}
                    onChange={(event) => { setQuery(event.target.value); setGuardState('idle'); }}
                    placeholder="Ej. Martillero"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                  />
                </div>

                {matches.length ? (
                  <div className="mt-3 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-3">
                    <div className="text-xs font-bold uppercase tracking-[0.12em] text-indigo-600">¿Buscabas alguna de estas?</div>
                    <p className="mt-0.5 text-xs leading-5 text-slate-500">Ya están disponibles en Evaluo.</p>
                    <div className="mt-2 space-y-2">
                      {matches.map(({ career }) => (
                        <button
                          key={career.id}
                          type="button"
                          onClick={() => useCareer(career)}
                          className="group flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-indigo-300 hover:shadow-md"
                        >
                          <div className="min-w-0">
                            <p className="font-bold leading-5 text-slate-950">{career.nombre}</p>
                            <p className="mt-0.5 text-xs text-slate-500">{universityName}</p>
                          </div>
                          <span className="shrink-0 text-xs font-bold text-indigo-600">Usar esta carrera</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : query.trim().length >= 3 ? (
                  <p className="mt-3 rounded-xl bg-slate-50 px-4 py-2.5 text-sm text-slate-500">No encontramos una carrera suficientemente parecida.</p>
                ) : null}

                <button
                  type="button"
                  onClick={requestNewCareer}
                  disabled={query.trim().length < 3}
                  className="mt-3 flex h-10 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  No es ninguna de estas · Solicitar nueva carrera
                </button>
              </>
            )}
          </div>

          <div className="flex shrink-0 items-center justify-between border-t border-slate-100 px-5 py-3 sm:px-8">
            <button type="button" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500"><ArrowLeft className="h-4 w-4" /> Atrás</button>
            <span className="text-xs text-slate-400">Preview sin cambios en la base</span>
          </div>
        </section>
      </div>
    </main>
  );
}
