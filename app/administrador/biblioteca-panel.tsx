'use client';

import { type ReactNode, useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FileUp, Loader2, Plus, Trash2 } from 'lucide-react';
import {
  type BibliotecaCarreraOption,
  type BibliotecaCarreraSimuladorRow,
  type BibliotecaOverviewStats,
  type BibliotecaMateriaOption,
  type BibliotecaUniversidadOption,
} from './actions';
import {
  crearCarreraBibliotecaAdministrador,
  crearMateriaBibliotecaAdministrador,
  crearUniversidadBibliotecaAdministrador,
  eliminarCarreraBibliotecaAdministrador,
  eliminarMateriaBibliotecaAdministrador,
  eliminarUniversidadBibliotecaAdministrador,
  procesarCargaMaterialBibliotecaAdministrador,
} from './biblioteca-actions';
import { supabase } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { parseMateriasWorkbook } from './import-helpers';
import {
  importarMateriasDesdeExcelAdministrador,
  type MateriaImportResult,
} from './shared-actions';

type ResourceType = 'Preguntero' | 'Resumen' | 'Trabajo Práctico';
type PregunteroDestino = 'ambas' | 'solo_simulador' | 'solo_visualizacion';
type MaterialBatchItem = {
  id: string;
  files: File[];
  subTipo: string;
  resumenModules: string[];
  resumenParcial: string;
};

function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="mb-2 block text-[12px] font-medium text-[#7f8aa3]">{children}</label>;
}

function FileDrop({
  label,
  file,
  files,
  onChange,
  multiple = false,
}: {
  label: string;
  file: File | null;
  files?: File[];
  onChange: (file: File | null, files?: File[]) => void;
  multiple?: boolean;
}) {
  const hasMultiple = multiple && (files?.length ?? 0) > 0;
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <label className="flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-[16px] border border-dashed border-[#cfd8ea] bg-white px-5 py-6 text-center transition hover:border-[#2563EB] hover:bg-[#f6f9ff]">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#2563EB]">
          <FileUp className="h-5 w-5" />
        </div>
        <p className="text-[14px] font-medium text-[#1d2a44]">
          {hasMultiple ? `${files?.length ?? 0} archivos seleccionados` : file ? file.name : 'Seleccionar archivo'}
        </p>
        <p className="mt-1 text-[12px] text-[#7f8aa3]">
          {hasMultiple
            ? files?.map((item) => item.name).slice(0, 3).join(' · ')
            : file
              ? `${(file.size / 1024 / 1024).toFixed(2)} MB`
              : 'PDF, XLSX o XLS'}
        </p>
        <input
          type="file"
          className="hidden"
          accept=".pdf,.xlsx,.xls"
          multiple={multiple}
          onChange={(event) =>
            onChange(
              event.target.files?.[0] ?? null,
              event.target.files ? Array.from(event.target.files) : []
            )
          }
        />
      </label>
    </div>
  );
}

export function BibliotecaPanel({
  overview,
  universidades,
  carreras,
  materias,
  carrerasSimuladores,
}: {
  overview: BibliotecaOverviewStats;
  universidades: BibliotecaUniversidadOption[];
  carreras: BibliotecaCarreraOption[];
  materias: BibliotecaMateriaOption[];
  carrerasSimuladores: BibliotecaCarreraSimuladorRow[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [uploadingFile, setUploadingFile] = useState(false);
  const [structurePending, setStructurePending] = useState(false);
  const [universidadId, setUniversidadId] = useState('');
  const [carreraId, setCarreraId] = useState('');
  const [materiaId, setMateriaId] = useState('');
  const [materiaSearch, setMateriaSearch] = useState('');
  const [nuevaUniversidad, setNuevaUniversidad] = useState('');
  const [nuevaCarrera, setNuevaCarrera] = useState('');
  const [nuevaMateria, setNuevaMateria] = useState('');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [simuladorCarreraId, setSimuladorCarreraId] = useState('');
  const [simuladorCarreraSearch, setSimuladorCarreraSearch] = useState('');
  const [simuladorMateriaSearch, setSimuladorMateriaSearch] = useState('');
  const [simuladorMateriaFilter, setSimuladorMateriaFilter] = useState<'all' | 'without_questions'>('all');
  const [materiasImportFile, setMateriasImportFile] = useState<File | null>(null);
  const [materiasImportPreviewCount, setMateriasImportPreviewCount] = useState<number | null>(null);
  const [materiasImportResult, setMateriasImportResult] = useState<MateriaImportResult | null>(null);
  const [recursoType, setRecursoType] = useState<ResourceType>('Preguntero');
  const [subTipo, setSubTipo] = useState('');
  const [resumenModules, setResumenModules] = useState<string[]>([]);
  const [resumenParcial, setResumenParcial] = useState('');
  const [usarIAEnCarga, setUsarIAEnCarga] = useState(false);
  const [pregunteroDestino, setPregunteroDestino] = useState<PregunteroDestino>('ambas');
  const [eliminarArchivoTrasProcesar, setEliminarArchivoTrasProcesar] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [materialBatchQueue, setMaterialBatchQueue] = useState<MaterialBatchItem[]>([]);
  const [pregunteroFiles, setPregunteroFiles] = useState<{ parcial1: File | null; parcial2: File | null }>({
    parcial1: null,
    parcial2: null,
  });

  const filteredMaterias = useMemo(
    () =>
      materias.filter((materia) => {
        if (!universidadId || !materia.universidadIds.includes(universidadId)) {
          return false;
        }

        if (!materiaSearch.trim()) {
          return true;
        }

        return materia.nombre.toLowerCase().includes(materiaSearch.trim().toLowerCase());
      }),
    [materias, universidadId, materiaSearch]
  );

  const carrerasFiltradas = useMemo(
    () => carreras.filter((item) => !universidadId || item.universidadId === universidadId),
    [carreras, universidadId]
  );

  const materiasPorCarrera = useMemo(
    () =>
      materias.filter((materia) => {
        if (universidadId && !materia.universidadIds.includes(universidadId)) {
          return false;
        }

        if (!carreraId) {
          return false;
        }

        const matchesCarrera = materia.isGeneral || materia.carreraIds.includes(carreraId);
        if (!matchesCarrera) {
          return false;
        }

        if (!catalogSearch.trim()) {
          return true;
        }

        return materia.nombre.toLowerCase().includes(catalogSearch.trim().toLowerCase());
      }),
    [materias, universidadId, carreraId, catalogSearch]
  );

  const carrerasSimuladoresFiltradas = useMemo(() => {
    const term = simuladorCarreraSearch.trim().toLowerCase();
    if (!term) return carrerasSimuladores;
    return carrerasSimuladores.filter((carrera) => {
      const carreraMatch = carrera.carreraNombre.toLowerCase().includes(term);
      const universidadMatch = (carrera.universidadNombre ?? '').toLowerCase().includes(term);
      return carreraMatch || universidadMatch;
    });
  }, [carrerasSimuladores, simuladorCarreraSearch]);

  const carreraSimuladoresActiva =
    carrerasSimuladoresFiltradas.find((carrera) => carrera.carreraId === simuladorCarreraId) ??
    carrerasSimuladoresFiltradas[0] ??
    null;

  const materiasSimuladoresFiltradas = useMemo(() => {
    let materiasSource = carreraSimuladoresActiva?.materias ?? [];
    if (simuladorMateriaFilter === 'without_questions') {
      materiasSource = materiasSource.filter((materia) => materia.totalPreguntas === 0);
    }
    const term = simuladorMateriaSearch.trim().toLowerCase();
    if (!term) return materiasSource;
    return materiasSource.filter((materia) => materia.nombre.toLowerCase().includes(term));
  }, [carreraSimuladoresActiva, simuladorMateriaFilter, simuladorMateriaSearch]);

  const selectedMateria = filteredMaterias.find((materia) => materia.id === materiaId) ?? null;
  const isResumen = recursoType === 'Resumen';
  const isPreguntero = recursoType === 'Preguntero';
  const canAddBatch =
    Boolean(universidadId) &&
    Boolean(materiaId) &&
    selectedFiles.length > 0 &&
    (isResumen ? resumenModules.length > 0 || Boolean(resumenParcial) : Boolean(subTipo));
  const canSubmit =
    Boolean(universidadId) &&
    Boolean(materiaId) &&
    (isPreguntero
      ? Boolean(pregunteroFiles.parcial1) || Boolean(pregunteroFiles.parcial2)
      : materialBatchQueue.length > 0);

  useEffect(() => {
    if (universidadId && !universidades.some((item) => item.id === universidadId)) {
      setUniversidadId('');
      setCarreraId('');
      setMateriaId('');
    }
  }, [universidadId, universidades]);

  useEffect(() => {
    if (!universidadId || !carrerasFiltradas.some((item) => item.id === carreraId)) {
      setCarreraId('');
    }
  }, [carreraId, carrerasFiltradas, universidadId]);

  useEffect(() => {
    if (materiaId && !filteredMaterias.some((item) => item.id === materiaId)) {
      setMateriaId('');
    }
  }, [filteredMaterias, materiaId]);

  useEffect(() => {
    if (
      simuladorCarreraId &&
      !carrerasSimuladoresFiltradas.some((carrera) => carrera.carreraId === simuladorCarreraId)
    ) {
      setSimuladorCarreraId(carrerasSimuladoresFiltradas[0]?.carreraId ?? '');
    }
  }, [carrerasSimuladoresFiltradas, simuladorCarreraId]);

  useEffect(() => {
    if (pregunteroDestino !== 'solo_simulador' && eliminarArchivoTrasProcesar) {
      setEliminarArchivoTrasProcesar(false);
    }
  }, [eliminarArchivoTrasProcesar, pregunteroDestino]);

  const resetForm = () => {
    setUniversidadId('');
    setMateriaId('');
    setMateriaSearch('');
    setRecursoType('Preguntero');
    setSubTipo('');
    setResumenModules([]);
    setResumenParcial('');
    setUsarIAEnCarga(false);
    setPregunteroDestino('ambas');
    setEliminarArchivoTrasProcesar(false);
    setSelectedFile(null);
    setSelectedFiles([]);
    setMaterialBatchQueue([]);
    setPregunteroFiles({ parcial1: null, parcial2: null });
  };

  const uploadSingleFile = async ({
    file,
    finalSubTipo,
    finalResumenModules,
    finalResumenParcial,
  }: {
    file: File;
    finalSubTipo: string;
    finalResumenModules?: string[];
    finalResumenParcial?: string;
  }) => {
    if (!selectedMateria || !universidadId) {
      return { success: false, message: 'Completá universidad y materia antes de continuar.' };
    }

    const carreraId = selectedMateria.isGeneral
      ? null
      : selectedMateria.carreraIdByUniversidad[universidadId] ?? null;
    const safeName = file.name
      .trim()
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_+/g, '_');
    const filePath = `${carreraId || 'general'}/${selectedMateria.id}/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage.from('biblioteca').upload(filePath, file);
    if (uploadError) {
      return { success: false, message: uploadError.message };
    }

    return procesarCargaMaterialBibliotecaAdministrador({
      universidadId,
      materiaId: selectedMateria.id,
      carreraId,
      recursoType,
      pregunteroDestino,
      subTipo: finalSubTipo,
      resumenModules: finalResumenModules ?? [],
      resumenParcial: finalResumenParcial ?? '',
      filePath,
      fileName: file.name,
      usarIAEnCarga,
      eliminarArchivoTrasProcesar,
    });
  };

  const addMaterialBatch = () => {
    if (!selectedMateria || !universidadId) {
          toast({ description: 'Completá universidad y materia antes de continuar.', variant: 'destructive' });
      return;
    }

    if (!canAddBatch) {
      toast({
        description: isResumen
          ? 'Seleccioná archivos y clasificalos por módulos o parcial antes de agregarlos.'
          : 'Seleccioná archivos y el trabajo práctico antes de agregarlos.',
        variant: 'destructive',
      });
      return;
    }

    setMaterialBatchQueue((current) => [
      ...current,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        files: [...selectedFiles],
        subTipo,
        resumenModules: [...resumenModules],
        resumenParcial,
      },
    ]);
    setSelectedFile(null);
    setSelectedFiles([]);
    setSubTipo('');
    setResumenModules([]);
    setResumenParcial('');
  };

  const handleUpload = async () => {
    if (!selectedMateria || !universidadId) {
          toast({ description: 'Completá universidad y materia antes de continuar.', variant: 'destructive' });
      return;
    }

    if (!canSubmit) {
      toast({ description: 'Falta clasificar el material antes de subirlo.', variant: 'destructive' });
      return;
    }

    setUploadingFile(true);
    startTransition(async () => {
      try {
        if (isPreguntero) {
          const queue = [
            pregunteroFiles.parcial1 ? { file: pregunteroFiles.parcial1, finalSubTipo: 'Parcial 1' } : null,
            pregunteroFiles.parcial2 ? { file: pregunteroFiles.parcial2, finalSubTipo: 'Parcial 2' } : null,
          ].filter((item): item is { file: File; finalSubTipo: string } => Boolean(item));

          for (const item of queue) {
            const result = await uploadSingleFile(item);
            if (!result.success) {
              toast({ description: result.message, variant: 'destructive' });
              return;
            }
          }

          toast({ description: 'Pregunteros cargados correctamente.' });
          resetForm();
          return;
        }

        if (materialBatchQueue.length === 0) {
          toast({ description: 'Agregá al menos un lote de archivos antes de continuar.', variant: 'destructive' });
          return;
        }

        for (const batch of materialBatchQueue) {
          for (const file of batch.files) {
            const result = await uploadSingleFile({
              file,
              finalSubTipo: batch.subTipo,
              finalResumenModules: batch.resumenModules,
              finalResumenParcial: batch.resumenParcial,
            });

            if (!result.success) {
              toast({ description: result.message, variant: 'destructive' });
              return;
            }
          }
        }

        toast({ description: 'Materiales cargados correctamente.' });
        resetForm();
      } finally {
        setUploadingFile(false);
      }
    });
  };

  const handleStructureAction = async (runner: () => Promise<{ success: boolean; message: string }>) => {
    setStructurePending(true);

    try {
      const result = await runner();
      if (!result.success) {
        toast({ description: result.message, variant: 'destructive' });
        return;
      }

      toast({ description: result.message });
      router.refresh();
    } finally {
      setStructurePending(false);
    }
  };

  const handleMateriaImportFile = async (file: File | null) => {
    setMateriasImportFile(file);
    setMateriasImportPreviewCount(null);
    setMateriasImportResult(null);

    if (!file) {
      return;
    }

    try {
      const parsed = await parseMateriasWorkbook(file);
      setMateriasImportPreviewCount(parsed.length);
    } catch (error) {
      setMateriasImportFile(null);
      toast({
        description: error instanceof Error ? error.message : 'No pudimos leer el archivo.',
        variant: 'destructive',
      });
    }
  };

  const handleImportMaterias = async () => {
    if (!materiasImportFile || !universidadId) {
      toast({
        description: 'Seleccioná una universidad y un archivo Excel antes de importar.',
        variant: 'destructive',
      });
      return;
    }

    setStructurePending(true);
    setMateriasImportResult(null);

    try {
      const parsedEntries = await parseMateriasWorkbook(materiasImportFile);
      if (parsedEntries.length === 0) {
        toast({
          description: 'El archivo no trae materias válidas para importar.',
          variant: 'destructive',
        });
        return;
      }

      const result = await importarMateriasDesdeExcelAdministrador({
        universidadId,
        entries: parsedEntries,
      });

      setMateriasImportResult(result);

      if (!result.success) {
        toast({ description: result.message, variant: 'destructive' });
        return;
      }

      toast({ description: result.message });
      setMateriasImportFile(null);
      setMateriasImportPreviewCount(null);
      router.refresh();
    } finally {
      setStructurePending(false);
    }
  };

  return (
    <section className="space-y-5">
      <div>
        <p className="text-[1.35rem] font-semibold tracking-[-0.05em] text-[#1d2a44]">Biblioteca</p>
        <p className="mt-1 text-[14px] text-[#7f8aa3]">
          Carga de material para publicar recursos en la web siguiendo la lógica actual del admin.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
        <div className="rounded-[18px] border border-[#e7ebf4] bg-white px-5 py-5">
          <p className="text-[12px] font-medium text-[#7f8aa3]">Carreras</p>
          <p className="mt-2 text-[2rem] font-semibold leading-none tracking-[-0.05em] text-[#2148d8]">
            {overview.carrerasTotal.toLocaleString('es-AR')}
          </p>
        </div>
        <div className="rounded-[18px] border border-[#e7ebf4] bg-white px-5 py-5">
          <p className="text-[12px] font-medium text-[#7f8aa3]">Materias</p>
          <p className="mt-2 text-[2rem] font-semibold leading-none tracking-[-0.05em] text-[#10936f]">
            {overview.materiasTotal.toLocaleString('es-AR')}
          </p>
        </div>
        <div className="rounded-[18px] border border-[#e7ebf4] bg-white px-5 py-5">
          <p className="text-[12px] font-medium text-[#7f8aa3]">Preguntas totales</p>
          <p className="mt-2 text-[2rem] font-semibold leading-none tracking-[-0.05em] text-[#6f42ff]">
            {overview.preguntasTotal.toLocaleString('es-AR')}
          </p>
        </div>
      </div>

      <section className="rounded-[20px] border border-[#e7ebf4] bg-white p-5">
        <div className="mb-5">
          <p className="text-[14px] font-semibold text-[#1d2a44]">Simuladores por carrera</p>
          <p className="mt-1 text-[13px] text-[#7f8aa3]">
            Revisá carrera por carrera qu&eacute; materias ya tienen preguntas cargadas en parcial 1 y parcial 2.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
          <div className="rounded-[16px] border border-[#e7ebf4] bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[13px] font-semibold text-[#1d2a44]">Carreras</p>
              <span className="text-[12px] text-[#7f8aa3]">
                {carrerasSimuladoresFiltradas.length.toLocaleString('es-AR')}
              </span>
            </div>

            <input
              type="text"
              value={simuladorCarreraSearch}
              onChange={(event) => setSimuladorCarreraSearch(event.target.value)}
              placeholder="Buscar carrera..."
              className="mb-3 h-10 w-full rounded-[12px] border border-[#dbe2f0] bg-white px-3 text-[13px] text-[#1d2a44] outline-none"
            />

            <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
              {carrerasSimuladoresFiltradas.map((carrera) => {
                const isActive = carrera.carreraId === (carreraSimuladoresActiva?.carreraId ?? '');
                const materiasConSimulador = carrera.materias.filter((materia) => materia.totalPreguntas > 0).length;
                return (
                  <button
                    key={carrera.carreraId}
                    type="button"
                    onClick={() => {
                      setSimuladorCarreraId(carrera.carreraId);
                      setSimuladorMateriaSearch('');
                    }}
                    className={`w-full rounded-[12px] border px-3 py-3 text-left transition ${
                      isActive ? 'border-[#2563EB] bg-white' : 'border-[#e7ebf4] bg-white'
                    }`}
                  >
                    <p className={`text-[13px] font-semibold ${isActive ? 'text-[#2148d8]' : 'text-[#1d2a44]'}`}>
                      {carrera.carreraNombre}
                    </p>
                    <p className="mt-1 text-[12px] text-[#7f8aa3]">
                      {carrera.universidadNombre ?? 'Sin universidad'} · {materiasConSimulador}/
                      {carrera.materias.length} materias con simulador
                    </p>
                  </button>
                );
              })}

              {carrerasSimuladoresFiltradas.length === 0 ? (
                <p className="rounded-[12px] border border-dashed border-[#dbe2f0] px-3 py-4 text-[12px] text-[#7f8aa3]">
                  No encontramos carreras con ese filtro.
                </p>
              ) : null}
            </div>
          </div>

          <div className="rounded-[16px] border border-[#e7ebf4] bg-white p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[13px] font-semibold text-[#1d2a44]">
                  {carreraSimuladoresActiva?.carreraNombre ?? 'Seleccioná una carrera'}
                </p>
                <p className="mt-1 text-[12px] text-[#7f8aa3]">
                  {carreraSimuladoresActiva?.universidadNombre ?? 'Aqu&iacute; vas a ver las materias y sus preguntas por parcial.'}
                </p>
              </div>
              <span className="shrink-0 text-[12px] text-[#7f8aa3]">
                {(carreraSimuladoresActiva?.materias.length ?? 0).toLocaleString('es-AR')} materias
              </span>
            </div>

            <div className="mb-3 flex flex-col gap-2 md:flex-row">
              <input
                type="text"
                value={simuladorMateriaSearch}
                onChange={(event) => setSimuladorMateriaSearch(event.target.value)}
                disabled={!carreraSimuladoresActiva}
                placeholder={carreraSimuladoresActiva ? 'Buscar materia...' : 'Primero elige una carrera'}
                className="h-10 flex-1 rounded-[12px] border border-[#dbe2f0] bg-white px-3 text-[13px] text-[#1d2a44] outline-none disabled:bg-white disabled:text-[#9aa4ba]"
              />
              <select
                value={simuladorMateriaFilter}
                onChange={(event) =>
                  setSimuladorMateriaFilter(event.target.value as 'all' | 'without_questions')
                }
                disabled={!carreraSimuladoresActiva}
                className="h-10 rounded-[12px] border border-[#dbe2f0] bg-white px-3 text-[12px] text-[#1d2a44] outline-none disabled:bg-white disabled:text-[#9aa4ba] md:w-[180px]"
              >
                <option value="all">Todas</option>
                <option value="without_questions">Sin preguntas</option>
              </select>
            </div>

            <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
              {!carreraSimuladoresActiva ? (
                <p className="rounded-[12px] border border-dashed border-[#dbe2f0] px-3 py-4 text-[12px] text-[#7f8aa3]">
                  Elegí una carrera para ver sus materias.
                </p>
              ) : materiasSimuladoresFiltradas.length === 0 ? (
                <p className="rounded-[12px] border border-dashed border-[#dbe2f0] px-3 py-4 text-[12px] text-[#7f8aa3]">
                  No encontramos materias con ese filtro.
                </p>
              ) : (
                materiasSimuladoresFiltradas.map((materia) => {
                  const hasSimulator = materia.totalPreguntas > 0;
                  return (
                    <div
                      key={materia.id}
                      className="rounded-[12px] border border-[#e7ebf4] bg-white px-3 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-semibold text-[#1d2a44]">
                            {materia.nombre}
                          </p>
                          <p className="mt-1 text-[12px] text-[#7f8aa3]">
                            {hasSimulator
                              ? `${materia.totalPreguntas.toLocaleString('es-AR')} preguntas cargadas`
                              : 'Sin simulador cargado'}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[12px] font-medium ${
                            hasSimulator
                              ? 'bg-[#e9fbf4] text-[#10936f]'
                              : 'bg-white text-[#7f8aa3]'
                          }`}
                        >
                          {hasSimulator ? 'Con simulador' : 'Sin simulador'}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                        <div className="rounded-[10px] border border-[#eef2f8] bg-white px-3 py-2">
                          <p className="text-[12px] uppercase tracking-[0.14em] text-[#667085]">Parcial 1</p>
                          <p className="mt-1 text-[15px] font-semibold text-[#2148d8]">
                            {materia.parcial1Preguntas.toLocaleString('es-AR')} preguntas
                          </p>
                        </div>
                        <div className="rounded-[10px] border border-[#eef2f8] bg-white px-3 py-2">
                          <p className="text-[12px] uppercase tracking-[0.14em] text-[#667085]">Parcial 2</p>
                          <p className="mt-1 text-[15px] font-semibold text-[#6f42ff]">
                            {materia.parcial2Preguntas.toLocaleString('es-AR')} preguntas
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[20px] border border-[#e7ebf4] bg-white p-5">
        <div className="mb-5">
          <p className="text-[14px] font-semibold text-[#1d2a44]">Universidades, carreras y materias</p>
          <p className="mt-1 text-[13px] text-[#7f8aa3]">
            Gestiona la estructura acad&eacute;mica desde este mismo panel y elimina lo que ya no sirva.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="rounded-[16px] border border-[#e7ebf4] bg-white p-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[13px] font-semibold text-[#1d2a44]">Universidades</p>
              <span className="text-[12px] text-[#7f8aa3]">{universidades.length.toLocaleString('es-AR')}</span>
            </div>

            <div className="mb-4 flex gap-2">
              <input
                type="text"
                value={nuevaUniversidad}
                onChange={(event) => setNuevaUniversidad(event.target.value)}
                placeholder="Nueva universidad"
                className="h-10 flex-1 rounded-[12px] border border-[#dbe2f0] bg-white px-3 text-[13px] text-[#1d2a44] outline-none"
              />
              <Button
                type="button"
                size="icon"
                disabled={structurePending || !nuevaUniversidad.trim()}
                className="h-10 w-10 rounded-[12px] bg-[#2563EB] hover:bg-[#2649c7]"
                onClick={() =>
                  void handleStructureAction(async () => {
                    const result = await crearUniversidadBibliotecaAdministrador(nuevaUniversidad);
                    if (result.success) {
                      setNuevaUniversidad('');
                    }
                    return result;
                  })
                }
              >
                {structurePending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </Button>
            </div>

            <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
              {universidades.map((universidad) => {
                const isActive = universidad.id === universidadId;
                return (
                  <div
                    key={universidad.id}
                    className={`flex items-center justify-between rounded-[12px] border px-3 py-2.5 transition ${
                      isActive ? 'border-[#2563EB] bg-white' : 'border-[#e7ebf4] bg-white'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setUniversidadId(universidad.id);
                        setCarreraId('');
                        setCatalogSearch('');
                      }}
                      className={`flex-1 text-left text-[13px] font-medium ${
                        isActive ? 'text-[#2148d8]' : 'text-[#1d2a44]'
                      }`}
                    >
                      {universidad.nombre}
                    </button>
                    <button
                      type="button"
                      className="ml-3 text-[#9aa4ba] transition hover:text-[#dc2626]"
                      onClick={() =>
                        void handleStructureAction(() => eliminarUniversidadBibliotecaAdministrador(universidad.id))
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-[16px] border border-[#e7ebf4] bg-white p-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[13px] font-semibold text-[#1d2a44]">Carreras</p>
              <span className="text-[12px] text-[#7f8aa3]">{carrerasFiltradas.length.toLocaleString('es-AR')}</span>
            </div>

            <div className="mb-4 flex gap-2">
              <input
                type="text"
                value={nuevaCarrera}
                onChange={(event) => setNuevaCarrera(event.target.value)}
                placeholder={universidadId ? 'Nueva carrera' : 'Primero elige universidad'}
                disabled={!universidadId}
                className="h-10 flex-1 rounded-[12px] border border-[#dbe2f0] bg-white px-3 text-[13px] text-[#1d2a44] outline-none disabled:bg-white disabled:text-[#9aa4ba]"
              />
              <Button
                type="button"
                size="icon"
                disabled={structurePending || !universidadId || !nuevaCarrera.trim()}
                className="h-10 w-10 rounded-[12px] bg-[#2563EB] hover:bg-[#2649c7]"
                onClick={() =>
                  void handleStructureAction(async () => {
                    const result = await crearCarreraBibliotecaAdministrador({
                      nombre: nuevaCarrera,
                      universidadId,
                    });
                    if (result.success) {
                      setNuevaCarrera('');
                    }
                    return result;
                  })
                }
              >
                {structurePending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </Button>
            </div>

            <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
              {carrerasFiltradas.length === 0 ? (
                <p className="rounded-[12px] border border-dashed border-[#dbe2f0] px-3 py-4 text-[12px] text-[#7f8aa3]">
                  {universidadId ? 'Todav&iacute;a no hay carreras para esta universidad.' :               'Elegí una universidad para ver carreras.'}
                </p>
              ) : (
                carrerasFiltradas.map((carrera) => {
                  const isActive = carrera.id === carreraId;
                  return (
                    <div
                      key={carrera.id}
                      className={`flex items-center justify-between rounded-[12px] border px-3 py-2.5 transition ${
                        isActive ? 'border-[#2563EB] bg-white' : 'border-[#e7ebf4] bg-white'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setCarreraId(carrera.id);
                          setCatalogSearch('');
                        }}
                        className={`flex-1 text-left text-[13px] font-medium ${
                          isActive ? 'text-[#2148d8]' : 'text-[#1d2a44]'
                        }`}
                      >
                        {carrera.nombre}
                      </button>
                      <button
                        type="button"
                        className="ml-3 text-[#9aa4ba] transition hover:text-[#dc2626]"
                        onClick={() =>
                          void handleStructureAction(() => eliminarCarreraBibliotecaAdministrador(carrera.id))
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="rounded-[16px] border border-[#e7ebf4] bg-white p-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[13px] font-semibold text-[#1d2a44]">Materias</p>
              <span className="text-[12px] text-[#7f8aa3]">{materiasPorCarrera.length.toLocaleString('es-AR')}</span>
            </div>

            <div className="mb-2">
              <input
                type="text"
                value={catalogSearch}
                onChange={(event) => setCatalogSearch(event.target.value)}
                placeholder={carreraId ? 'Buscar materia...' : 'Primero elige carrera'}
                disabled={!carreraId}
                className="h-10 w-full rounded-[12px] border border-[#dbe2f0] bg-white px-3 text-[13px] text-[#1d2a44] outline-none disabled:bg-white disabled:text-[#9aa4ba]"
              />
            </div>

            <div className="mb-4 flex gap-2">
              <input
                type="text"
                value={nuevaMateria}
                onChange={(event) => setNuevaMateria(event.target.value)}
                placeholder={carreraId ? 'Nueva materia' : 'Primero elige carrera'}
                disabled={!carreraId}
                className="h-10 flex-1 rounded-[12px] border border-[#dbe2f0] bg-white px-3 text-[13px] text-[#1d2a44] outline-none disabled:bg-white disabled:text-[#9aa4ba]"
              />
              <Button
                type="button"
                size="icon"
                disabled={structurePending || !carreraId || !nuevaMateria.trim()}
                className="h-10 w-10 rounded-[12px] bg-[#2563EB] hover:bg-[#2649c7]"
                onClick={() =>
                  void handleStructureAction(async () => {
                    const result = await crearMateriaBibliotecaAdministrador({
                      nombre: nuevaMateria,
                      carreraIds: [carreraId],
                    });
                    if (result.success) {
                      setNuevaMateria('');
                    }
                    return result;
                  })
                }
              >
                {structurePending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </Button>
            </div>

            <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
              {materiasPorCarrera.length === 0 ? (
                <p className="rounded-[12px] border border-dashed border-[#dbe2f0] px-3 py-4 text-[12px] text-[#7f8aa3]">
                  {carreraId ? 'Todav&iacute;a no hay materias para esta carrera.' :               'Elegí una carrera para ver materias.'}
                </p>
              ) : (
                materiasPorCarrera.map((materia) => (
                  <div
                    key={materia.id}
                    className="flex items-center justify-between rounded-[12px] border border-[#e7ebf4] bg-white px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-[#1d2a44]">{materia.nombre}</p>
                      {materia.isGeneral ? (
                        <p className="mt-1 text-[12px] text-[#7f8aa3]">Materia general</p>
                      ) : null}
                    </div>
                    {!materia.isGeneral ? (
                      <button
                        type="button"
                        className="ml-3 text-[#9aa4ba] transition hover:text-[#dc2626]"
                        onClick={() =>
                          void handleStructureAction(() =>
                            eliminarMateriaBibliotecaAdministrador({
                              materiaId: materia.id,
                              carreraId,
                            })
                          )
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-[16px] border border-dashed border-[#dbe2f0] bg-white p-4">
          <div className="space-y-1">
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#667085]">
              Importacion masiva Excel
            </p>
            <p className="text-[12px] leading-5 text-[#7f8aa3]">
              Subí la malla con carreras en la primera fila y las materias debajo de cada columna.
              Las carreras faltantes se crean dentro de la universidad seleccionada.
            </p>
          </div>

          <div className="mt-4 flex flex-col gap-3 xl:flex-row xl:items-center">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(event) => void handleMateriaImportFile(event.target.files?.[0] ?? null)}
              className="h-11 flex-1 rounded-[12px] border border-[#dbe2f0] bg-white px-3 py-2 text-[13px] text-[#1d2a44]"
            />
            <Button
              type="button"
              disabled={!materiasImportFile || !universidadId || structurePending}
              className="h-11 rounded-[12px] bg-[#1d2a44] px-5 text-white hover:bg-[#151f34]"
              onClick={() => void handleImportMaterias()}
            >
              {structurePending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />}
              Importar malla
            </Button>
          </div>

          {!universidadId ? (
            <p className="mt-3 text-[12px] text-[#b45309]">
              Primero elegí la universidad donde quieras crear las carreras nuevas.
            </p>
          ) : null}

          {materiasImportFile ? (
            <p className="mt-3 text-[12px] text-[#7f8aa3]">
              Archivo listo: <span className="font-semibold text-[#1d2a44]">{materiasImportFile.name}</span>
              {materiasImportPreviewCount !== null ? ` · ${materiasImportPreviewCount} materias detectadas` : ''}
            </p>
          ) : null}

          {materiasImportResult ? (
            <div className="mt-3 rounded-[14px] border border-[#e7ebf4] bg-white p-4 text-[12px] text-[#667085]">
              <p className="font-semibold text-[#1d2a44]">{materiasImportResult.message}</p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
                <span>Carreras nuevas: <strong>{materiasImportResult.carrerasCreated ?? 0}</strong></span>
                <span>Filas validas: <strong>{materiasImportResult.filasProcesadas ?? 0}</strong></span>
                <span>Materias nuevas: <strong>{materiasImportResult.materiasCreated ?? 0}</strong></span>
                <span>Materias reutilizadas: <strong>{materiasImportResult.materiasReused ?? 0}</strong></span>
                <span>Asignaciones nuevas: <strong>{materiasImportResult.relacionesCreated ?? 0}</strong></span>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-[20px] border border-[#e7ebf4] bg-white p-5">
        <div className="mb-5">
          <p className="text-[14px] font-semibold text-[#1d2a44]">Carga de material</p>
          <p className="mt-1 text-[13px] text-[#7f8aa3]">
            Elegí universidad, materia y tipo de material antes de subir el archivo.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div>
            <FieldLabel>Universidad</FieldLabel>
            <select
              value={universidadId}
              onChange={(event) => {
                setUniversidadId(event.target.value);
                setCarreraId('');
                setMateriaId('');
                setMateriaSearch('');
                setCatalogSearch('');
              }}
              className="h-11 w-full rounded-[14px] border border-[#dbe2f0] bg-white px-3 text-[14px] text-[#1d2a44] outline-none"
            >
              <option value="">Seleccionar universidad</option>
              {universidades.map((universidad) => (
                <option key={universidad.id} value={universidad.id}>
                  {universidad.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <FieldLabel>Materia</FieldLabel>
            <input
              type="text"
              value={materiaSearch}
              onChange={(event) => setMateriaSearch(event.target.value)}
              disabled={!universidadId}
              placeholder={universidadId ? 'Buscar materia...' : 'Primero elige una universidad'}
              className="mb-2 h-11 w-full rounded-[14px] border border-[#dbe2f0] bg-white px-3 text-[14px] text-[#1d2a44] outline-none placeholder:text-[#9aa4ba] disabled:bg-white disabled:text-[#9aa4ba]"
            />
            <select
              value={materiaId}
              onChange={(event) => setMateriaId(event.target.value)}
              disabled={!universidadId}
              className="h-11 w-full rounded-[14px] border border-[#dbe2f0] bg-white px-3 text-[14px] text-[#1d2a44] outline-none disabled:bg-white disabled:text-[#9aa4ba]"
            >
              <option value="">{universidadId ? 'Seleccionar materia' : 'Primero elige una universidad'}</option>
              {filteredMaterias.map((materia) => (
                <option key={materia.id} value={materia.id}>
                  {materia.nombre}
                </option>
              ))}
            </select>
            {universidadId ? (
              <p className="mt-2 text-[12px] text-[#7f8aa3]">
                {filteredMaterias.length.toLocaleString('es-AR')} materias encontradas
              </p>
            ) : null}
          </div>

          <div>
            <FieldLabel>Tipo de material</FieldLabel>
            <select
              value={recursoType}
              onChange={(event) => {
                setRecursoType(event.target.value as ResourceType);
                setSubTipo('');
                setResumenModules([]);
                setResumenParcial('');
                setSelectedFile(null);
                setSelectedFiles([]);
                setMaterialBatchQueue([]);
                setPregunteroDestino('ambas');
                setPregunteroFiles({ parcial1: null, parcial2: null });
              }}
              className="h-11 w-full rounded-[14px] border border-[#dbe2f0] bg-white px-3 text-[14px] text-[#1d2a44] outline-none"
            >
              <option value="Preguntero">Preguntero</option>
              <option value="Resumen">Resumen</option>
              <option value="Trabajo Práctico">Trabajo práctico</option>
            </select>
          </div>

          {!isResumen && !isPreguntero ? (
            <div>
              <FieldLabel>Trabajo práctico</FieldLabel>
              <select
                value={subTipo}
                onChange={(event) => setSubTipo(event.target.value)}
                className="h-11 w-full rounded-[14px] border border-[#dbe2f0] bg-white px-3 text-[14px] text-[#1d2a44] outline-none"
              >
                <option value="">Seleccionar</option>
                <option value="TP 1">TP 1</option>
                <option value="TP 2">TP 2</option>
                <option value="TP 3">TP 3</option>
                <option value="TP 4">TP 4</option>
              </select>
            </div>
          ) : null}

          {isResumen ? (
            <div className="xl:col-span-2 rounded-[16px] border border-[#e7ebf4] bg-white p-4">
              <FieldLabel>Módulos del resumen</FieldLabel>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                {['1', '2', '3', '4'].map((module) => (
                  <label
                    key={module}
                    className="flex items-center gap-2 rounded-[12px] border border-[#dbe2f0] bg-white px-3 py-2 text-[13px] text-[#1d2a44]"
                  >
                    <input
                      type="checkbox"
                      checked={resumenModules.includes(module)}
                      onChange={(event) =>
                        setResumenModules((current) =>
                          event.target.checked ? [...current, module] : current.filter((value) => value !== module)
                        )
                      }
                    />
                    Módulo {module}
                  </label>
                ))}
              </div>

              <div className="mt-4">
                <FieldLabel>Parcial del resumen (opcional)</FieldLabel>
                <select
                  value={resumenParcial}
                  onChange={(event) => setResumenParcial(event.target.value)}
                  className="h-11 w-full rounded-[14px] border border-[#dbe2f0] bg-white px-3 text-[14px] text-[#1d2a44] outline-none"
                >
                  <option value="">Sin parcial</option>
                  <option value="Parcial 1">Parcial 1</option>
                  <option value="Parcial 2">Parcial 2</option>
                </select>
              </div>
            </div>
          ) : null}

          {isPreguntero ? (
            <>
              <div>
                <FieldLabel>Destino del preguntero</FieldLabel>
                <select
                  value={pregunteroDestino}
                  onChange={(event) => {
                    const nextValue = event.target.value as PregunteroDestino;
                    setPregunteroDestino(nextValue);
                    if (nextValue !== 'solo_simulador') {
                      setEliminarArchivoTrasProcesar(false);
                    }
                  }}
                  className="h-11 w-full rounded-[14px] border border-[#dbe2f0] bg-white px-3 text-[14px] text-[#1d2a44] outline-none"
                >
                  <option value="ambas">Simulador + visualizacion</option>
                  <option value="solo_simulador">Simulador unicamente</option>
                  <option value="solo_visualizacion">Solo visualizacion</option>
                </select>
              </div>

              <div className="xl:col-span-2">
                <div className="space-y-2">
                  <label className="flex min-h-[44px] items-center gap-2 rounded-[14px] border border-[#dbe2f0] bg-white px-3 py-2.5 text-[13px] text-[#1d2a44]">
                    <input
                      type="checkbox"
                      checked={usarIAEnCarga}
                      onChange={(event) => setUsarIAEnCarga(event.target.checked)}
                      disabled={pregunteroDestino === 'solo_visualizacion'}
                    />
                    Procesar con IA si el archivo es PDF
                  </label>
                  {pregunteroDestino === 'solo_simulador' ? (
                    <label className="flex min-h-[44px] items-center gap-2 rounded-[14px] border border-[#dbe2f0] bg-white px-3 py-2.5 text-[13px] text-[#1d2a44]">
                      <input
                        type="checkbox"
                        checked={eliminarArchivoTrasProcesar}
                        onChange={(event) => setEliminarArchivoTrasProcesar(event.target.checked)}
                      />
                      Eliminar archivo después de extraer preguntas
                    </label>
                  ) : null}
                </div>
              </div>
            </>
          ) : null}

          {isPreguntero ? (
            <>
              <FileDrop
                label="Archivo Parcial 1"
                file={pregunteroFiles.parcial1}
                onChange={(file) =>
                  setPregunteroFiles((current) => ({
                    ...current,
                    parcial1: file,
                  }))
                }
              />
              <FileDrop
                label="Archivo Parcial 2"
                file={pregunteroFiles.parcial2}
                onChange={(file) =>
                  setPregunteroFiles((current) => ({
                    ...current,
                    parcial2: file,
                  }))
                }
              />
            </>
          ) : (
            <div className="xl:col-span-2 space-y-4">
              <FileDrop
                label="Archivos"
                file={selectedFiles[0] ?? selectedFile}
                files={selectedFiles}
                multiple
                onChange={(file, files) => {
                  setSelectedFile(file);
                  setSelectedFiles(files ?? (file ? [file] : []));
                }}
              />

              <div className="flex flex-col gap-3 rounded-[16px] border border-[#e7ebf4] bg-white p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-[13px] font-semibold text-[#1d2a44]">Armar lote</p>
                  <p className="mt-1 text-[12px] text-[#7f8aa3]">
                    Agrupa varios archivos para los mismos módulos o el mismo trabajo práctico.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!canAddBatch || uploadingFile || isPending}
                  className="h-10 rounded-[12px] border-[#dbe2f0] text-[#1d2a44]"
                  onClick={addMaterialBatch}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar lote
                </Button>
              </div>

              <div className="space-y-3">
                {materialBatchQueue.length === 0 ? (
                  <p className="rounded-[14px] border border-dashed border-[#dbe2f0] px-4 py-4 text-[12px] text-[#7f8aa3]">
                    Todavía no agregaste lotes. Podés cargar varios PDFs por módulo, parcial o TP antes de subir.
                  </p>
                ) : (
                  materialBatchQueue.map((batch) => {
                    const batchLabel = isResumen
                      ? batch.resumenModules.length > 0
                        ? `Resumen · Modulos ${batch.resumenModules.join(', ')}${batch.resumenParcial ? ` · ${batch.resumenParcial}` : ''}`
                        : `Resumen · ${batch.resumenParcial}`
                      : batch.subTipo;

                    return (
                      <div
                        key={batch.id}
                        className="rounded-[14px] border border-[#e7ebf4] bg-white px-4 py-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-[#1d2a44]">{batchLabel}</p>
                            <p className="mt-1 text-[12px] text-[#7f8aa3]">
                              {batch.files.length} archivo{batch.files.length === 1 ? '' : 's'}
                            </p>
                            <p className="mt-2 break-words text-[12px] text-[#667085]">
                              {batch.files.map((file) => file.name).join(' · ')}
                            </p>
                          </div>
                          <button
                            type="button"
                            className="text-[#9aa4ba] transition hover:text-[#dc2626]"
                            onClick={() =>
                              setMaterialBatchQueue((current) => current.filter((item) => item.id !== batch.id))
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 flex justify-end">
          <Button
            onClick={() => void handleUpload()}
            disabled={!canSubmit || uploadingFile || isPending}
            className="h-10 rounded-[12px] bg-[#2563EB] px-5 hover:bg-[#2649c7]"
          >
            {uploadingFile || isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
            Subir material
          </Button>
        </div>
      </section>
    </section>
  );
}
