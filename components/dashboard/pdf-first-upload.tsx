'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  GraduationCap,
  Loader2,
  Lock,
  Upload,
} from 'lucide-react';
import {
  getStudentMaterialProcessingStateAction,
  processStudentMaterialAction,
  type StudentMaterialProcessingState,
} from '@/app/dashboard/materiales/actions';
import { savePdfFirstAcademicContextAction } from '@/app/dashboard/materiales/pdf-first-context-actions';
import {
  cancelPdfFirstUploadAction,
  finalizePdfFirstUploadAction,
  preparePdfFirstUploadAction,
} from '@/app/dashboard/materiales/pdf-first-upload-actions';
import {
  StudentMaterialUploadErrorScreen,
  type StudentMaterialUploadConstraint,
} from '@/components/dashboard/student-material-upload-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { trackMarketingEvent } from '@/lib/marketing-analytics';
import { getStudentMaterialRoute } from '@/lib/routes';
import { getSupabaseBrowserClient } from '@/lib/supabase-client';
import { MAX_STUDENT_MATERIAL_FILE_SIZE_BYTES } from '@/lib/student-materials/validation';

type UniversidadOption = { id: string; nombre: string };
type CarreraOption = { id: string; nombre: string; universidad_id: string | null };
type MateriaOption = { id: string; nombre: string; carrera_id: string | null };
type CarreraMateriaRelation = { carrera_id: string | null; materia_id: string | null };

type Props = {
  universidades: UniversidadOption[];
  carreras: CarreraOption[];
  materias: MateriaOption[];
  carreraMaterias: CarreraMateriaRelation[];
  initialUniversidadId?: string;
  initialCarreraId?: string;
  initialMateriaId?: string;
};

type ContextDecision = 'pending' | 'saved' | 'skipped';

function getTitleFromFileName(fileName: string) {
  return (
    fileName
      .replace(/\.pdf$/i, '')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 180) || 'Material de estudio'
  );
}

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('es-AR');
}

function FlowSteps({ activeStep }: { activeStep: number }) {
  const steps = ['PDF', 'Contexto', 'Estudiar'];

  return (
    <div className="flex items-center gap-2" aria-label="Progreso de carga">
      {steps.map((step, index) => {
        const completed = index < activeStep;
        const active = index === activeStep;
        return (
          <div key={step} className="flex min-w-0 flex-1 items-center gap-2 last:flex-initial">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                completed
                  ? 'bg-slate-950 text-white'
                  : active
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-400'
              }`}
            >
              {completed ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
            </div>
            <span
              className={`hidden text-xs font-semibold sm:block ${
                active || completed ? 'text-slate-900' : 'text-slate-400'
              }`}
            >
              {step}
            </span>
            {index < steps.length - 1 ? (
              <div className={`h-px min-w-5 flex-1 ${completed ? 'bg-slate-900' : 'bg-slate-200'}`} />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function PdfFirstUpload({
  universidades,
  carreras,
  materias,
  carreraMaterias,
  initialUniversidadId = '',
  initialCarreraId = '',
  initialMateriaId = '',
}: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const pickerRef = useRef<HTMLInputElement | null>(null);
  const redirectScheduledRef = useRef(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadConstraint, setUploadConstraint] = useState<StudentMaterialUploadConstraint | null>(null);
  const [processing, setProcessing] = useState<StudentMaterialProcessingState | null>(null);
  const [displayProgress, setDisplayProgress] = useState(0);
  const [contextDecision, setContextDecision] = useState<ContextDecision>('pending');
  const [savingContext, setSavingContext] = useState(false);
  const [contextMessage, setContextMessage] = useState<string | null>(null);

  const initialUniversityName =
    universidades.find((item) => item.id === initialUniversidadId)?.nombre ?? '';
  const initialCareerName = carreras.find((item) => item.id === initialCarreraId)?.nombre ?? '';
  const initialSubjectName = materias.find((item) => item.id === initialMateriaId)?.nombre ?? '';

  const [universidadNombre, setUniversidadNombre] = useState(initialUniversityName);
  const [carreraNombre, setCarreraNombre] = useState(initialCareerName);
  const [materiaNombre, setMateriaNombre] = useState(initialSubjectName);

  const selectedUniversity = useMemo(
    () => universidades.find((item) => normalizeName(item.nombre) === normalizeName(universidadNombre)),
    [universidadNombre, universidades]
  );

  const filteredCareers = useMemo(() => {
    if (!selectedUniversity) return carreras;
    return carreras.filter((item) => item.universidad_id === selectedUniversity.id);
  }, [carreras, selectedUniversity]);

  const selectedCareer = useMemo(
    () => filteredCareers.find((item) => normalizeName(item.nombre) === normalizeName(carreraNombre)),
    [carreraNombre, filteredCareers]
  );

  const filteredSubjects = useMemo(() => {
    if (!selectedCareer) return materias;
    const allowedIds = new Set(
      carreraMaterias
        .filter((relation) => relation.carrera_id === selectedCareer.id && relation.materia_id)
        .map((relation) => relation.materia_id as string)
    );
    return materias.filter(
      (item) => item.carrera_id === selectedCareer.id || allowedIds.has(item.id)
    );
  }, [carreraMaterias, materias, selectedCareer]);

  const selectedSubject = useMemo(
    () => filteredSubjects.find((item) => normalizeName(item.nombre) === normalizeName(materiaNombre)),
    [filteredSubjects, materiaNombre]
  );

  const openPicker = useCallback(() => pickerRef.current?.click(), []);

  const pickFile = useCallback(
    (file: File | null) => {
      if (!file) return;
      if (!file.name.toLowerCase().endsWith('.pdf') || (file.type && file.type !== 'application/pdf')) {
        toast({ description: 'Por ahora solo aceptamos archivos PDF.', variant: 'destructive' });
        return;
      }
      if (file.size > MAX_STUDENT_MATERIAL_FILE_SIZE_BYTES) {
        setUploadConstraint({
          kind: 'size',
          fileName: file.name,
          fileSizeBytes: file.size,
          maxSizeBytes: MAX_STUDENT_MATERIAL_FILE_SIZE_BYTES,
        });
        trackMarketingEvent('student_material_pdf_size_limit_exceeded', {
          file_size_bytes: file.size,
          max_size_bytes: MAX_STUDENT_MATERIAL_FILE_SIZE_BYTES,
          source: 'pdf_first',
        });
        return;
      }
      setUploadConstraint(null);
      setSelectedFile(file);
      setTitle(getTitleFromFileName(file.name));
    },
    [toast]
  );

  const resetFile = useCallback(() => {
    setUploadConstraint(null);
    setSelectedFile(null);
    setTitle('');
    window.requestAnimationFrame(() => pickerRef.current?.click());
  }, []);

  const startProcessing = async () => {
    if (!selectedFile || uploading) return;
    const materialTitle = title.trim() || getTitleFromFileName(selectedFile.name);
    setUploading(true);

    let preparedFilePath: string | null = null;
    try {
      const file = selectedFile;
      const fileMetadata = {
        name: file.name,
        mimeType: file.type || 'application/pdf',
        size: file.size,
      };
      const metadata = { title: materialTitle };
      const prepared = await preparePdfFirstUploadAction({ metadata, file: fileMetadata });
      if (!prepared.success || !prepared.filePath || !prepared.token) {
        toast({ description: prepared.message, variant: 'destructive' });
        return;
      }

      preparedFilePath = prepared.filePath;
      const supabase = getSupabaseBrowserClient();
      const { error: uploadError } = await supabase.storage
        .from('biblioteca')
        .uploadToSignedUrl(prepared.filePath, prepared.token, file, {
          contentType: fileMetadata.mimeType,
        });

      if (uploadError) {
        await cancelPdfFirstUploadAction(prepared.filePath);
        throw new Error('No pudimos transferir el PDF. Intentá nuevamente.');
      }

      const result = await finalizePdfFirstUploadAction({
        metadata,
        file: fileMetadata,
        filePath: prepared.filePath,
      });

      if (!result.success) {
        await cancelPdfFirstUploadAction(prepared.filePath);
        if (
          result.errorCode === 'page_limit' &&
          typeof result.pageCount === 'number' &&
          typeof result.maxPages === 'number'
        ) {
          setUploadConstraint({
            kind: 'pages',
            fileName: file.name,
            pageCount: result.pageCount,
            maxPages: result.maxPages,
          });
          trackMarketingEvent('student_material_pdf_page_limit_exceeded', {
            page_count: result.pageCount,
            max_pages: result.maxPages,
            file_size_bytes: file.size,
            plan: 'free',
            source: 'pdf_first',
          });
          return;
        }
        throw new Error(result.message);
      }

      if (!result.materialId) throw new Error('No pudimos iniciar el procesamiento del PDF.');

      setProcessing({
        materialId: result.materialId,
        title: materialTitle,
        fileName: file.name,
        status: 'uploaded',
        stage: 'uploaded',
        progress: 10,
        message: 'PDF subido. Empezamos a procesarlo.',
        error: null,
      });
      setDisplayProgress(10);
      trackMarketingEvent('student_material_pdf_upload_completed', {
        material_id: result.materialId,
        source: 'pdf_first',
      });
      void processStudentMaterialAction(result.materialId);
    } catch (error) {
      if (preparedFilePath) {
        await cancelPdfFirstUploadAction(preparedFilePath).catch(() => undefined);
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
    if (!processing) return;
    const interval = window.setInterval(async () => {
      const state = await getStudentMaterialProcessingStateAction(processing.materialId);
      if (!state) return;
      setProcessing(state);
      setDisplayProgress((current) => Math.max(current, state.progress));
    }, 1400);
    return () => window.clearInterval(interval);
  }, [processing?.materialId]);

  useEffect(() => {
    if (!processing || processing.status === 'failed' || processing.status === 'ready') return;
    const interval = window.setInterval(() => {
      setDisplayProgress((current) => Math.min(Math.max(current, processing.progress) + 1, 94));
    }, 650);
    return () => window.clearInterval(interval);
  }, [processing]);

  useEffect(() => {
    if (
      !processing ||
      processing.status !== 'ready' ||
      contextDecision === 'pending' ||
      redirectScheduledRef.current
    ) {
      return;
    }

    redirectScheduledRef.current = true;
    setDisplayProgress(100);
    const timeout = window.setTimeout(() => {
      router.push(getStudentMaterialRoute(processing.materialId));
      router.refresh();
    }, 450);
    return () => window.clearTimeout(timeout);
  }, [contextDecision, processing, router]);

  const saveAcademicContext = async () => {
    if (!processing || savingContext) return;
    setSavingContext(true);
    setContextMessage(null);

    const result = await savePdfFirstAcademicContextAction({
      materialId: processing.materialId,
      universidadId: selectedUniversity?.id ?? null,
      universidadNombre: universidadNombre || null,
      carreraId: selectedCareer?.id ?? null,
      carreraNombre: carreraNombre || null,
      materiaId: selectedSubject?.id ?? null,
      materiaNombre: materiaNombre || null,
    });

    if (!result.success) {
      setContextMessage(result.message);
      setSavingContext(false);
      return;
    }

    setUniversidadNombre(result.context.universidadNombre ?? universidadNombre);
    setCarreraNombre(result.context.carreraNombre ?? carreraNombre);
    setMateriaNombre(result.context.materiaNombre ?? materiaNombre);
    setContextDecision('saved');
    setContextMessage('Listo. Guardamos dónde estudiás sin frenar el procesamiento.');
    trackMarketingEvent('student_material_academic_context_saved', {
      material_id: processing.materialId,
      has_university: Boolean(result.context.universidadId),
      has_career: Boolean(result.context.carreraId),
      has_subject: Boolean(result.context.materiaId),
      source: 'pdf_first_processing',
    });
    setSavingContext(false);
  };

  const skipAcademicContext = () => {
    if (!processing) return;
    setContextDecision('skipped');
    setContextMessage(null);
    trackMarketingEvent('student_material_academic_context_skipped', {
      material_id: processing.materialId,
      source: 'pdf_first_processing',
    });
  };

  if (uploadConstraint) {
    return (
      <div className="mx-auto w-full max-w-3xl py-6 sm:py-10">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <StudentMaterialUploadErrorScreen
            constraint={uploadConstraint}
            onRetry={resetFile}
            premiumHref="/pricing"
          />
        </div>
      </div>
    );
  }

  if (processing) {
    const ready = processing.status === 'ready';
    const failed = processing.status === 'failed';
    const progress = ready ? 100 : Math.min(96, Math.max(displayProgress, processing.progress));
    const activeStep = contextDecision === 'pending' ? 1 : ready ? 2 : 1;

    return (
      <div className="mx-auto w-full max-w-6xl py-3 sm:py-8">
        <div className="mx-auto max-w-3xl">
          <FlowSteps activeStep={activeStep} />
        </div>

        <div className="mt-7 grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_24px_80px_rgba(15,23,42,0.14)] sm:p-8">
            <div className="flex items-start justify-between gap-5">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-indigo-200 uppercase">
                  {failed ? <FileText className="h-4 w-4" /> : ready ? <CheckCircle2 className="h-4 w-4" /> : <Loader2 className="h-4 w-4 animate-spin" />}
                  {failed ? 'Procesamiento interrumpido' : ready ? 'PDF listo' : 'Procesando ahora'}
                </div>
                <h1 className="mt-4 max-w-md text-3xl font-bold tracking-[-0.055em] sm:text-4xl">
                  {failed
                    ? 'No pudimos terminar este PDF'
                    : ready
                      ? 'Tu material ya está listo'
                      : 'Estamos procesando tu PDF'}
                </h1>
                <p className="mt-3 truncate text-sm text-slate-300">{processing.title}</p>
              </div>
              <span className="text-4xl font-bold tracking-[-0.06em] text-white sm:text-5xl">{progress}%</span>
            </div>

            <div className="mt-8 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-white transition-[width] duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              {failed
                ? processing.error ?? 'No recibimos más detalle del error.'
                : ready && contextDecision === 'pending'
                  ? 'Terminamos el PDF. Podés guardar el contexto académico o saltarlo para entrar.'
                  : processing.message}
            </p>

            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.06] p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                  <Lock className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold">Este material es privado</p>
                  <p className="mt-0.5 text-xs leading-5 text-slate-400">Solo vos podés verlo mientras lo preparás.</p>
                </div>
              </div>
            </div>

            {failed ? (
              <Button asChild variant="secondary" className="mt-6 w-full">
                <Link href="/dashboard/materiales">Volver a mis materiales</Link>
              </Button>
            ) : null}
          </section>

          {!failed && contextDecision === 'pending' ? (
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.07)] sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                    <GraduationCap className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-bold tracking-[-0.04em] text-slate-950">¿Dónde estudiás?</h2>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold tracking-[0.12em] text-slate-500 uppercase">Opcional</span>
                    </div>
                    <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">
                      Completalo mientras trabajamos. No frena el PDF y, si una opción no existe, la creamos como privada para vos.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-7 grid gap-5">
                <div>
                  <label htmlFor="pdf-first-universidad" className="mb-2 block text-xs font-bold text-slate-700">Universidad</label>
                  <Input
                    id="pdf-first-universidad"
                    list="pdf-first-universidades"
                    value={universidadNombre}
                    onChange={(event) => {
                      setUniversidadNombre(event.target.value);
                      setCarreraNombre('');
                      setMateriaNombre('');
                    }}
                    placeholder="Ej. Universidad de Buenos Aires"
                    autoComplete="off"
                    className="h-12 rounded-xl"
                  />
                  <datalist id="pdf-first-universidades">
                    {universidades.map((item) => <option key={item.id} value={item.nombre} />)}
                  </datalist>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="pdf-first-carrera" className="mb-2 block text-xs font-bold text-slate-700">Carrera</label>
                    <Input
                      id="pdf-first-carrera"
                      list="pdf-first-carreras"
                      value={carreraNombre}
                      onChange={(event) => {
                        setCarreraNombre(event.target.value);
                        setMateriaNombre('');
                      }}
                      placeholder="Ej. Medicina"
                      autoComplete="off"
                      disabled={!universidadNombre.trim()}
                      className="h-12 rounded-xl"
                    />
                    <datalist id="pdf-first-carreras">
                      {filteredCareers.map((item) => <option key={item.id} value={item.nombre} />)}
                    </datalist>
                  </div>

                  <div>
                    <label htmlFor="pdf-first-materia" className="mb-2 block text-xs font-bold text-slate-700">Materia</label>
                    <Input
                      id="pdf-first-materia"
                      list="pdf-first-materias"
                      value={materiaNombre}
                      onChange={(event) => setMateriaNombre(event.target.value)}
                      placeholder="Ej. Biología celular"
                      autoComplete="off"
                      disabled={!carreraNombre.trim()}
                      className="h-12 rounded-xl"
                    />
                    <datalist id="pdf-first-materias">
                      {filteredSubjects.map((item) => <option key={item.id} value={item.nombre} />)}
                    </datalist>
                  </div>
                </div>
              </div>

              {contextMessage ? (
                <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{contextMessage}</p>
              ) : null}

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={skipAcademicContext}
                  disabled={savingContext}
                  className="text-sm font-semibold text-slate-500 transition hover:text-slate-900 disabled:opacity-50"
                >
                  Saltar por ahora
                </button>
                <Button
                  type="button"
                  size="lg"
                  onClick={saveAcademicContext}
                  disabled={savingContext || !universidadNombre.trim()}
                  className="min-w-44 rounded-xl"
                >
                  {savingContext ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Guardar datos
                  {!savingContext ? <ArrowRight className="h-4 w-4" /> : null}
                </Button>
              </div>
            </section>
          ) : !failed ? (
            <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_24px_80px_rgba(15,23,42,0.07)] sm:p-8">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <CheckCircle2 className="h-6 w-6" />
              </span>
              <h2 className="mt-5 text-2xl font-bold tracking-[-0.045em] text-slate-950">
                {contextDecision === 'saved' ? 'Contexto guardado' : 'Perfecto, seguimos sin esos datos'}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                {ready
                  ? 'Tu material está listo. Estamos abriendo tu espacio de estudio…'
                  : 'No tenés que hacer nada más. El PDF sigue procesándose y entraremos apenas termine.'}
              </p>
              {!ready ? (
                <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-indigo-700">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Seguimos trabajando en tu PDF
                </div>
              ) : null}
            </section>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl py-3 sm:py-8">
      <input
        ref={pickerRef}
        type="file"
        accept=".pdf,application/pdf"
        className="sr-only"
        onChange={(event) => {
          pickFile(event.currentTarget.files?.[0] ?? null);
          event.currentTarget.value = '';
        }}
      />

      <div className="mx-auto max-w-3xl">
        <FlowSteps activeStep={0} />
      </div>

      <section className="mt-7 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.08)]">
        <div className="grid lg:grid-cols-[0.82fr_1.18fr]">
          <div className="bg-slate-950 p-7 text-white sm:p-9 lg:p-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[11px] font-bold tracking-[0.12em] text-indigo-200 uppercase">
              <Lock className="h-3.5 w-3.5" />
              Privado por defecto
            </div>

            <h1 className="mt-7 max-w-md text-[2.6rem] leading-[0.98] font-bold tracking-[-0.065em] sm:text-[3.2rem]">
              Tu PDF primero. Los datos después.
            </h1>
            <p className="mt-5 max-w-md text-sm leading-7 text-slate-300 sm:text-base">
              Subí el material y empezamos a procesarlo enseguida. Universidad, carrera y materia son opcionales y se completan mientras trabajamos.
            </p>

            <div className="mt-9 space-y-4 border-t border-white/10 pt-7">
              <div className="flex gap-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold">1</span>
                <div>
                  <p className="text-sm font-semibold">Elegís un PDF</p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">El nombre se completa solo y podés cambiarlo.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold">2</span>
                <div>
                  <p className="text-sm font-semibold">Procesamos inmediatamente</p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">No esperamos datos académicos para arrancar.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold">3</span>
                <div>
                  <p className="text-sm font-semibold">Entrás a estudiar</p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">Guardás contexto o lo saltás. El PDF sigue avanzando igual.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-9 lg:p-10">
            <div>
              <p className="text-xs font-bold tracking-[0.14em] text-indigo-700 uppercase">Paso 1</p>
              <h2 className="mt-2 text-2xl font-bold tracking-[-0.045em] text-slate-950 sm:text-3xl">Subí tu material</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">Solo necesitamos el PDF para empezar.</p>
            </div>

            {!selectedFile ? (
              <button
                type="button"
                onClick={openPicker}
                className="group mt-7 flex min-h-64 w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/70 px-6 py-10 text-center transition hover:border-indigo-300 hover:bg-indigo-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200 transition group-hover:-translate-y-0.5">
                  <Upload className="h-6 w-6" />
                </span>
                <span className="mt-5 text-base font-bold text-slate-950">Elegir un PDF</span>
                <span className="mt-2 max-w-sm text-sm leading-6 text-slate-500">Hacé click para buscar el archivo en tu dispositivo.</span>
                <span className="mt-4 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-500 ring-1 ring-slate-200">PDF · hasta 20 MB</span>
              </button>
            ) : (
              <div className="mt-7">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                  <div className="flex items-center gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200">
                      <FileText className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-950">{selectedFile.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB · listo para subir</p>
                    </div>
                    <button type="button" onClick={openPicker} className="shrink-0 text-xs font-bold text-indigo-700 hover:text-indigo-900">Cambiar</button>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex items-center justify-between gap-3">
                    <label htmlFor="pdf-first-title" className="text-xs font-bold text-slate-700">Nombre del material</label>
                    <span className="text-[11px] font-medium text-slate-400">Opcional</span>
                  </div>
                  <Input
                    id="pdf-first-title"
                    value={title}
                    maxLength={180}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder={getTitleFromFileName(selectedFile.name)}
                    className="mt-2 h-12 rounded-xl"
                  />
                  <p className="mt-2 text-xs leading-5 text-slate-500">Si lo dejás como está, usamos el nombre del archivo.</p>
                </div>

                <Button
                  type="button"
                  size="lg"
                  className="mt-7 h-12 w-full rounded-xl text-sm font-bold"
                  onClick={startProcessing}
                  disabled={uploading}
                >
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {uploading ? 'Subiendo PDF…' : 'Subir y empezar a procesar'}
                  {!uploading ? <ArrowRight className="h-4 w-4" /> : null}
                </Button>
              </div>
            )}

            <div className="mt-7 flex items-start gap-2 border-t border-slate-100 pt-5 text-xs leading-5 text-slate-400">
              <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <p>
                El PDF queda privado por defecto. Al subirlo aceptás los{' '}
                <Link href="/terminos" className="font-semibold text-slate-500 underline underline-offset-2">Términos y Condiciones</Link>.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
