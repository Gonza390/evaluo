'use client';

import { useEffect, useRef, useState } from 'react';
import { CalendarDays, FileText, Loader2, Plus, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function titleFromFile(name: string) {
  return (
    name
      .replace(/\.pdf$/i, '')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim() || 'Material de estudio'
  );
}

function countWords(value: string) {
  const normalized = value.trim();
  return normalized ? normalized.split(/\s+/).filter(Boolean).length : 0;
}

type Stage = 'upload' | 'processing';

export default function PdfFirstPublicPreviewPage() {
  const pickerRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<Stage>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [examDate, setExamDate] = useState('');
  const [career, setCareer] = useState('');
  const [subject, setSubject] = useState('');
  const [progress, setProgress] = useState(14);
  const [contextSaved, setContextSaved] = useState(false);

  const wordCount = countWords(title);
  const hasValidTitle = wordCount >= 3;

  useEffect(() => {
    if (!open || stage !== 'processing') return;

    const interval = window.setInterval(() => {
      setProgress((current) => {
        if (current >= 94) return current;
        return Math.min(94, current + Math.max(1, Math.round((94 - current) / 12)));
      });
    }, 900);

    return () => window.clearInterval(interval);
  }, [open, stage]);

  const selectFile = (selected: File | null) => {
    if (!selected) return;
    setFile(selected);
    setTitle('');
    setExamDate('');
  };

  const reset = () => {
    setFile(null);
    setTitle('');
    setExamDate('');
    setCareer('');
    setSubject('');
    setProgress(14);
    setContextSaved(false);
    setStage('upload');
  };

  const close = () => {
    setOpen(false);
    reset();
  };

  const startProcessing = () => {
    if (!file || !hasValidTitle) return;
    setProgress(14);
    setStage('processing');
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50">
      <div
        className={`min-h-screen transition duration-200 ${open ? 'pointer-events-none select-none blur-[5px]' : ''}`}
        aria-hidden={open}
      >
        <div className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
            <span className="text-xl font-black tracking-[-0.04em] text-slate-950">Evaluo</span>
            <div className="h-8 w-8 rounded-full bg-slate-200" />
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-indigo-600">Mi espacio</p>
              <h1 className="mt-1 text-3xl font-bold tracking-[-0.04em] text-slate-950">Mis materiales</h1>
              <p className="mt-2 text-sm text-slate-500">Tus PDFs y recursos de estudio en un solo lugar.</p>
            </div>
            <Button type="button" onClick={() => setOpen(true)} className="self-start sm:self-auto">
              <Plus className="h-4 w-4" />
              Subir PDF
            </Button>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {['Derecho sucesorio', 'Anatomía · Parcial 1', 'Macroeconomía'].map((name) => (
              <div key={name} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <FileText className="h-5 w-5" />
                </div>
                <p className="mt-4 font-semibold text-slate-900">{name}</p>
                <p className="mt-1 text-xs text-slate-400">PDF privado</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/25 px-4 py-8" onMouseDown={close}>
          <section
            className="w-full max-w-md rounded-3xl border border-white/70 bg-white p-5 shadow-[0_30px_100px_rgba(15,23,42,0.28)] sm:p-6"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="pdf-modal-title"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="pdf-modal-title" className="text-xl font-bold tracking-[-0.035em] text-slate-950">
                  {stage === 'upload' ? 'Subir PDF' : 'Estamos procesando tu PDF'}
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {stage === 'upload'
                    ? 'Elegí el archivo y poné un nombre claro para reconocerlo.'
                    : 'Mientras lo preparamos, contanos a qué carrera y materia pertenece.'}
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {stage === 'upload' ? (
              <>
                <input
                  ref={pickerRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  className="sr-only"
                  onChange={(event) => {
                    selectFile(event.currentTarget.files?.[0] ?? null);
                    event.currentTarget.value = '';
                  }}
                />

                {!file ? (
                  <button
                    type="button"
                    onClick={() => pickerRef.current?.click()}
                    className="mt-6 flex min-h-44 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 text-center transition hover:border-indigo-300 hover:bg-indigo-50/40"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white">
                      <Upload className="h-5 w-5" />
                    </span>
                    <span className="mt-3 text-sm font-semibold text-slate-950">Elegir PDF</span>
                    <span className="mt-1 text-xs text-slate-400">Máximo 20 MB</span>
                  </button>
                ) : (
                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={() => pickerRef.current?.click()}
                      className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-slate-300"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
                        <FileText className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-slate-900">{file.name}</span>
                        <span className="mt-0.5 block text-xs text-slate-400">Tocá para cambiar archivo</span>
                      </span>
                    </button>

                    <div className="mt-4">
                      <label htmlFor="preview-pdf-title" className="mb-1.5 block text-xs font-semibold text-slate-700">
                        Nombre
                      </label>
                      <Input
                        id="preview-pdf-title"
                        value={title}
                        onChange={(event) => {
                          const nextTitle = event.target.value;
                          setTitle(nextTitle);
                          if (countWords(nextTitle) < 3) setExamDate('');
                        }}
                        placeholder={titleFromFile(file.name)}
                      />
                      <div className="mt-1.5 flex items-center justify-between text-[11px]">
                        <span className={hasValidTitle ? 'text-emerald-600' : 'text-slate-400'}>
                          Mínimo 3 palabras
                        </span>
                        <span className={hasValidTitle ? 'font-semibold text-emerald-600' : 'text-slate-400'}>
                          {Math.min(wordCount, 3)}/3
                        </span>
                      </div>
                    </div>

                    {hasValidTitle ? (
                      <div className="mt-4 animate-in fade-in slide-in-from-top-1 duration-200">
                        <label htmlFor="preview-exam-date" className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                          <CalendarDays className="h-3.5 w-3.5 text-indigo-600" />
                          Fecha de examen <span className="font-normal text-slate-400">(opcional)</span>
                        </label>
                        <Input
                          id="preview-exam-date"
                          type="date"
                          value={examDate}
                          onChange={(event) => setExamDate(event.target.value)}
                        />
                      </div>
                    ) : null}
                  </div>
                )}

                <div className="mt-6 flex items-center justify-end gap-2">
                  <Button type="button" variant="ghost" onClick={close}>Cancelar</Button>
                  <Button type="button" disabled={!file || !hasValidTitle} onClick={startProcessing}>
                    Continuar
                  </Button>
                </div>
              </>
            ) : (
              <div className="mt-6">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{title}</p>
                      <p className="mt-0.5 text-xs text-slate-500">Leyendo y organizando el contenido…</p>
                    </div>
                    <span className="text-xs font-semibold tabular-nums text-slate-500">{progress}%</span>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-indigo-600 transition-all duration-700" style={{ width: `${progress}%` }} />
                  </div>
                </div>

                <div className="mt-5">
                  <div>
                    <label htmlFor="preview-career" className="mb-1.5 block text-xs font-semibold text-slate-700">
                      Carrera
                    </label>
                    <Input
                      id="preview-career"
                      value={career}
                      onChange={(event) => {
                        setCareer(event.target.value);
                        setContextSaved(false);
                      }}
                      placeholder="Ej. Abogacía"
                    />
                  </div>

                  <div className="mt-4">
                    <label htmlFor="preview-subject" className="mb-1.5 block text-xs font-semibold text-slate-700">
                      Materia
                    </label>
                    <Input
                      id="preview-subject"
                      value={subject}
                      onChange={(event) => {
                        setSubject(event.target.value);
                        setContextSaved(false);
                      }}
                      placeholder="Ej. Derecho sucesorio"
                    />
                  </div>

                  {contextSaved ? (
                    <p className="mt-3 text-xs font-medium text-emerald-600">Listo. Guardamos carrera y materia.</p>
                  ) : null}
                </div>

                <div className="mt-6 flex items-center justify-end">
                  <Button
                    type="button"
                    disabled={!career.trim() || !subject.trim()}
                    onClick={() => setContextSaved(true)}
                  >
                    Guardar
                  </Button>
                </div>
              </div>
            )}
          </section>
        </div>
      ) : null}
    </main>
  );
}
