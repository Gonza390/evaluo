'use client';

import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  FileUp,
  GraduationCap,
  MapPin,
  School,
  Search,
} from 'lucide-react';
import { findCareerMatches, type CareerMatchCandidate } from '@/lib/career-matching';

type DemoUniversity = {
  id: string;
  nombre: string;
  aliases?: string[];
};

type DemoCareer = CareerMatchCandidate & {
  universidad_id: string;
};

type Props = {
  universities: DemoUniversity[];
  careers: DemoCareer[];
};

type View = 'university' | 'missing-university' | 'career' | 'request-career' | 'done';
type SelectedUniversity = DemoUniversity & { pending?: boolean };

function normalize(value: string) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function compact(value: string) {
  return normalize(value).replace(/\s/g, '');
}

function editDistance(left: string, right: string) {
  if (left === right) return 0;
  if (!left.length) return right.length;
  if (!right.length) return left.length;

  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  const current = new Array<number>(right.length + 1);

  for (let i = 1; i <= left.length; i += 1) {
    current[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      current[j] = Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + cost);
    }
    for (let j = 0; j <= right.length; j += 1) previous[j] = current[j];
  }

  return previous[right.length];
}

function universityScore(query: string, university: DemoUniversity) {
  const normalizedQuery = normalize(query);
  const compactQuery = compact(query);
  if (normalizedQuery.length < 2) return 0;

  let best = 0;
  for (const name of [university.nombre, ...(university.aliases ?? [])]) {
    const normalizedName = normalize(name);
    const compactName = compact(name);

    if (normalizedQuery === normalizedName || compactQuery === compactName) return 1;
    if (
      normalizedName.includes(normalizedQuery) ||
      normalizedQuery.includes(normalizedName) ||
      compactName.includes(compactQuery)
    ) {
      best = Math.max(best, 0.93);
    }

    const maxLength = Math.max(compactQuery.length, compactName.length);
    if (maxLength >= 4) {
      best = Math.max(best, 1 - editDistance(compactQuery, compactName) / maxLength);
    }
  }

  return best;
}

export function CareerDuplicateSuggestionsDemo({ universities, careers }: Props) {
  const [view, setView] = useState<View>('university');
  const [universityQuery, setUniversityQuery] = useState('U.B.A.');
  const [selectedUniversity, setSelectedUniversity] = useState<SelectedUniversity | null>(null);
  const [missingUniversityName, setMissingUniversityName] = useState('');
  const [missingUniversityCity, setMissingUniversityCity] = useState('');
  const [careerQuery, setCareerQuery] = useState('');
  const [facultyName, setFacultyName] = useState('');
  const [selectedCareer, setSelectedCareer] = useState<DemoCareer | null>(null);

  const step = view === 'done' ? 4 : view === 'university' || view === 'missing-university' ? 1 : 2;
  const pageLabel = step === 1 ? 'Tu universidad' : step === 2 ? 'Tu carrera' : 'Empezá a estudiar';

  const universityMatches = useMemo(
    () =>
      universities
        .map((university) => ({ university, score: universityScore(universityQuery, university) }))
        .filter((match) => match.score >= 0.7)
        .sort((left, right) => right.score - left.score)
        .slice(0, 3),
    [universities, universityQuery]
  );

  const careersForUniversity = useMemo(
    () => careers.filter((career) => career.universidad_id === selectedUniversity?.id),
    [careers, selectedUniversity?.id]
  );

  const careerMatches = useMemo(
    () => (selectedUniversity?.pending ? [] : findCareerMatches(careerQuery, careersForUniversity)),
    [careerQuery, careersForUniversity, selectedUniversity?.pending]
  );

  function useUniversity(university: DemoUniversity) {
    setSelectedUniversity(university);
    setSelectedCareer(null);
    setFacultyName('');
    setCareerQuery(university.id === 'demo-siglo21' ? 'Martillero' : 'Psicologia');
    setView('career');
  }

  function openMissingUniversity() {
    setMissingUniversityName(universityQuery.trim());
    setMissingUniversityCity('');
    setView('missing-university');
  }

  function continueWithMissingUniversity() {
    const name = missingUniversityName.trim();
    if (name.length < 3) return;

    setSelectedUniversity({ id: 'demo-pending-university', nombre: name, pending: true });
    setCareerQuery('');
    setFacultyName('');
    setSelectedCareer(null);
    setView('career');
  }

  function useCareer(career: CareerMatchCandidate) {
    setSelectedCareer(careersForUniversity.find((item) => item.id === career.id) ?? null);
  }

  function goBack() {
    if (view === 'missing-university') return setView('university');
    if (view === 'request-career') return setView('career');
    if (view === 'done') return setView('career');
    if (view === 'career') {
      setSelectedUniversity(null);
      setSelectedCareer(null);
      setView('university');
    }
  }

  return (
    <main className="h-[100svh] overflow-hidden bg-[radial-gradient(circle_at_top,#eef2ff_0,white_46%)] p-3 sm:p-5">
      <section className="mx-auto flex h-full w-full max-w-[600px] flex-col overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.12)]">
        <div className="shrink-0 border-b border-slate-100 px-5 pt-4 sm:px-8">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
            <span>Paso {step} de 4</span>
            <span>{pageLabel}</span>
          </div>
          <div className="mt-2 flex gap-1.5 pb-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded-full ${index < step ? 'bg-indigo-600' : 'bg-slate-100'}`}
              />
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 px-5 py-4 sm:px-8 sm:py-5">
          {view === 'university' ? (
            <>
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
                  <School className="h-5 w-5" />
                </span>
                <div>
                  <h1 className="text-[1.4rem] font-bold tracking-[-0.04em] text-slate-950">¿Dónde estudiás?</h1>
                  <p className="mt-0.5 text-sm leading-5 text-slate-500">Buscá tu universidad. También reconocemos siglas y nombres parecidos.</p>
                </div>
              </div>

              <label htmlFor="university-demo" className="mt-4 block text-sm font-semibold text-slate-800">Universidad</label>
              <div className="relative mt-1.5">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="university-demo"
                  value={universityQuery}
                  onChange={(event) => setUniversityQuery(event.target.value)}
                  placeholder="Ej. Universidad de Buenos Aires"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                />
              </div>

              {universityMatches.length ? (
                <div className="mt-3 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-3">
                  <div className="text-xs font-bold uppercase tracking-[0.12em] text-indigo-600">¿Buscabas alguna de estas?</div>
                  <div className="mt-2 space-y-2">
                    {universityMatches.map(({ university }) => (
                      <button
                        key={university.id}
                        type="button"
                        onClick={() => useUniversity(university)}
                        className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-indigo-300 hover:shadow-md"
                      >
                        <p className="min-w-0 font-bold leading-5 text-slate-950">{university.nombre}</p>
                        <span className="shrink-0 text-xs font-bold text-indigo-600">Usar esta universidad</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : universityQuery.trim().length >= 3 ? (
                <div className="mt-3 rounded-xl bg-slate-50 px-4 py-2.5 text-sm text-slate-500">No encontramos una universidad suficientemente parecida.</div>
              ) : null}

              <button
                type="button"
                onClick={openMissingUniversity}
                disabled={universityQuery.trim().length < 3}
                className="mt-3 flex h-10 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Mi universidad no aparece
              </button>
            </>
          ) : null}

          {view === 'missing-university' ? (
            <>
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white"><School className="h-5 w-5" /></span>
                <div>
                  <h1 className="text-[1.4rem] font-bold tracking-[-0.04em] text-slate-950">Agregá tu universidad</h1>
                  <p className="mt-0.5 text-sm leading-5 text-slate-500">La revisamos después. Podés seguir completando tu carrera ahora.</p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <label htmlFor="missing-university" className="block text-sm font-semibold text-slate-800">Nombre de tu universidad</label>
                  <input
                    id="missing-university"
                    value={missingUniversityName}
                    onChange={(event) => setMissingUniversityName(event.target.value)}
                    placeholder="Ej. Universidad Nacional del Delta"
                    className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                  />
                </div>
                <div>
                  <label htmlFor="missing-city" className="block text-sm font-semibold text-slate-800">Ciudad <span className="font-normal text-slate-400">(opcional)</span></label>
                  <div className="relative mt-1.5">
                    <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="missing-city"
                      value={missingUniversityCity}
                      onChange={(event) => setMissingUniversityCity(event.target.value)}
                      placeholder="Ej. Buenos Aires"
                      className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                    />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={continueWithMissingUniversity}
                disabled={missingUniversityName.trim().length < 3}
                className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-40"
              >
                Continuar <ArrowRight className="h-4 w-4" />
              </button>
            </>
          ) : null}

          {view === 'career' && selectedUniversity ? (
            <>
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white"><GraduationCap className="h-5 w-5" /></span>
                <div>
                  <h1 className="text-[1.4rem] font-bold tracking-[-0.04em] text-slate-950">¿Qué carrera estudiás?</h1>
                  <p className="mt-0.5 text-sm leading-5 text-slate-500">{selectedUniversity.nombre}</p>
                </div>
              </div>

              {selectedUniversity.pending ? (
                <div className="mt-4 space-y-3">
                  <div>
                    <label htmlFor="pending-career" className="block text-sm font-semibold text-slate-800">Nombre de tu carrera</label>
                    <input
                      id="pending-career"
                      value={careerQuery}
                      onChange={(event) => setCareerQuery(event.target.value)}
                      placeholder="Ej. Licenciatura en Psicología"
                      className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                    />
                  </div>
                  <div>
                    <label htmlFor="pending-faculty" className="block text-sm font-semibold text-slate-800">Facultad o unidad académica <span className="font-normal text-slate-400">(opcional)</span></label>
                    <input
                      id="pending-faculty"
                      value={facultyName}
                      onChange={(event) => setFacultyName(event.target.value)}
                      placeholder="Ej. Facultad de Psicología"
                      className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setView('done')}
                    disabled={careerQuery.trim().length < 3}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-40"
                  >
                    Enviar solicitud y seguir <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              ) : selectedCareer ? (
                <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white"><Check className="h-4 w-4" /></span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-emerald-900">Carrera encontrada</p>
                      <p className="mt-1 font-bold text-slate-950">{selectedCareer.nombre}</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setSelectedCareer(null)} className="mt-3 text-sm font-semibold text-indigo-700">Buscar otra</button>
                </div>
              ) : (
                <>
                  <label htmlFor="career-demo" className="mt-4 block text-sm font-semibold text-slate-800">Carrera</label>
                  <div className="relative mt-1.5">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="career-demo"
                      value={careerQuery}
                      onChange={(event) => setCareerQuery(event.target.value)}
                      placeholder="Ej. Martillero"
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                    />
                  </div>

                  {careerMatches.length ? (
                    <div className="mt-3 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-3">
                      <div className="text-xs font-bold uppercase tracking-[0.12em] text-indigo-600">¿Buscabas alguna de estas?</div>
                      <div className="mt-2 space-y-2">
                        {careerMatches.map(({ career }) => (
                          <button
                            key={career.id}
                            type="button"
                            onClick={() => useCareer(career)}
                            className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-indigo-300 hover:shadow-md"
                          >
                            <p className="min-w-0 font-bold leading-5 text-slate-950">{career.nombre}</p>
                            <span className="shrink-0 text-xs font-bold text-indigo-600">Usar esta carrera</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : careerQuery.trim().length >= 3 ? (
                    <div className="mt-3 rounded-xl bg-slate-50 px-4 py-2.5 text-sm text-slate-500">No encontramos una carrera suficientemente parecida.</div>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => setView('request-career')}
                    disabled={careerQuery.trim().length < 3}
                    className="mt-3 flex h-10 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700 disabled:opacity-40"
                  >
                    No es ninguna de estas · Solicitar nueva carrera
                  </button>
                </>
              )}
            </>
          ) : null}

          {view === 'request-career' && selectedUniversity ? (
            <>
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white"><GraduationCap className="h-5 w-5" /></span>
                <div>
                  <h1 className="text-[1.4rem] font-bold tracking-[-0.04em] text-slate-950">Solicitá tu carrera</h1>
                  <p className="mt-0.5 text-sm leading-5 text-slate-500">{selectedUniversity.nombre}</p>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                <div>
                  <label htmlFor="request-career" className="block text-sm font-semibold text-slate-800">Nombre de tu carrera</label>
                  <input
                    id="request-career"
                    value={careerQuery}
                    onChange={(event) => setCareerQuery(event.target.value)}
                    className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                  />
                </div>
                <div>
                  <label htmlFor="request-faculty" className="block text-sm font-semibold text-slate-800">Facultad o unidad académica <span className="font-normal text-slate-400">(opcional)</span></label>
                  <input
                    id="request-faculty"
                    value={facultyName}
                    onChange={(event) => setFacultyName(event.target.value)}
                    placeholder="Ej. Facultad de Psicología"
                    className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setView('done')}
                  disabled={careerQuery.trim().length < 3}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-40"
                >
                  Enviar solicitud y seguir <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </>
          ) : null}

          {view === 'done' && selectedUniversity ? (
            <div className="flex h-full flex-col justify-center">
              <div className="text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-[0_10px_24px_rgba(79,70,229,0.22)]"><Check className="h-6 w-6" /></span>
                <h1 className="mt-4 text-2xl font-bold tracking-[-0.04em] text-slate-950">Empezá con tu primer material</h1>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Tu solicitud quedó registrada. Podés subir un PDF propio o ver un ejemplo para conocer cómo lo transforma Evaluo.
                </p>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-[1.2fr_0.8fr]">
                <a
                  href="/dashboard/materiales/subir?source=onboarding_missing_catalog"
                  className="group relative overflow-hidden rounded-2xl border-2 border-indigo-500 bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 p-5 text-left text-white shadow-[0_16px_36px_rgba(79,70,229,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_42px_rgba(79,70,229,0.34)]"
                >
                  <span className="absolute right-3 top-3 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-white ring-1 ring-white/20">
                    Recomendado
                  </span>
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-white ring-1 ring-white/20 transition group-hover:bg-white/20">
                    <FileUp className="h-6 w-6" />
                  </span>
                  <h2 className="mt-4 text-lg font-bold">Subir mi PDF</h2>
                  <p className="mt-1.5 max-w-[220px] text-sm leading-5 text-indigo-100">Usá tu propio material y empezá a prepararlo para estudiar.</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-white">
                    Elegir PDF <ArrowRight className="h-4 w-4" />
                  </span>
                </a>

                <a
                  href="/demo/material-estudio?source=onboarding_missing_catalog"
                  className="group rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-indigo-200 hover:bg-indigo-50/30"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition group-hover:bg-indigo-50 group-hover:text-indigo-600">
                    <FileText className="h-5 w-5" />
                  </span>
                  <h2 className="mt-3 text-base font-bold text-slate-950">Ver un PDF de ejemplo</h2>
                  <p className="mt-1 text-sm leading-5 text-slate-500">Mirá cómo queda un material dentro de Evaluo.</p>
                </a>
              </div>

              <a href="/dashboard" className="mt-4 text-center text-sm font-semibold text-slate-500 transition hover:text-slate-800">
                Ir al inicio
              </a>
            </div>
          ) : null}
        </div>

        {view !== 'university' && view !== 'done' ? (
          <div className="shrink-0 border-t border-slate-100 px-5 py-3 sm:px-8">
            <button type="button" onClick={goBack} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-800">
              <ArrowLeft className="h-4 w-4" /> Atrás
            </button>
          </div>
        ) : null}
      </section>
    </main>
  );
}
