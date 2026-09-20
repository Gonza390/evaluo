'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays, CheckCircle2, FileText, Loader2, Upload, X } from 'lucide-react';
import {
  getStudentMaterialProcessingStateAction,
  processStudentMaterialAction,
  type StudentMaterialProcessingState,
} from '@/app/dashboard/materiales/actions';
import { saveStudentMaterialExamContextAction } from '@/app/dashboard/materiales/context-actions';
import { savePdfFirstAcademicContextAction } from '@/app/dashboard/materiales/pdf-first-context-actions';
import {
  cancelPdfFirstUploadAction,
  finalizePdfFirstUploadAction,
  preparePdfFirstUploadAction,
} from '@/app/dashboard/materiales/pdf-first-upload-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { getStudentMaterialRoute } from '@/lib/routes';
import { trackMarketingEvent } from '@/lib/marketing-analytics';
import { getSupabaseBrowserClient } from '@/lib/supabase-client';
import { MAX_STUDENT_MATERIAL_FILE_SIZE_BYTES } from '@/lib/student-materials/validation';

type UniversidadOption = { id: string; nombre: string };
type CarreraOption = { id: string; nombre: string; universidad_id: string | null };
type MateriaOption = { id: string; nombre: string; carrera_id?: string | null };
type CarreraMateriaRelation = { carrera_id: string | null; materia_id: string | null };

const MISSING_UNIVERSITY_VALUE = '__missing_university__';

type Props = {
  children: ReactNode;
  universidades: UniversidadOption[];
  carreras: CarreraOption[];
  /** Kept for call-site compatibility; Ship I soft-ask does not require materia. */
  materias: MateriaOption[];
  /** Kept for call-site compatibility; Ship I soft-ask does not require materia. */
  carreraMaterias: CarreraMateriaRelation[];
  initialUniversidadId?: string;
  initialCarreraId?: string;
  initialMateriaId?: string;
  initialExamDate?: string;
  initialSource?: string;
  trackingMateriaId?: string;
  initialOpen?: boolean;
};

function titleFromFile(name: string) {
  return (
    name
      .replace(/\.pdf$/i, '')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 180) || 'Material de estudio'
  );
}

function isUploadTriggerLabel(label: string) {
  const normalized = label
    .toLocaleLowerCase('es-AR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const hasUploadVerb = /\bsubi(?:r)?\b/u.test(normalized);
  return hasUploadVerb && (normalized.includes('pdf') || normalized.includes('material'));
}

export function PdfFirstUploadShell({
  children,
  universidades,
  carreras,
  materias: _materias,
  carreraMaterias: _carreraMaterias,
  initialUniversidadId = '',
  initialCarreraId = '',
  initialMateriaId: _initialMateriaId = '',
  initialExamDate = '',
  initialSource = '',
  trackingMateriaId = '',
  initialOpen = false,
}: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const pickerRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(initialOpen);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [examDate, setExamDate] = useState(initialExamDate);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState<StudentMaterialProcessingState | null>(null);
  const [displayProgress, setDisplayProgress] = useState(0);
  const [universityId, setUniversityId] = useState(initialUniversidadId);
  const [requestingUniversity, setRequestingUniversity] = useState(false);
  const [newUniversity, setNewUniversity] = useState('');
  const [careerId, setCareerId] = useState(initialCarreraId);
  const [addingCareer, setAddingCareer] = useState(false);
  const [newCareer, setNewCareer] = useState('');
  const [savingContext, setSavingContext] = useState(false);
  const [contextSaved, setContextSaved] = useState(false);
  const [savedContextLabel, setSavedContextLabel] = useState('');
  const [showReadyContext, setShowReadyContext] = useState(false);

  const selectedUniversity = universidades.find((item) => item.id === universityId) ?? null;
  const availableCareers = useMemo(
    () => (universityId ? carreras.filter((item) => item.universidad_id === universityId) : []),
    [carreras, universityId]
  );
  const selectedCareer = availableCareers.find((item) => item.id === careerId) ?? null;

  const hasValidTitle = title.trim().length >= 3;
  const universityName = requestingUniversity ? newUniversity.trim() : selectedUniversity?.nombre ?? '';
  const careerName = addingCareer ? newCareer.trim() : selectedCareer?.nombre ?? '';
  const hasUniversity = requestingUniversity ? universityName.length >= 3 : Boolean(universityId);
  const hasCareer = addingCareer ? careerName.length >= 3 : Boolean(careerId);
  const canSaveContext = Boolean(hasUniversity && hasCareer && !contextSaved);
  const ready = processing?.status === 'ready';
  const failed = processing?.status === 'failed';
  const progress = processing
    ? ready
      ? 100
      : Math.min(96, Math.max(displayProgress, processing.progress))
    : 0;

  useEffect(() => {
    if (initialOpen) setOpen(true);
  }, [initialOpen]);

  useEffect(() => {
    if (!processing || processing.status === 'ready' || processing.status === 'failed') return;
    const interval = window.setInterval(async () => {
      const state = await getStudentMaterialProcessingStateAction(processing.materialId);
      if (!state) return;
      setProcessing(state);
      setDisplayProgress((current) => Math.max(current, state.progress));
      if (state.status === 'ready') router.refresh();
    }, 1400);
    return () => window.clearInterval(interval);
  }, [processing?.materialId, processing?.status, router]);

  useEffect(() => {
    if (!processing || processing.status === 'ready' || processing.status === 'failed') return;
    const interval = window.setInterval(() => {
      setDisplayProgress((current) => Math.min(94, Math.max(current, processing.progress) + 1));
    }, 700);
    return () => window.clearInterval(interval);
  }, [processing]);

  const reset = useCallback(() => {
    setFile(null);
    setTitle('');
    setExamDate(initialExamDate);
    setUploading(false);
    setProcessing(null);
    setDisplayProgress(0);
    setUniversityId(initialUniversidadId);
    setRequestingUniversity(false);
    setNewUniversity('');
    setCareerId(initialCarreraId);
    setAddingCareer(false);
    setNewCareer('');
    setSavingContext(false);
    setContextSaved(false);
    setSavedContextLabel('');
    setShowReadyContext(false);
  }, [initialCarreraId, initialExamDate, initialUniversidadId]);

  const close = useCallback(() => {
    if (uploading) return;
    const shouldRefresh = Boolean(processing);
    setOpen(false);
    reset();
    if (shouldRefresh) router.refresh();
  }, [processing, reset, router, uploading]);

  const handleCapturedClick = (event: MouseEvent<HTMLDivElement>) => {
    const element = event.target as HTMLElement | null;
    const button = element?.closest('button');
    if (!button || !isUploadTriggerLabel(button.textContent ?? '')) return;
    event.preventDefault();
    event.stopPropagation();
    setOpen(true);
  };

  const selectFile = (selected: File | null) => {
    if (!selected) return;
    if (!selected.name.toLowerCase().endsWith('.pdf') || (selected.type && selected.type !== 'application/pdf')) {
      toast({ description: 'Por ahora solo aceptamos archivos PDF.', variant: 'destructive' });
      return;
    }
    if (selected.size > MAX_STUDENT_MATERIAL_FILE_SIZE_BYTES) {
      toast({ description: 'El PDF supera el tamaño máximo permitido de 20 MB.', variant: 'destructive' });
      return;
    }
    setFile(selected);
    setTitle('');
    setExamDate(initialExamDate);
  };

  const startProcessing = async () => {
    if (!file || !hasValidTitle || uploading) return;
    setUploading(true);
    let preparedPath: string | null = null;

    try {
      const metadata = { title: title.trim() };
      const fileMetadata = {
        name: file.name,
        mimeType: file.type || 'application/pdf',
        size: file.size,
      };
      const prepared = await preparePdfFirstUploadAction({ metadata, file: fileMetadata });
      if (!prepared.success || !prepared.filePath || !prepared.token) {
        throw new Error(prepared.message);
      }
      preparedPath = prepared.filePath;

      const supabase = getSupabaseBrowserClient();
      const { error: uploadError } = await supabase.storage
        .from('biblioteca')
        .uploadToSignedUrl(prepared.filePath, prepared.token, file, {
          contentType: fileMetadata.mimeType,
        });
      if (uploadError) throw new Error('No pudimos transferir el PDF. Intentá nuevamente.');

      const result = await finalizePdfFirstUploadAction({
        metadata,
        file: fileMetadata,
        filePath: prepared.filePath,
      });
      if (!result.success || !result.materialId) {
        if (result.errorCode === 'page_limit' && result.maxPages) {
          throw new Error(`Este PDF supera el límite de ${result.maxPages} páginas de tu plan.`);
        }
        throw new Error(result.message);
      }

      if (examDate) {
        const examResult = await saveStudentMaterialExamContextAction({
          materialId: result.materialId,
          examInstance: null,
          examDate,
        });
        if (!examResult.success) {
          toast({ description: examResult.message, variant: 'destructive' });
        }
      }

      if (initialSource === 'preguntero-exam-intent') {
        trackMarketingEvent('preguntero_exam_pdf_uploaded', {
          source: initialSource,
          materia_id: trackingMateriaId || _initialMateriaId || null,
          exam_date: examDate || null,
          material_id: result.materialId,
        });
      }

      const initialState: StudentMaterialProcessingState = {
        materialId: result.materialId,
        title: metadata.title,
        fileName: file.name,
        status: 'uploaded',
        stage: 'uploaded',
        progress: 10,
        message: 'PDF subido. Empezamos a procesarlo.',
        error: null,
      };
      setProcessing(initialState);
      setDisplayProgress(10);
      void processStudentMaterialAction(result.materialId);
      preparedPath = null;
    } catch (error) {
      if (preparedPath) {
        await cancelPdfFirstUploadAction(preparedPath).catch(() => undefined);
      }
      toast({
        description: error instanceof Error ? error.message : 'No pudimos subir tu PDF.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const saveContext = async () => {
    if (!processing || !canSaveContext || savingContext) return;
    setSavingContext(true);
    const result = await savePdfFirstAcademicContextAction({
      materialId: processing.materialId,
      universidadId: requestingUniversity ? null : universityId || null,
      universidadNombre: requestingUniversity ? universityName : selectedUniversity?.nombre ?? null,
      carreraId: addingCareer ? null : selectedCareer?.id ?? null,
      carreraNombre: careerName,
      materiaId: null,
      materiaNombre: null,
    });

    if (!result.success) {
      toast({ description: result.message, variant: 'destructive' });
      setSavingContext(false);
      return;
    }

    setContextSaved(true);
    setSavedContextLabel(
      [result.context.universidadNombre, result.context.carreraNombre].filter(Boolean).join(' · ')
    );
    setSavingContext(false);
    if (ready) setShowReadyContext(false);
    router.refresh();
  };

  const openMaterial = () => {
    if (!processing) return;
    setOpen(false);
    router.push(getStudentMaterialRoute(processing.materialId));
    router.refresh();
  };

  const openDiagnostic = () => {
    if (!processing || !ready) return;
    setOpen(false);
    router.push(`${getStudentMaterialRoute(processing.materialId)}?diagnostico=1`);
    router.refresh();
  };

  /** Skip never blocks upload or studying: ready → open material; otherwise close + refresh library. */
  const skipContext = () => {
    if (!processing) return;
    if (ready && showReadyContext) {
      setShowReadyContext(false);
      return;
    }
    if (ready) {
      openMaterial();
      return;
    }
    close();
  };

  const universitySelectValue = requestingUniversity ? MISSING_UNIVERSITY_VALUE : universityId;

  return (
    <div className="relative">
      <div
        onClickCapture={handleCapturedClick}
        className={`transition duration-200 ${open ? 'pointer-events-none select-none blur-[5px]' : ''}`}
        aria-hidden={open}
      >
        {children}
      </div>

      {open ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/25 px-4 py-8" onMouseDown={close}>
          <section
            className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-3xl border border-white/70 bg-white p-5 shadow-[0_30px_100px_rgba(15,23,42,0.28)] [scrollbar-width:none] sm:p-6 [&::-webkit-scrollbar]:hidden"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="pdf-first-modal-title"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="pdf-first-modal-title" className="text-xl font-bold tracking-[-0.035em] text-slate-950">
                  {processing ? (failed ? 'No pudimos procesar tu PDF' : ready ? 'Tu PDF está listo' : 'Estamos procesando tu PDF') : 'Subir PDF'}
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {processing
                    ? ready
                      ? 'Terminamos de preparar tu material.'
                      : 'Mientras lo preparamos, podés indicar universidad y carrera. También podés saltar.'
                    : 'Elegí el archivo y poné un nombre. La fecha de examen es opcional.'}
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                disabled={uploading}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

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

            {!processing ? (
              <>
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
                      <label htmlFor="pdf-first-title" className="mb-1.5 block text-xs font-semibold text-slate-700">Nombre</label>
                      <Input
                        id="pdf-first-title"
                        value={title}
                        onChange={(event) => {
                          const next = event.target.value;
                          setTitle(next);
                          if (next.trim().length < 3) setExamDate('');
                        }}
                        placeholder={titleFromFile(file.name)}
                      />
                    </div>

                    {hasValidTitle ? (
                      <div className="mt-4 animate-in fade-in slide-in-from-top-1 duration-200">
                        <label htmlFor="pdf-first-exam-date" className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                          <CalendarDays className="h-3.5 w-3.5 text-indigo-600" />
                          Fecha de examen
                          <span className="font-medium text-slate-400">(opcional)</span>
                        </label>
                        <Input
                          id="pdf-first-exam-date"
                          type="date"
                          value={examDate}
                          onChange={(event) => setExamDate(event.target.value)}
                        />
                      </div>
                    ) : null}
                  </div>
                )}

                <div className="mt-6 flex items-center justify-end gap-2">
                  <Button type="button" variant="ghost" onClick={close} disabled={uploading}>Cancelar</Button>
                  <Button type="button" disabled={!file || !hasValidTitle || uploading} onClick={startProcessing}>
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Continuar
                  </Button>
                </div>
              </>
            ) : (
              <div className="mt-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center text-indigo-600">
                    {ready ? <CheckCircle2 className="h-5 w-5" /> : failed ? <FileText className="h-5 w-5" /> : <Loader2 className="h-5 w-5 animate-spin" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{processing.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{failed ? processing.error ?? 'El procesamiento se interrumpió.' : ready ? 'Procesamiento completado' : processing.message}</p>
                  </div>
                  <span className="text-xs font-semibold tabular-nums text-slate-500">{progress}%</span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-indigo-600 transition-all duration-700" style={{ width: `${progress}%` }} />
                </div>

                {ready && !showReadyContext ? (
                  <>
                    <p className="mt-5 text-sm leading-6 text-slate-600">
                      Antes de empezar, respondé unas preguntas rápidas para saber qué ya dominás y qué conviene repasar.
                    </p>
                    <p className="mt-2 text-xs text-slate-400">6 preguntas · ~4 min</p>
                    {contextSaved ? (
                      <p className="mt-4 text-xs font-medium text-emerald-700">Guardado · {savedContextLabel}</p>
                    ) : null}

                    <div className="mt-6 flex items-center justify-end gap-2">
                      <Button type="button" variant="ghost" onClick={openMaterial}>
                        Abrir PDF
                      </Button>
                      <Button type="button" onClick={openDiagnostic}>
                        Ver qué tanto sé
                      </Button>
                    </div>

                    {!contextSaved ? (
                      <button
                        type="button"
                        onClick={() => setShowReadyContext(true)}
                        className="mt-3 w-full text-center text-xs font-semibold text-slate-400 transition hover:text-slate-600"
                      >
                        Agregar universidad y carrera
                      </button>
                    ) : null}
                  </>
                ) : null}

                {!failed && (!ready || showReadyContext) ? (
                  <>
                    {!contextSaved ? (
                      <div className="mt-5 space-y-4">
                        <p className="text-xs leading-5 text-slate-500">
                          Opcional · universidad y carrera ayudan a ordenar tu espacio. La materia no es necesaria acá.
                        </p>

                        <div>
                          <label htmlFor="pdf-first-university" className="mb-1.5 block text-xs font-semibold text-slate-700">Universidad</label>
                          {!requestingUniversity ? (
                            <>
                              <select
                                id="pdf-first-university"
                                value={universitySelectValue}
                                onChange={(event) => {
                                  const value = event.target.value;
                                  if (value === MISSING_UNIVERSITY_VALUE) {
                                    setRequestingUniversity(true);
                                    setUniversityId('');
                                    setCareerId('');
                                    setAddingCareer(false);
                                    setNewCareer('');
                                    return;
                                  }
                                  setRequestingUniversity(false);
                                  setNewUniversity('');
                                  setUniversityId(value);
                                  setCareerId('');
                                  setAddingCareer(false);
                                  setNewCareer('');
                                }}
                                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                              >
                                <option value="">Seleccionar universidad</option>
                                {universidades.map((uni) => (
                                  <option key={uni.id} value={uni.id}>{uni.nombre}</option>
                                ))}
                                <option value={MISSING_UNIVERSITY_VALUE}>Mi universidad no aparece</option>
                              </select>
                              <button
                                type="button"
                                onClick={() => {
                                  setRequestingUniversity(true);
                                  setUniversityId('');
                                  setCareerId('');
                                  setAddingCareer(false);
                                  setNewCareer('');
                                }}
                                className="mt-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                              >
                                Mi universidad no aparece
                              </button>
                            </>
                          ) : (
                            <div className="space-y-2">
                              <Input
                                value={newUniversity}
                                onChange={(event) => setNewUniversity(event.target.value)}
                                placeholder="Nombre de tu universidad"
                                autoFocus
                              />
                              <p className="text-[11px] leading-4 text-slate-400">
                                La pedimos para vos; queda privada hasta que la revisemos.
                              </p>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setRequestingUniversity(false);
                                  setNewUniversity('');
                                  setUniversityId(initialUniversidadId);
                                }}
                              >
                                Volver al listado
                              </Button>
                            </div>
                          )}
                        </div>

                        {hasUniversity ? (
                          <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                            <label htmlFor="pdf-first-career" className="mb-1.5 block text-xs font-semibold text-slate-700">Carrera</label>
                            {!addingCareer ? (
                              <>
                                <select
                                  id="pdf-first-career"
                                  value={careerId}
                                  onChange={(event) => setCareerId(event.target.value)}
                                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                                  disabled={requestingUniversity}
                                >
                                  <option value="">Seleccionar carrera</option>
                                  {availableCareers.map((career) => (
                                    <option key={career.id} value={career.id}>{career.nombre}</option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAddingCareer(true);
                                    setCareerId('');
                                  }}
                                  className="mt-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                                >
                                  {requestingUniversity || availableCareers.length === 0
                                    ? 'Solicitar carrera'
                                    : '+ Añadir carrera'}
                                </button>
                              </>
                            ) : (
                              <div className="space-y-2">
                                <div className="flex gap-2">
                                  <Input
                                    value={newCareer}
                                    onChange={(event) => setNewCareer(event.target.value)}
                                    placeholder="Nombre de la carrera"
                                    autoFocus
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                      setAddingCareer(false);
                                      setNewCareer('');
                                    }}
                                  >
                                    Cancelar
                                  </Button>
                                </div>
                                <p className="text-[11px] leading-4 text-slate-400">
                                  Si no está en el listado, la pedimos para tu uso privado.
                                </p>
                              </div>
                            )}
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <p className="mt-4 text-sm font-medium text-emerald-700">Guardado · {savedContextLabel}</p>
                    )}

                    <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
                      {!contextSaved ? (
                        <Button type="button" variant="ghost" onClick={skipContext}>
                          Saltar
                        </Button>
                      ) : null}
                      {!contextSaved ? (
                        <Button type="button" disabled={!canSaveContext || savingContext} onClick={saveContext}>
                          {savingContext ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                          Guardar
                        </Button>
                      ) : null}
                      {contextSaved && ready ? <Button type="button" onClick={openMaterial}>Abrir PDF</Button> : null}
                      {contextSaved && !ready ? (
                        <Button type="button" variant="outline" onClick={close}>
                          Seguir en mi biblioteca
                        </Button>
                      ) : null}
                    </div>
                  </>
                ) : failed ? (
                  <div className="mt-6 flex justify-end">
                    <Button type="button" variant="outline" onClick={close}>Cerrar</Button>
                  </div>
                ) : null}
              </div>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}
