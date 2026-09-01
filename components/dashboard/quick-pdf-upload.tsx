'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ImageIcon, Loader2, Upload } from 'lucide-react';
import {
  cancelStudentMaterialUploadAction,
  finalizeStudentMaterialUploadAction,
  prepareStudentMaterialUploadAction,
} from '@/app/dashboard/materiales/upload-actions';
import {
  getStudentMaterialProcessingStateAction,
  processStudentMaterialAction,
} from '@/app/dashboard/materiales/actions';
import { updateStudentMaterialVisualAnalysisAction } from '@/app/dashboard/materiales/visual-analysis-actions';
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
  const [editingContext, setEditingContext] = useState(!initialContextComplete);
  const [universidadId, setUniversidadId] = useState(initialUniversidadId);
  const [carreraId, setCarreraId] = useState(initialCarreraId);
  const [materiaId, setMateriaId] = useState(initialMateriaId);
  const [shareWithCatalog, setShareWithCatalog] = useState(true);
  const [analyzeVisuals, setAnalyzeVisuals] = useState(false);
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

      const visualPreference = await updateStudentMaterialVisualAnalysisAction({
        materialId: result.materialId,
        enabled: analyzeVisuals,
      });

      if (!visualPreference.success) {
        setErrorMessage(visualPreference.message);
        setUploading(false);
        return;
      }

      setProcessingMaterialId(result.materialId);
      setProcessingProgress(10);
      setProcessingMessage(
        analyzeVisuals
          ? 'PDF subido. Usaremos visión solo en las páginas que realmente lo necesiten.'
          : 'PDF subido. Estamos preparando tu espacio de estudio con extracción estándar.'
      );
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
    const progress = Math.max(10, Math.min(processingProgress, 100));

    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
            <Loader2 className="h-5 w-5 animate-spin" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold tracking-[-0.035em] text-slate-950">
              Preparando tu PDF
            </h1>
            <p className="mt-1 text-sm leading-6 text-slate-600">{processingMessage}</p>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-slate-500">{progress}%</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white">
      <div className="px-5 pt-5 sm:px-6 sm:pt-6">
        <h1 className="text-2xl font-bold tracking-[-0.045em] text-slate-950 sm:text-[1.7rem]">
          Subí tu PDF
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
          Lo convertimos en resumen, glosario, flashcards y ejercicios para estudiar.
        </p>
      </div>

      <div className="space-y-5 px-5 pb-5 pt-5 sm:px-6 sm:pb-6">
        <div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex min-h-28 w-full items-center gap-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-5 text-left transition hover:border-indigo-300 hover:bg-indigo-50/40"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200">
              {selectedFile ? <CheckCircle2 className="h-5 w-5" /> : <Upload className="h-5 w-5" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-slate-950">
                {selectedFile ? selectedFile.name : 'Elegir un PDF'}
              </span>
              <span className="mt-1 block text-xs text-slate-500">
                {selectedFile
                  ? `${formatBytes(selectedFile.size)} · tocar para cambiar`
                  : 'Hasta 20 MB'}
              </span>
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="sr-only"
            onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
          />
        </div>

        {initialContextComplete && !editingContext ? (
          <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Materia</p>
              <p className="mt-0.5 truncate text-sm font-bold text-slate-950">
                {materiaById.get(materiaId)}
              </p>
              <p className="mt-0.5 truncate text-xs text-slate-500">
                {careerById.get(carreraId)} · {universityById.get(universidadId)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEditingContext(true)}
              className="shrink-0 text-xs font-semibold text-indigo-700 hover:text-indigo-800"
            >
              Cambiar
            </button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
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

            {initialContextComplete ? (
              <button
                type="button"
                onClick={() => {
                  setUniversidadId(initialUniversidadId);
                  setCarreraId(initialCarreraId);
                  setMateriaId(initialMateriaId);
                  setEditingContext(false);
                }}
                className="text-left text-xs font-semibold text-slate-500 hover:text-slate-800 sm:col-span-3"
              >
                Usar la materia anterior
              </button>
            ) : null}
          </div>
        )}

        <label className="flex cursor-pointer items-start gap-3 border-t border-slate-100 pt-4 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={analyzeVisuals}
            onChange={(event) => setAnalyzeVisuals(event.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600"
          />
          <span className="flex min-w-0 gap-2">
            <ImageIcon className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
            <span>
              <span className="block font-semibold text-slate-800">Analizar imágenes, gráficos y diagramas</span>
              <span className="mt-0.5 block text-xs leading-5 text-slate-500">
                Opcional. La IA visual se usa solo en páginas candidatas para mantener bajo el costo.
              </span>
            </span>
          </span>
        </label>

        <label className="flex cursor-pointer items-center gap-3 border-t border-slate-100 pt-4 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={shareWithCatalog}
            onChange={(event) => setShareWithCatalog(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600"
          />
          <span>Compartir con estudiantes de esta materia</span>
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
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? 'Subiendo PDF...' : 'Preparar PDF'}
        </button>
      </div>
    </section>
  );
}
