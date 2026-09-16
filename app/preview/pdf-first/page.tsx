'use client';

import { useMemo, useRef, useState } from 'react';
import { ArrowRight, CheckCircle2, FileText, GraduationCap, Lock, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Stage = 'upload' | 'processing' | 'done';

function titleFromFile(name: string) {
  return name.replace(/\.pdf$/i, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim() || 'Material de estudio';
}

export default function PdfFirstPublicPreviewPage() {
  const pickerRef = useRef<HTMLInputElement | null>(null);
  const [stage, setStage] = useState<Stage>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [contextDone, setContextDone] = useState(false);
  const [universidad, setUniversidad] = useState('');
  const [carrera, setCarrera] = useState('');
  const [materia, setMateria] = useState('');

  const fileLabel = useMemo(() => file?.name ?? 'Apuntes de ejemplo.pdf', [file]);
  const displayTitle = title.trim() || titleFromFile(fileLabel);

  const chooseFile = (selected: File | null) => {
    if (!selected) return;
    setFile(selected);
    setTitle(titleFromFile(selected.name));
  };

  const startDemo = () => {
    if (!file) {
      const demo = new File(['demo'], 'Anatomia - Parcial 1.pdf', { type: 'application/pdf' });
      setFile(demo);
      setTitle(titleFromFile(demo.name));
    }
    setStage('processing');
  };

  return (
    <main className="min-h-screen bg-[#f7f8fc] px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between">
          <p><span className="font-semibold">Demo visual pública.</span> No inicia sesión, no sube archivos y no guarda datos.</p>
          <button
            type="button"
            onClick={() => {
              setStage('upload');
              setContextDone(false);
              setUniversidad('');
              setCarrera('');
              setMateria('');
            }}
            className="font-semibold underline underline-offset-4"
          >
            Reiniciar demo
          </button>
        </div>

        <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
          <aside className="lg:sticky lg:top-8">
            <div className="rounded-[28px] bg-slate-950 p-6 text-white shadow-xl shadow-slate-950/10 sm:p-8">
              <div className="flex items-center gap-2 text-indigo-300">
                <Lock className="h-4 w-4" />
                <span className="text-[11px] font-bold uppercase tracking-[0.16em]">Privado por defecto</span>
              </div>
              <h1 className="mt-5 text-4xl font-bold leading-[0.98] tracking-[-0.055em] sm:text-5xl">
                Tu PDF primero. Los datos después.
              </h1>
              <p className="mt-5 max-w-md text-sm leading-7 text-slate-300 sm:text-base">
                Subís el material, Evaluo empieza a procesarlo y recién después podés sumar universidad, carrera y materia si querés.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  ['1', 'PDF', 'Elegí el archivo y arrancá.'],
                  ['2', 'Contexto', 'Completalo mientras procesa o saltalo.'],
                  ['3', 'Estudiar', 'Entrás apenas el material está listo.'],
                ].map(([n, label, description], index) => {
                  const active = (stage === 'upload' && index === 0) || (stage === 'processing' && index <= 1) || stage === 'done';
                  return (
                    <div key={n} className="flex gap-3">
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${active ? 'bg-white text-slate-950' : 'bg-white/10 text-slate-400'}`}>
                        {n}
                      </span>
                      <div>
                        <p className={`text-sm font-semibold ${active ? 'text-white' : 'text-slate-400'}`}>{label}</p>
                        <p className="mt-0.5 text-xs leading-5 text-slate-400">{description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>

          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
            {stage === 'upload' ? (
              <>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">Paso 1 · PDF</p>
                  <h2 className="mt-2 text-3xl font-bold tracking-[-0.045em] text-slate-950">Subí lo que ya estás estudiando.</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                    No necesitás completar universidad, carrera ni materia para empezar.
                  </p>
                </div>

                <input
                  ref={pickerRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  className="sr-only"
                  onChange={(event) => {
                    chooseFile(event.currentTarget.files?.[0] ?? null);
                    event.currentTarget.value = '';
                  }}
                />

                {!file ? (
                  <button
                    type="button"
                    onClick={() => pickerRef.current?.click()}
                    className="mt-8 flex min-h-64 w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center transition hover:border-indigo-300 hover:bg-indigo-50/40"
                  >
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
                      <Upload className="h-6 w-6" />
                    </span>
                    <span className="mt-5 text-lg font-bold text-slate-950">Elegir PDF</span>
                    <span className="mt-2 text-sm text-slate-500">o probá la demo directamente abajo</span>
                  </button>
                ) : (
                  <div className="mt-8 rounded-3xl border border-slate-200 p-5 sm:p-6">
                    <div className="flex items-start gap-4">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                        <FileText className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-950">{file.name}</p>
                        <p className="mt-1 text-xs text-slate-500">{Math.max(file.size / 1024 / 1024, 0.01).toFixed(2)} MB</p>
                      </div>
                      <button type="button" onClick={() => pickerRef.current?.click()} className="text-xs font-semibold text-indigo-700">Cambiar</button>
                    </div>

                    <div className="mt-6 border-t border-slate-100 pt-5">
                      <label htmlFor="demo-title" className="mb-2 block text-xs font-semibold text-slate-700">
                        Nombre del material <span className="font-normal text-slate-400">(opcional)</span>
                      </label>
                      <Input id="demo-title" value={title} onChange={(event) => setTitle(event.target.value)} />
                    </div>
                  </div>
                )}

                <Button type="button" size="lg" className="mt-6 w-full sm:w-auto" onClick={startDemo}>
                  <Upload className="h-4 w-4" />
                  {file ? 'Subir y empezar a procesar' : 'Ver demo de procesamiento'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">Procesando</p>
                    <h2 className="mt-2 text-3xl font-bold tracking-[-0.045em] text-slate-950">
                      {stage === 'done' ? 'Tu material está listo.' : 'Estamos procesando tu PDF.'}
                    </h2>
                    <p className="mt-2 max-w-xl truncate text-sm text-slate-500">{displayTitle}</p>
                  </div>
                  <span className="inline-flex items-center gap-2 self-start rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                    <Lock className="h-3.5 w-3.5" /> Privado
                  </span>
                </div>

                <div className="mt-7 rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                    <span>{stage === 'done' ? 'Listo para estudiar' : 'Leyendo y organizando el contenido…'}</span>
                    <span>{stage === 'done' ? '100%' : '68%'}</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: stage === 'done' ? '100%' : '68%' }} />
                  </div>
                </div>

                {!contextDone ? (
                  <div className="mt-8 rounded-3xl border border-slate-200 p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                          <GraduationCap className="h-5 w-5" />
                        </span>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.14em] text-indigo-700">Opcional</p>
                          <h3 className="mt-1 text-lg font-bold tracking-[-0.025em] text-slate-950">¿Dónde estudiás?</h3>
                          <p className="mt-1 text-sm leading-6 text-slate-500">Podés completarlo ahora mientras el PDF procesa, o seguir sin hacerlo.</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 sm:grid-cols-3">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-700">Universidad</label>
                        <Input value={universidad} onChange={(e) => setUniversidad(e.target.value)} placeholder="UBA" />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-700">Carrera</label>
                        <Input value={carrera} onChange={(e) => setCarrera(e.target.value)} placeholder="Medicina" />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-700">Materia</label>
                        <Input value={materia} onChange={(e) => setMateria(e.target.value)} placeholder="Anatomía" />
                      </div>
                    </div>

                    <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                      <Button type="button" variant="ghost" onClick={() => { setContextDone(true); setStage('done'); }}>
                        Saltar por ahora
                      </Button>
                      <Button type="button" onClick={() => { setContextDone(true); setStage('done'); }} disabled={!universidad.trim()}>
                        Guardar y continuar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-8 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                    <div>
                      <p className="text-sm font-semibold text-emerald-950">Listo para entrar a estudiar</p>
                      <p className="mt-1 text-sm text-emerald-800">En el producto real, desde acá se abre automáticamente el material procesado.</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
