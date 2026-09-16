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
      <div className="mx-auto w-full max-w-2xl border-y border-slate-200 bg-white">
        <StudentMaterialUploadErrorScreen
          constraint={uploadConstraint}
          onRetry={resetFile}
          premiumHref="/pricing"
        />
      </div>
    );
  }

  if (processing) {
    const ready = processing.status === 'ready';
    const failed = processing.status === 'failed';
    const progress = ready ? 100 : Math.min(96, Math.max(displayProgress, processing.progress));

    return (
      <div className="mx-auto w-full max-w-3xl py-4 sm:py-8">
        <section className="border-y border-slate-200 bg-white py-6 sm:py-8">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
              {failed ? <FileText className="h-5 w-5" /> : ready ? <CheckCircle2 className="h-5 w-5" /> : <Loader2 className="h-5 w-5 animate-spin" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold tracking-[0.16em] text-indigo-700 uppercase">
                {failed ? 'Procesamiento interrumpido' : ready ? 'PDF listo' : 'Procesando'}
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-[-0.05em] text-slate-950 sm:text-3xl">
                {failed ? 'No pudimos terminar tu PDF' : ready ? 'Tu PDF ya está listo' : 'Estamos procesando tu PDF'}
              </h1>
              <p className="mt-2 truncate text-sm text-slate-500">{processing.title}</p>
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>{failed ? 'Necesita revisión' : processing.message}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-indigo-600 transition-[width] duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {failed ? (
            <div className="mt-6 border-t border-slate-200 pt-5">
              <p className="text-sm text-red-700">{processing.error ?? 'No recibimos más detalle del error.'}</p>
              <Button asChild variant="outline" className="mt-4">
                <Link href="/dashboard/materiales">Volver a mis materiales</Link>
              </Button>
            </div>
          ) : contextDecision === 'pending' ? (
            <div className="mt-8 border-t border-slate-200 pt-6">
              <div className="flex items-start gap-3">
                <GraduationCap className="mt-0.5 h-5 w-5 shrink-0 text-indigo-700" />
                <div>
                  <h2 className="text-lg font-bold tracking-[-0.035em] text-slate-950">
                    Mientras procesamos, ¿dónde estudiás?
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Es opcional. Nos ayuda a entender mejor a quién usa Evaluo. Si algo no aparece, escribilo y lo creamos para vos.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4">
                <div>
                  <label htmlFor="pdf-first-universidad" className="mb-1.5 block text-xs font-semibold text-slate-700">Universidad</label>
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
                  />
                  <datalist id="pdf-first-universidades">
                    {universidades.map((item) => <option key={item.id} value={item.nombre} />)}
                  </datalist>
                </div>

                <div>
                  <label htmlFor="pdf-first-carrera" className="mb-1.5 block text-xs font-semibold text-slate-700">Carrera</label>
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
                  />
                  <datalist id="pdf-first-carreras">
                    {filteredCareers.map((item) => <option key={item.id} value={item.nombre} />)}
                  </datalist>
                </div>

                <div>
                  <label htmlFor="pdf-first-materia" className="mb-1.5 block text-xs font-semibold text-slate-700">Materia</label>
                  <Input
                    id="pdf-first-materia"
                    list="pdf-first-materias"
                    value={materiaNombre}
                    onChange={(event) => setMateriaNombre(event.target.value)}
                    placeholder="Ej. Biología celular"
                    autoComplete="off"
                    disabled={!carreraNombre.trim()}
                  />
                  <datalist id="pdf-first-materias">
                    {filteredSubjects.map((item) => <option key={item.id} value={item.nombre} />)}
                  </datalist>
                </div>
              </div>

              {contextMessage ? <p className="mt-3 text-sm text-red-600">{contextMessage}</p> : null}

              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="ghost" onClick={skipAcademicContext} disabled={savingContext}>
                  Saltar por ahora
                </Button>
                <Button
                  type="button"
                  onClick={saveAcademicContext}
                  disabled={savingContext || !universidadNombre.trim()}
                >
                  {savingContext ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Guardar y continuar
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-7 flex items-start gap-3 border-t border-slate-200 pt-5">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">
                  {contextDecision === 'saved' ? 'Datos académicos guardados' : 'Podés completar estos datos más adelante'}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {ready ? 'Abriendo tu espacio de estudio…' : 'Seguimos procesando el PDF. No tenés que hacer nada más.'}
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl py-4 sm:py-8">
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

      <section className="border-y border-slate-200 bg-white py-7 sm:py-10">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-indigo-700">
            <Lock className="h-4 w-4" />
            <span className="text-[11px] font-bold tracking-[0.16em] uppercase">Tu material es privado</span>
          </div>
          <h1 className="mt-3 text-[2rem] leading-[1.02] font-bold tracking-[-0.06em] text-slate-950 sm:text-[2.8rem]">
            Subí el PDF que querés estudiar.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
            Evaluo procesa ese mismo documento y prepara tu espacio de estudio. Universidad, carrera y materia no son necesarias para empezar.
          </p>
        </div>

        <div className="mt-8">
          {!selectedFile ? (
            <button
              type="button"
              onClick={openPicker}
              className="flex min-h-56 w-full flex-col items-center justify-center border border-dashed border-slate-300 bg-slate-50/40 px-6 py-10 text-center transition hover:border-indigo-300 hover:bg-indigo-50/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                <Upload className="h-5 w-5" />
              </span>
              <span className="mt-4 text-base font-bold text-slate-950">Elegir PDF</span>
              <span className="mt-1 text-sm text-slate-500">Free: hasta 100 páginas · Premium: sin límite de páginas · 20 MB máximo</span>
            </button>
          ) : (
            <div className="border border-slate-200 bg-white p-5 sm:p-6">
              <div className="flex items-start gap-3 border-b border-slate-200 pb-5">
                <FileText className="mt-0.5 h-5 w-5 shrink-0 text-indigo-700" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-950">{selectedFile.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button type="button" onClick={openPicker} className="text-xs font-semibold text-indigo-700 hover:text-indigo-900">Cambiar</button>
              </div>

              <div className="mt-5">
                <label htmlFor="pdf-first-title" className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Nombre del material <span className="font-normal text-slate-400">(opcional)</span>
                </label>
                <Input
                  id="pdf-first-title"
                  value={title}
                  maxLength={180}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder={getTitleFromFileName(selectedFile.name)}
                />
                <p className="mt-1.5 text-xs text-slate-500">Si no lo cambiás, usamos el nombre del archivo.</p>
              </div>

              <Button type="button" className="mt-6 w-full sm:w-auto" onClick={startProcessing} disabled={uploading}>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploading ? 'Subiendo PDF…' : 'Procesar PDF'}
                {!uploading ? <ArrowRight className="h-4 w-4" /> : null}
              </Button>
            </div>
          )}
        </div>

        <p className="mt-5 text-xs leading-5 text-slate-400">
          Al subir el archivo aceptás los <Link href="/terminos" className="underline underline-offset-2">Términos y Condiciones</Link>. El PDF queda privado por defecto.
        </p>
      </section>
    </div>
  );
}
