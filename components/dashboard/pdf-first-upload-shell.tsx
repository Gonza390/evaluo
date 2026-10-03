'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays, CheckCircle2, FileText, Loader2, Upload } from 'lucide-react';
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
import { consumeFirstPdfDemoUpload } from '@/lib/first-pdf-demo-analytics';
import { clearPdfFirstDraft, loadPdfFirstDraft } from '@/lib/pdf-first-draft';
import { getSupabaseBrowserClient } from '@/lib/supabase-client';
import { MAX_STUDENT_MATERIAL_FILE_SIZE_BYTES } from '@/lib/student-materials/validation';
import { PdfProcessingPanel } from '@/components/pdf-processing/pdf-processing-panel';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';

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
  initialMateriaId = '',
  initialExamDate = '',
  initialSource = '',
  trackingMateriaId = '',
  initialOpen = false,
}: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const isPreAuthPdfResume =
    initialSource.startsWith('pdf-first-landing') || initialSource.startsWith('home-pdf-first-');
  const initialProfileUniversity =
    universidades.find((item) => item.id === initialUniversidadId) ?? null;
  const initialProfileCareer =
    carreras.find(
      (item) => item.id === initialCarreraId && item.universidad_id === initialUniversidadId
    ) ?? null;
  const hasInitialUniversityProfile = Boolean(initialProfileUniversity);
  const hasInitialAcademicProfile = Boolean(initialProfileUniversity && initialProfileCareer);
  const initialAcademicProfileLabel = [
    initialProfileUniversity?.nombre,
    initialProfileCareer?.nombre,
  ]
    .filter(Boolean)
    .join(' · ');
  const pickerRef = useRef<HTMLInputElement | null>(null);
  const resumeHandledRef = useRef(false);
  const readyTrackedRef = useRef(false);
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
  const [profileUniversitySaved, setProfileUniversitySaved] = useState(hasInitialUniversityProfile);
  const [profileUniversityName, setProfileUniversityName] = useState(
    initialProfileUniversity?.nombre ?? ''
  );
  const [contextSaved, setContextSaved] = useState(hasInitialAcademicProfile);
  const [savedContextLabel, setSavedContextLabel] = useState(initialAcademicProfileLabel);
  const [showReadyContext, setShowReadyContext] = useState(false);
  const [restoringDraft, setRestoringDraft] = useState(initialOpen && isPreAuthPdfResume);

  const selectedUniversity = universidades.find((item) => item.id === universityId) ?? null;
  const availableCareers = useMemo(
    () => (universityId ? carreras.filter((item) => item.universidad_id === universityId) : []),
    [carreras, universityId]
  );
  const selectedCareer = availableCareers.find((item) => item.id === careerId) ?? null;

  const hasValidTitle = title.trim().length >= 3;
  const universityName = requestingUniversity
    ? newUniversity.trim()
    : (selectedUniversity?.nombre ?? '');
  const careerName = addingCareer ? newCareer.trim() : (selectedCareer?.nombre ?? '');
  const hasUniversity = requestingUniversity ? universityName.length >= 3 : Boolean(universityId);
  const hasCareer = addingCareer ? careerName.length >= 3 : Boolean(careerId);
  const canSaveContext = Boolean(
    hasUniversity && !contextSaved && (!profileUniversitySaved || hasCareer)
  );
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
    setProfileUniversitySaved(hasInitialUniversityProfile);
    setProfileUniversityName(initialProfileUniversity?.nombre ?? '');
    setContextSaved(hasInitialAcademicProfile);
    setSavedContextLabel(initialAcademicProfileLabel);
    setShowReadyContext(false);
    readyTrackedRef.current = false;
  }, [
    hasInitialAcademicProfile,
    hasInitialUniversityProfile,
    initialAcademicProfileLabel,
    initialProfileUniversity?.nombre,
    initialCarreraId,
    initialExamDate,
    initialUniversidadId,
  ]);

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
    if (
      !selected.name.toLowerCase().endsWith('.pdf') ||
      (selected.type && selected.type !== 'application/pdf')
    ) {
      toast({ description: 'Por ahora solo aceptamos archivos PDF.', variant: 'destructive' });
      return;
    }
    if (selected.size > MAX_STUDENT_MATERIAL_FILE_SIZE_BYTES) {
      toast({
        description: 'El PDF supera el tamaño máximo permitido de 20 MB.',
        variant: 'destructive',
      });
      return;
    }
    setFile(selected);
    setTitle(titleFromFile(selected.name));
    setExamDate(initialExamDate);
  };

  const startProcessing = async (selectedFile?: File | null, selectedTitle?: string) => {
    const activeFile = selectedFile ?? file;
    const activeTitle =
      (selectedTitle ?? title).trim() || (activeFile ? titleFromFile(activeFile.name) : '');
    if (!activeFile || activeTitle.length < 3 || uploading) return;

    setUploading(true);
    let preparedPath: string | null = null;

    if (isPreAuthPdfResume) {
      trackMarketingEvent('pdf_upload_started', {
        source: initialSource,
        file_size_bytes: activeFile.size,
      });
    }

    try {
      const metadata = { title: activeTitle, materiaId: initialMateriaId || null };
      const fileMetadata = {
        name: activeFile.name,
        mimeType: activeFile.type || 'application/pdf',
        size: activeFile.size,
      };
      const prepared = await preparePdfFirstUploadAction({ metadata, file: fileMetadata });
      if (!prepared.success || !prepared.filePath || !prepared.token) {
        throw new Error(prepared.message);
      }
      preparedPath = prepared.filePath;

      const supabase = getSupabaseBrowserClient();
      const { error: uploadError } = await supabase.storage
        .from('biblioteca')
        .uploadToSignedUrl(prepared.filePath, prepared.token, activeFile, {
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

      // El clic no es una conversión: contamos la carga cuando el servidor la confirmó.
      try {
        trackMarketingEvent('pdf_uploaded', {
          source: initialSource || 'dashboard',
          material_id: result.materialId,
          file_size_bytes: activeFile.size,
          environment: process.env.NODE_ENV,
          ...consumeFirstPdfDemoUpload(initialSource),
        });
      } catch {
        // Analytics nunca debe convertir una carga exitosa en un error de interfaz.
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
          materia_id: trackingMateriaId || initialMateriaId || null,
          exam_date: examDate || null,
          material_id: result.materialId,
        });
      }

      if (isPreAuthPdfResume) {
        await clearPdfFirstDraft().catch(() => undefined);
        trackMarketingEvent('material_processing_started', {
          source: initialSource,
          material_id: result.materialId,
        });
      }

      const initialState: StudentMaterialProcessingState = {
        materialId: result.materialId,
        title: metadata.title,
        fileName: activeFile.name,
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

  useEffect(() => {
    if (!initialOpen || !isPreAuthPdfResume || resumeHandledRef.current) return;

    resumeHandledRef.current = true;
    setOpen(true);
    setRestoringDraft(true);

    void loadPdfFirstDraft()
      .then(async (draft) => {
        if (!draft || draft.source !== initialSource) return;
        const restoredTitle = titleFromFile(draft.file.name);
        setFile(draft.file);
        setTitle(restoredTitle);
        setExamDate(initialExamDate);
        trackMarketingEvent('pdf_draft_restored', {
          source: initialSource,
          file_size_bytes: draft.file.size,
        });
        await startProcessing(draft.file, restoredTitle);
      })
      .catch(() => {
        toast({
          description: 'No pudimos recuperar el PDF seleccionado. Elegilo nuevamente.',
          variant: 'destructive',
        });
      })
      .finally(() => setRestoringDraft(false));
  }, [initialExamDate, initialOpen, initialSource, isPreAuthPdfResume, startProcessing, toast]);

  useEffect(() => {
    if (
      !isPreAuthPdfResume ||
      !processing ||
      processing.status !== 'ready' ||
      readyTrackedRef.current
    ) {
      return;
    }

    readyTrackedRef.current = true;
    trackMarketingEvent('material_ready', {
      source: initialSource,
      material_id: processing.materialId,
    });
  }, [initialSource, isPreAuthPdfResume, processing]);

  const saveContext = async () => {
    if (!processing || !canSaveContext || savingContext) return;
    setSavingContext(true);
    const result = await savePdfFirstAcademicContextAction({
      materialId: processing.materialId,
      universidadId: requestingUniversity ? null : universityId || null,
      universidadNombre: requestingUniversity
        ? universityName
        : (selectedUniversity?.nombre ?? null),
      carreraId: addingCareer ? null : (selectedCareer?.id ?? null),
      carreraNombre: careerName,
      materiaId: null,
      materiaNombre: null,
    });

    if (!result.success) {
      toast({ description: result.message, variant: 'destructive' });
      setSavingContext(false);
      return;
    }

    const universityWasSaved = Boolean(result.context.universidadId);
    const careerWasSaved = Boolean(result.context.carreraId);

    if (result.context.universidadId) {
      setUniversityId(result.context.universidadId);
    }
    setRequestingUniversity(false);
    setProfileUniversitySaved(universityWasSaved);
    setProfileUniversityName(result.context.universidadNombre ?? universityName);
    setContextSaved(universityWasSaved && careerWasSaved);
    setSavedContextLabel(
      [result.context.universidadNombre, result.context.carreraNombre].filter(Boolean).join(' · ')
    );
    setSavingContext(false);
    if (ready && universityWasSaved && careerWasSaved) setShowReadyContext(false);
    router.refresh();
  };

  const openMaterial = () => {
    if (!processing || !ready) return;
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

  const openSummary = () => {
    if (!processing || !ready) return;
    setOpen(false);
    router.push(`${getStudentMaterialRoute(processing.materialId)}?tab=resumen`);
    router.refresh();
  };

  /** El contexto académico es opcional y vuelve al mismo proceso de carga. */
  const skipContext = () => {
    if (!processing) return;
    setShowReadyContext(false);
  };

  const universitySelectValue = requestingUniversity ? MISSING_UNIVERSITY_VALUE : universityId;

  return (
    <div className="relative">
      <div
        onClickCapture={handleCapturedClick}
        className={`transition duration-200 ${open ? 'pointer-events-none blur-[5px] select-none' : ''}`}
        aria-hidden={open}
      >
        {children}
      </div>

      {open ? (
        <Dialog
          open
          onOpenChange={(nextOpen) => {
            if (!nextOpen) close();
          }}
        >
          <DialogContent
            className="journey-modal"
            overlayClassName="journey-modal-overlay"
            showCloseButton={!uploading}
            onInteractOutside={(event) => {
              if (uploading) event.preventDefault();
            }}
            onEscapeKeyDown={(event) => {
              if (uploading) event.preventDefault();
            }}
          >
            <DialogTitle className="sr-only">
              {processing
                ? failed
                  ? 'No pudimos procesar tu PDF'
                  : ready
                    ? 'Tu PDF está listo'
                    : 'Preparación de tu PDF'
                : 'Subir PDF'}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Subí tu material y elegí cómo empezar a estudiarlo cuando esté listo.
            </DialogDescription>
            {(!processing || failed || showReadyContext) && (
              <div className="flex items-start justify-between gap-4 pr-10">
                <div>
                  <h2
                    id="pdf-first-modal-title"
                    className="text-xl font-bold tracking-[-0.035em] text-slate-950"
                  >
                    {processing
                      ? failed
                        ? 'No pudimos procesar tu PDF'
                        : ready
                          ? 'Tu PDF está listo'
                          : 'Estamos procesando tu PDF'
                      : 'Subir PDF'}
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    {processing
                      ? ready
                        ? 'Terminamos de preparar tu material.'
                        : isPreAuthPdfResume
                          ? 'Ya tenemos tu archivo. Lo estamos convirtiendo en material de estudio.'
                          : 'Mientras lo preparamos, podés indicar universidad y carrera. También podés saltar.'
                      : restoringDraft
                        ? 'Recuperando el PDF que elegiste antes del registro.'
                        : 'Elegí el archivo y poné un nombre.'}
                  </p>
                </div>
              </div>
            )}

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
                {!file && restoringDraft ? (
                  <div className="mt-6 flex min-h-44 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-5 text-center">
                    <Loader2 className="h-6 w-6 animate-spin text-indigo-600" aria-hidden="true" />
                    <span className="mt-3 text-sm font-semibold text-slate-950">
                      Recuperando tu PDF…
                    </span>
                    <span className="mt-1 text-xs text-slate-400">
                      No hace falta elegirlo de nuevo.
                    </span>
                  </div>
                ) : !file ? (
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
                        <span className="block truncate text-sm font-semibold text-slate-900">
                          {file.name}
                        </span>
                        <span className="mt-0.5 block text-xs text-slate-400">
                          Tocá para cambiar archivo
                        </span>
                      </span>
                    </button>

                    <div className="mt-4">
                      <label
                        htmlFor="pdf-first-title"
                        className="mb-1.5 block text-xs font-semibold text-slate-700"
                      >
                        Nombre del material
                      </label>
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
                      <div className="animate-in fade-in slide-in-from-top-1 mt-4 duration-200">
                        <label
                          htmlFor="pdf-first-exam-date"
                          className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700"
                        >
                          <CalendarDays className="h-3.5 w-3.5 text-indigo-600" />
                          Fecha de examen
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
                  <Button type="button" variant="ghost" onClick={close} disabled={uploading}>
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    disabled={!file || !hasValidTitle || uploading}
                    onClick={() => void startProcessing()}
                  >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Procesar este PDF
                  </Button>
                </div>
              </>
            ) : !failed && !showReadyContext ? (
              <>
                <PdfProcessingPanel
                  file={file}
                  fileName={processing.fileName}
                  complete={ready}
                  progress={progress}
                  processingMessage={processing.message}
                  onStartDiagnostic={openDiagnostic}
                  onStartSummary={openSummary}
                  onViewTools={openMaterial}
                />
                {!ready && !contextSaved && !isPreAuthPdfResume && (
                  <button
                    type="button"
                    className="journey-tools-button"
                    onClick={() => setShowReadyContext(true)}
                  >
                    Agregar universidad y carrera
                  </button>
                )}
              </>
            ) : (
              <div className="mt-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center text-indigo-600">
                    {ready ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : failed ? (
                      <FileText className="h-5 w-5" />
                    ) : (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {processing.title}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {failed
                        ? (processing.error ?? 'El procesamiento se interrumpió.')
                        : ready
                          ? 'Procesamiento completado'
                          : processing.message}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-slate-500 tabular-nums">
                    {progress}%
                  </span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-indigo-600 transition-all duration-700"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {!failed && showReadyContext ? (
                  <>
                    {!contextSaved ? (
                      <div className="mt-5 space-y-4">
                        <p className="text-xs leading-5 text-slate-500">
                          Universidad y carrera se guardan en tu perfil una sola vez. No te las
                          volvemos a pedir en cada PDF.
                        </p>

                        <div>
                          <label
                            htmlFor="pdf-first-university"
                            className="mb-1.5 block text-xs font-semibold text-slate-700"
                          >
                            Universidad
                          </label>
                          {profileUniversitySaved ? (
                            <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-700">
                              Guardada en tu perfil · {profileUniversityName}
                            </div>
                          ) : !requestingUniversity ? (
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
                                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                              >
                                <option value="">Seleccionar universidad</option>
                                {universidades.map((uni) => (
                                  <option key={uni.id} value={uni.id}>
                                    {uni.nombre}
                                  </option>
                                ))}
                                <option value={MISSING_UNIVERSITY_VALUE}>
                                  Mi universidad no aparece
                                </option>
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
                                La universidad se habilita automáticamente y queda guardada en tu
                                perfil.
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
                            <label
                              htmlFor="pdf-first-career"
                              className="mb-1.5 block text-xs font-semibold text-slate-700"
                            >
                              Carrera
                            </label>
                            {!addingCareer ? (
                              <>
                                <select
                                  id="pdf-first-career"
                                  value={careerId}
                                  onChange={(event) => setCareerId(event.target.value)}
                                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                                  disabled={requestingUniversity}
                                >
                                  <option value="">Seleccionar carrera</option>
                                  {availableCareers.map((career) => (
                                    <option key={career.id} value={career.id}>
                                      {career.nombre}
                                    </option>
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
                      <p className="mt-4 text-sm font-medium text-emerald-700">
                        Guardado · {savedContextLabel}
                      </p>
                    )}

                    <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
                      {!contextSaved ? (
                        <Button type="button" variant="ghost" onClick={skipContext}>
                          Saltar
                        </Button>
                      ) : null}
                      {!contextSaved ? (
                        <Button
                          type="button"
                          disabled={!canSaveContext || savingContext}
                          onClick={saveContext}
                        >
                          {savingContext ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                          {!profileUniversitySaved
                            ? hasCareer
                              ? 'Guardar universidad y carrera'
                              : 'Guardar universidad'
                            : 'Guardar carrera'}
                        </Button>
                      ) : null}
                      {contextSaved && ready ? (
                        <Button type="button" onClick={() => setShowReadyContext(false)}>
                          Continuar
                        </Button>
                      ) : null}
                      {contextSaved && !ready ? (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowReadyContext(false)}
                        >
                          Continuar
                        </Button>
                      ) : null}
                    </div>
                  </>
                ) : failed ? (
                  <div className="mt-6 flex justify-end">
                    <Button type="button" variant="outline" onClick={close}>
                      Cerrar
                    </Button>
                  </div>
                ) : null}
              </div>
            )}
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}
