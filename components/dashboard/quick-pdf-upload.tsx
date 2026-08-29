'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, FileText, Loader2, Upload } from 'lucide-react';
import {
  cancelStudentMaterialUploadAction,
  finalizeStudentMaterialUploadAction,
  prepareStudentMaterialUploadAction,
} from '@/app/dashboard/materiales/upload-actions';
import {
  getStudentMaterialProcessingStateAction,
  processStudentMaterialAction,
} from '@/app/dashboard/materiales/actions';
import { getStudentMaterialRoute } from '@/lib/routes';
import { getSupabaseBrowserClient } from '@/lib/supabase-client';
import { MAX_STUDENT_MATERIAL_FILE_SIZE_BYTES } from '@/lib/student-materials/validation';

type UniversidadOption = {
  id: string;
  nombre: string;
};

type CarreraOption = {
  id: string;
  nombre: string;
  universidad_id: string | null;
};

type MateriaOption = {
  id: string;
  nombre: string;
  carrera_id?: string | null;
};

type CarreraMateriaRelation = {
  carrera_id: string | null;
  materia_id: string | null;
};

type QuickPdfUploadProps = {
  universidades: UniversidadOption[];
  carreras: CarreraOption[];
  materias: MateriaOption[];
  carreraMaterias: CarreraMateriaRelation[];
  initialUniversidadId?: string;
  initialCarreraId?: string;
  initialMateriaId?: string;
};

function fileTitle(fileName: string) {
  const value = fileName.replace(/\.pdf$/i, '').replace(/[_-]+/g, ' ').trim();
  return value || 'Mi material de estudio';
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function QuickPdfUpload({
  universidades,
  carreras,
  materias,
  carreraMaterias,
  initialUniversidadId = '',
  initialCarreraId = '',
  initialMateriaId = '',
}: QuickPdfUploadProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const initialContextComplete = Boolean(
    initialUniversidadId && initialCarreraId && initialMateriaId
  );

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [useAnotherContext, setUseAnotherContext] = useState(!initialContextComplete);
  const [universidadId, setUniversidadId] = useState(initialUniversidadId);
  const [carreraId, setCarreraId] = useState(initialCarreraId);
  const [materiaId, setMateriaId] = useState(initialMateriaId);
  const [shareWithCatalog, setShareWithCatalog] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [processingMaterialId, setProcessingMaterialId] = useState<string | null>(null);
  const [processingMessage, setProcessingMessage] = useState('Preparando tu material...');
  const [processingProgress, setProcessingProgress] = useState(0);

  const universityById = useMemo(
    () => new Map(universidades.map((item) => [item.id, item.nombre])),
    [universidades]
  );
  const careerById = useMemo(
    () => new Map(carreras.map((item) => [item.id, item.nombre])),
    [carreras]
  );
  const materiaById = useMemo(
    () => new Map(materias.map((item) => [item.id, item.nombre])),
    [materias]
  );

  const filteredCarreras = useMemo(
    () => carreras.filter((item) => !universidadId || item.universidad_id === universidadId),
    [carreras, universidadId]
  );

  const filteredMaterias = useMemo(() => {
    if (!carreraId) return [];

    const allowedIds = new Set(
      carreraMaterias
        .filter((relation) => relation.carrera_id === carreraId && relation.materia_id)
        .map((relation) => relation.materia_id as string)
    );

    return materias.filter(
      (item) => item.carrera_id === carreraId || allowedIds.has(item.id)
    );
  }, [carreraId, carreraMaterias, materias]);

  useEffect(() => {
    if (!processingMaterialId) return undefined;

    const interval = window.setInterval(async () => {
      const state = await getStudentMaterialProcessingStateAction(processingMaterialId);
      if (!state) return;

      setProcessingMessage(state.message || 'Preparando tu material...');
      setProcessingProgress(state.progress ?? 0);

      if (state.status === 'ready') {
        window.clearInterval(interval);
        router.replace(getStudentMaterialRoute(processingMaterialId));
        router.refresh();
      } else if (state.status === 'failed') {
        window.clearInterval(interval);
        setErrorMessage(state.error || 'No pudimos terminar de preparar el PDF.');
        setProcessingMaterialId(null);
        setUploading(false);
      }
    }, 1800);

    return () => window.clearInterval(interval);
  }, [processingMaterialId, router]);

  const restoreInitialContext = () => {
    setUniversidadId(initialUniversidadId);
    setCarreraId(initialCarreraId);
    setMateriaId(initialMateriaId);
  };

  const handleAnotherContextChange = (checked: boolean) => {
    setUseAnotherContext(checked);
    setErrorMessage(null);
    if (!checked) restoreInitialContext();
  };

  const handleFile = (file: File | null) => {
    setErrorMessage(null);
    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (!file.name.toLowerCase().endsWith('.pdf') || (file.type && file.type !== 'application/pdf')) {
      setSelectedFile(null);
      setErrorMessage('Por ahora solo aceptamos archivos PDF.');
      return;
    }

    if (file.size > MAX_STUDENT_MATERIAL_FILE_SIZE_BYTES) {
      setSelectedFile(null);
      setErrorMessage('El PDF supera el límite de 20 MB. Elegí un archivo más liviano.');
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    setErrorMessage(null);

    if (!selectedFile) {
      setErrorMessage('Elegí un PDF para continuar.');
      return;
    }

    if (!universidadId || !carreraId || !materiaId) {
      setErrorMessage('Elegí universidad, carrera y materia para preparar el PDF.');
      return;
    }

    const title = fileTitle(selectedFile.name);
    const materiaNombre = materiaById.get(materiaId) ?? 'la materia';
    const metadata = {
      universidadId,
      carreraId,
      materiaId,
      title,
      description: `Material para ${materiaNombre}`.slice(0, 240),
      shareWithCatalog,
    };
    const fileMetadata = {
      name: selectedFile.name,
      mimeType: selectedFile.type || 'application/pdf',
      size: selectedFile.size,
    };

    setUploading(true);
    let preparedFilePath: string | null = null;

    try {
      const prepared = await prepareStudentMaterialUploadAction({ metadata, file: fileMetadata });
      if (!prepared.success || !prepared.filePath || !prepared.token) {
        setErrorMessage(prepared.message);
        setUploading(false);
        return;
      }

      preparedFilePath = prepared.filePath;
      const supabase = getSupabaseBrowserClient();
      const { error: uploadError } = await supabase.storage
        .from('biblioteca')
        .uploadToSignedUrl(prepared.filePath, prepared.token, selectedFile, {
          contentType: fileMetadata.mimeType,
        });

      if (uploadError) {
        await cancelStudentMaterialUploadAction(prepared.filePath);
        setErrorMessage('No pudimos transferir el PDF. Intentá nuevamente.');
        setUploading(false);
        return;
      }

      const result = await finalizeStudentMaterialUploadAction({
        metadata,
        file: fileMetadata,
        filePath: prepared.filePath,
      });

      if (!result.success || !result.materialId) {
        await cancelStudentMaterialUploadAction(prepared.filePath);
        setErrorMessage(result.message);
        setUploading(false);
        return;
      }

      setProcessingMaterialId(result.materialId);
      setProcessingProgress(10);
      setProcessingMessage('PDF subido. Estamos preparando tu espacio de estudio.');
      void processStudentMaterialAction(result.materialId);
    } catch (error) {
      if (preparedFilePath) {
        await cancelStudentMaterialUploadAction(preparedFilePath).catch(() => undefined);
      }
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'No pudimos completar la subida del PDF. Intentá nuevamente.'
      );
      setUploading(false);
    }
  };

  if (processingMaterialId) {
    return (
      <div className="rounded-3xl border border-indigo-100 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-8">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
            <Loader2 className="h-6 w-6 animate-spin" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold tracking-[0.14em] text-indigo-700 uppercase">
              Tu PDF ya está en Evaluo
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-[-0.04em] text-slate-950">
              Estamos preparando tu material
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">{processingMessage}</p>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                style={{ width: `${Math.max(10, Math.min(processingProgress, 100))}%` }}
              />
            </div>
            <p className="mt-2 text-xs font-semibold text-slate-500">
              {Math.max(10, Math.min(processingProgress, 100))}%
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <div className="border-b border-slate-100 px-5 py-6 sm:px-8 sm:py-8">
        <p className="text-xs font-bold tracking-[0.15em] text-indigo-700 uppercase">Paso 1</p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.05em] text-slate-950">
          Elegí el PDF que estás usando para estudiar
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          Evaluo va a usar ese apunte para preparar tu resumen, glosario, flashcards y ejercicios.
        </p>
      </div>

      <div className="space-y-7 px-5 py-6 sm:px-8 sm:py-8">
        <section>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex min-h-36 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/40 px-5 py-7 text-center transition hover:border-indigo-400 hover:bg-indigo-50"
          >
            {selectedFile ? (
              <>
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                <span className="mt-3 max-w-full truncate text-sm font-bold text-slate-900">
                  {selectedFile.name}
                </span>
                <span className="mt-1 text-xs text-slate-500">
                  {formatBytes(selectedFile.size)} · tocar para cambiar
                </span>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8 text-indigo-600" />
                <span className="mt-3 text-sm font-bold text-slate-900">Elegir PDF</span>
                <span className="mt-1 text-xs text-slate-500">PDF de hasta 20 MB</span>
              </>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="sr-only"
            onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
          />
        </section>

        <section className="border-t border-slate-200 pt-6">
          <div className="flex items-start gap-3">
            <FileText className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-950">¿Para qué materia es?</p>
              {initialContextComplete && !useAnotherContext ? (
                <div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3">
                  <p className="text-xs font-bold text-emerald-800">Ya lo completamos por vos</p>
                  <p className="mt-1 text-sm leading-6 text-slate-700">
                    {universityById.get(universidadId)} · {careerById.get(carreraId)} ·{' '}
                    <strong>{materiaById.get(materiaId)}</strong>
                  </p>
                </div>
              ) : null}

              {initialContextComplete ? (
                <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={useAnotherContext}
                    onChange={(event) => handleAnotherContextChange(event.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600"
                  />
                  <span>
                    <strong>Es para otra carrera o materia</strong>
                    <span className="mt-0.5 block text-xs leading-5 text-slate-500">
                      Marcá esta opción y elegí dónde querés guardar el PDF.
                    </span>
                  </span>
                </label>
              ) : null}

              {useAnotherContext ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <label className="text-xs font-semibold text-slate-600">
                    Universidad
                    <select
                      value={universidadId}
                      onChange={(event) => {
                        setUniversidadId(event.target.value);
                        setCarreraId('');
                        setMateriaId('');
                      }}
                      className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-indigo-400"
                    >
                      <option value="">Elegir</option>
                      {universidades.map((item) => (
                        <option key={item.id} value={item.id}>{item.nombre}</option>
                      ))}
                    </select>
                  </label>

                  <label className="text-xs font-semibold text-slate-600">
                    Carrera
                    <select
                      value={carreraId}
                      disabled={!universidadId}
                      onChange={(event) => {
                        setCarreraId(event.target.value);
                        setMateriaId('');
                      }}
                      className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none disabled:bg-slate-50 disabled:text-slate-400 focus:border-indigo-400"
                    >
                      <option value="">Elegir</option>
                      {filteredCarreras.map((item) => (
                        <option key={item.id} value={item.id}>{item.nombre}</option>
                      ))}
                    </select>
                  </label>

                  <label className="text-xs font-semibold text-slate-600">
                    Materia
                    <select
                      value={materiaId}
                      disabled={!carreraId}
                      onChange={(event) => setMateriaId(event.target.value)}
                      className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none disabled:bg-slate-50 disabled:text-slate-400 focus:border-indigo-400"
                    >
                      <option value="">Elegir</option>
                      {filteredMaterias.map((item) => (
                        <option key={item.id} value={item.id}>{item.nombre}</option>
                      ))}
                    </select>
                  </label>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <label className="flex cursor-pointer items-start gap-2.5 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={shareWithCatalog}
            onChange={(event) => setShareWithCatalog(event.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600"
          />
          <span>
            <strong>Compartir también con estudiantes de esta materia</strong>
            <span className="mt-0.5 block text-xs leading-5 text-slate-500">
              Podés desmarcarlo si querés usar el material sólo en tu espacio.
            </span>
          </span>
        </label>

        {errorMessage ? (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleUpload}
          disabled={uploading || !selectedFile}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? 'Subiendo PDF...' : 'Preparar mi PDF'}
        </button>
      </div>
    </div>
  );
}
