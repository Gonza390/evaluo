'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Clipboard,
  Clock3,
  Eye,
  FileText,
  Files,
  Globe,
  GraduationCap,
  Loader2,
  Lock,
  Plus,
  Upload,
} from 'lucide-react';
import {
  getStudentMaterialProcessingStateAction,
  processStudentMaterialAction,
  type StudentMaterialProcessingState,
  uploadStudentMaterialAction,
  updateStudentMaterialVisibilityAction,
} from '@/app/dashboard/materiales/actions';
import type { StudentMaterial } from '@/lib/data/student-materials';
import { getMateriaRoute, getStudentMaterialRoute } from '@/lib/routes';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { trackMarketingEvent } from '@/lib/marketing-analytics';
import { PremiumUpsell } from '@/components/premium/premium-upsell';

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

interface StudentMaterialsWorkspaceProps {
  initialMaterials: StudentMaterial[];
  universidades: UniversidadOption[];
  carreras: CarreraOption[];
  materias: MateriaOption[];
  carreraMaterias: CarreraMateriaRelation[];
}

const SUPPORTED_FILE_TYPES = ['PDF', 'PPTX', 'DOCX', 'TXT'] as const;

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getFeaturedMaterialLabel(material: StudentMaterial | null) {
  if (!material) {
    return 'Documento de ejemplo';
  }

  return material.visibility === 'shared' ? 'Compartido en tu materia' : 'Solo en tu espacio';
}

export function StudentMaterialsWorkspace({
  initialMaterials,
  universidades,
  carreras,
  materias,
  carreraMaterias,
}: StudentMaterialsWorkspaceProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [universidadId, setUniversidadId] = useState('');
  const [carreraId, setCarreraId] = useState('');
  const [materiaId, setMateriaId] = useState('');
  const [shareWithCatalog, setShareWithCatalog] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [activeProcessing, setActiveProcessing] = useState<StudentMaterialProcessingState | null>(null);
  const [displayProgress, setDisplayProgress] = useState(0);
  const [processingStartedAt, setProcessingStartedAt] = useState<number | null>(null);
  const [showPremiumUpsell, setShowPremiumUpsell] = useState(false);

  const featuredMaterial = initialMaterials[0] ?? null;

  const universityNameById = useMemo(
    () => new Map(universidades.map((universidad) => [universidad.id, universidad.nombre])),
    [universidades]
  );
  const careerNameById = useMemo(
    () => new Map(carreras.map((carrera) => [carrera.id, carrera.nombre])),
    [carreras]
  );
  const materiaNameById = useMemo(
    () => new Map(materias.map((materia) => [materia.id, materia.nombre])),
    [materias]
  );

  const filteredCarreras = useMemo(
    () => carreras.filter((carrera) => !universidadId || carrera.universidad_id === universidadId),
    [carreras, universidadId]
  );

  const filteredMaterias = useMemo(() => {
    if (!carreraId) {
      return [];
    }

    const allowedMateriaIds = new Set(
      carreraMaterias
        .filter((relation) => relation.carrera_id === carreraId && relation.materia_id)
        .map((relation) => relation.materia_id as string)
    );

    return materias.filter((materia) => {
      if (allowedMateriaIds.has(materia.id)) {
        return true;
      }

      return materia.carrera_id === carreraId;
    });
  }, [carreraId, carreraMaterias, materias]);

  const resetForm = () => {
    setTitle('');
    setUniversidadId('');
    setCarreraId('');
    setMateriaId('');
    setShareWithCatalog(true);
    setSelectedFile(null);
    setFileInputKey((current) => current + 1);
  };

  useEffect(() => {
    if (!activeProcessing) {
      return undefined;
    }

    const interval = window.setInterval(async () => {
      const state = await getStudentMaterialProcessingStateAction(activeProcessing.materialId);
      if (!state) {
        return;
      }

      setActiveProcessing(state);

      if (state.status === 'ready') {
        setDisplayProgress(100);
        router.refresh();
        window.setTimeout(() => {
          router.push(getStudentMaterialRoute(state.materialId));
        }, 700);
      }
    }, 1800);

    return () => window.clearInterval(interval);
  }, [activeProcessing, router]);

  useEffect(() => {
    if (!activeProcessing) {
      setDisplayProgress(0);
      setProcessingStartedAt(null);
      return;
    }

    setDisplayProgress((current) => {
      if (current === 0) {
        return Math.max(6, activeProcessing.progress);
      }
      return current;
    });

    if (!processingStartedAt) {
      setProcessingStartedAt(Date.now());
    }
  }, [activeProcessing, processingStartedAt]);

  useEffect(() => {
    if (!activeProcessing) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setDisplayProgress((current) => {
        if (!activeProcessing) return current;
        if (activeProcessing.status === 'failed') return current;
        if (current >= activeProcessing.progress) return current;
        return Math.min(activeProcessing.progress, current + 1);
      });
    }, 140);

    return () => window.clearInterval(interval);
  }, [activeProcessing]);

  const estimatedSecondsRemaining = useMemo(() => {
    if (!activeProcessing || activeProcessing.status === 'ready') {
      return 0;
    }

    if (activeProcessing.status === 'failed') {
      return null;
    }

    if (!processingStartedAt || displayProgress < 8) {
      return 45;
    }

    const elapsedSeconds = Math.max(1, Math.round((Date.now() - processingStartedAt) / 1000));
    const projectedTotal = Math.round((elapsedSeconds / Math.max(displayProgress, 10)) * 100);
    return Math.max(6, projectedTotal - elapsedSeconds);
  }, [activeProcessing, displayProgress, processingStartedAt]);

  const estimatedTimeLabel = useMemo(() => {
    if (estimatedSecondsRemaining === null) {
      return 'Necesita revision';
    }

    if (estimatedSecondsRemaining <= 0) {
      return 'Casi listo';
    }

    const minutes = Math.floor(estimatedSecondsRemaining / 60);
    const seconds = estimatedSecondsRemaining % 60;
    if (minutes <= 0) {
      return `${seconds}s`;
    }

    return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
  }, [estimatedSecondsRemaining]);

  const handleUpload = () => {
    if (!selectedFile) {
      toast({
        description: 'Selecciona un PDF antes de continuar.',
        variant: 'destructive',
      });
      return;
    }

    const formData = new FormData();
    formData.set('title', title);
    formData.set('universidadId', universidadId);
    formData.set('carreraId', carreraId);
    formData.set('materiaId', materiaId);
    formData.set('shareWithCatalog', String(shareWithCatalog));
    formData.set('file', selectedFile);

    startTransition(async () => {
      const result = await uploadStudentMaterialAction(formData);

      let isQuotaError = false;
      if (!result.success) {
        const message = result.message.toLowerCase();
        isQuotaError =
          message.includes('limite') || message.includes('límite') || message.includes('plan gratis');

        if (isQuotaError) {
          trackMarketingEvent('limit_reached_material_upload', {
            materia_id: materiaId || undefined,
          });
          setShowPremiumUpsell(true);
        }
      }

      if (!isQuotaError) {
        toast({
          description: result.message,
          variant: result.success ? 'default' : 'destructive',
        });
      }

      if (result.success) {
        if (result.materialId) {
          setActiveProcessing({
            materialId: result.materialId,
            title: title.trim() || selectedFile.name.replace(/\.pdf$/i, ''),
            fileName: selectedFile.name,
            status: 'uploaded',
            stage: 'uploaded',
            progress: 10,
            message: 'PDF subido. Lo dejamos en cola para procesarlo.',
            error: null,
          });
          setDisplayProgress(10);
          setProcessingStartedAt(Date.now());
          void processStudentMaterialAction(result.materialId);
        }
        resetForm();
        setIsUploadDialogOpen(false);
        router.refresh();
      }
    });
  };

  const handleVisibilityChange = (materialId: string, nextVisibility: 'private' | 'shared') => {
    startTransition(async () => {
      const result = await updateStudentMaterialVisibilityAction({
        materialId,
        visibility: nextVisibility,
      });

      toast({
        description: result.message,
        variant: result.success ? 'default' : 'destructive',
      });

      if (result.success) {
        router.refresh();
      }
    });
  };

  return (
    <>
      <div className="space-y-4">
        <section className="overflow-hidden rounded-[1.6rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(248,250,252,0.98)_100%)] p-4 shadow-[0_18px_50px_rgba(15,23,42,0.07)] sm:p-5">
          <div className="text-center">
            <h1 className="text-[1.9rem] font-bold tracking-[-0.06em] text-slate-950 sm:text-[2.15rem]">
              Hola, listo para estudiar mejor?
            </h1>
          </div>

          <div className="mt-6 grid gap-3 lg:grid-cols-[1.05fr_1fr]">
            <div className="relative overflow-hidden rounded-[1.35rem] border border-amber-200/70 bg-[linear-gradient(135deg,#FFF7ED_0%,#FFF1E6_52%,#FEF3C7_100%)] p-4 shadow-[0_16px_38px_rgba(245,158,11,0.09)] sm:p-[1.05rem]">
              <div className="absolute -bottom-10 -right-8 h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(251,191,36,0.28),transparent_72%)]" />
              <div className="relative flex h-full flex-col justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[1rem] bg-[#F59E0B] text-white shadow-[0_10px_24px_rgba(245,158,11,0.18)]">
                    <GraduationCap className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700/80">
                      {getFeaturedMaterialLabel(featuredMaterial)}
                    </p>
                    <h2 className="mt-1.5 break-words text-[1.3rem] font-bold tracking-[-0.05em] text-slate-950 sm:text-[1.45rem]">
                      {featuredMaterial?.title ?? 'Tu primer material'}
                    </h2>
                    <p className="mt-1.5 text-[13px] leading-5 text-slate-600">
                      {featuredMaterial
                        ? featuredMaterial.file_name
                        : 'Sube un documento y tendras un espacio ordenado para estudiar, resumir y repasar.'}
                    </p>
                  </div>
                </div>

                <div className="relative flex flex-wrap items-center gap-2.5">
                  {featuredMaterial ? (
                    <>
                      <Button asChild className="bg-[#F59E0B] from-[#F59E0B] to-[#FB923C] text-white hover:opacity-95">
                        <Link href={getStudentMaterialRoute(featuredMaterial.id)}>
                          Continuar
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button asChild size="sm" variant="outline" className="border-amber-200 bg-white/70 backdrop-blur">
                        <Link href={getMateriaRoute(featuredMaterial.materia_id, featuredMaterial.carrera_id)}>
                          Ver materia
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        type="button"
                        onClick={() => setIsUploadDialogOpen(true)}
                        className="bg-[#F59E0B] from-[#F59E0B] to-[#FB923C] text-white hover:opacity-95"
                      >
                        Subir primer PDF
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                      <Button asChild size="sm" variant="outline" className="border-amber-200 bg-white/70 backdrop-blur">
                        <Link href="/materias">
                          Ver materias
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-[1.35rem] border border-slate-200/80 bg-[#FCFCFE] p-4 shadow-[0_14px_34px_rgba(15,23,42,0.05)] sm:p-[1.05rem]">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[1rem] bg-[#EEF4FF] text-[#2563EB]">
                  <Files className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h2 className="text-[1.15rem] font-bold tracking-[-0.04em] text-slate-950">
                    Sube tu material del curso
                  </h2>
                  <p className="mt-1.5 text-[13px] leading-5 text-slate-500">
                    Mantendremos una estructura simple para que despues puedas convertir cada PDF en un
                    espacio de estudio mas completo.
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {SUPPORTED_FILE_TYPES.map((type) => (
                  <span
                    key={type}
                    className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500"
                  >
                    {type}
                  </span>
                ))}
              </div>

              <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
                <Button type="button" size="sm" onClick={() => setIsUploadDialogOpen(true)} className="justify-center">
                  <Upload className="h-4 w-4" />
                  Subir documento
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    toast({
                      description: 'La opcion para pegar enlaces o texto la dejamos preparada para la siguiente etapa.',
                    })
                  }
                >
                  <Clipboard className="h-4 w-4" />
                  Pegar
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[1.6rem] border border-slate-200/80 bg-white p-4 shadow-[0_16px_46px_rgba(15,23,42,0.05)] sm:p-5">
          <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Biblioteca personal</p>
              <h2 className="mt-1.5 text-[1.25rem] font-bold tracking-[-0.05em] text-slate-950">Tus materiales</h2>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={() => setIsUploadDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Nuevo material
            </Button>
          </div>

          <div className="mt-4 space-y-2.5">
            {initialMaterials.length === 0 ? (
              <div className="rounded-[1.25rem] border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
                <FileText className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-3 text-sm font-semibold text-slate-900">Todavia no subiste materiales</p>
                <p className="mt-1.5 text-[13px] leading-5 text-slate-500">
                  Cuando cargues tu primer PDF, aparecera aca con su categoria y accesos rapidos.
                </p>
              </div>
            ) : (
              initialMaterials.map((material) => {
                const isShared = material.visibility === 'shared';

                return (
                  <article
                    key={material.id}
                    className="flex flex-col gap-3 rounded-[1.25rem] border border-slate-200 bg-[linear-gradient(180deg,#FFFFFF_0%,#FAFBFF_100%)] px-3.5 py-3.5 sm:px-4"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-[15px] font-semibold tracking-[-0.03em] text-slate-950">{material.title}</h3>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              isShared ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {isShared ? <Globe className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                            {isShared ? 'Compartido' : 'Privado'}
                          </span>
                          {material.processing_status !== 'ready' ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Procesando
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1.5 text-[13px] text-slate-500">{material.file_name}</p>
                        <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1.5 text-[11px] font-medium text-slate-500">
                          <span>{universityNameById.get(material.universidad_id) ?? 'Universidad'}</span>
                          <span>{careerNameById.get(material.carrera_id) ?? 'Carrera'}</span>
                          <span>{materiaNameById.get(material.materia_id) ?? 'Materia'}</span>
                          <span>{formatDate(material.created_at)}</span>
                          {material.page_count ? <span>{material.page_count} paginas</span> : null}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleVisibilityChange(material.id, isShared ? 'private' : 'shared')}
                          disabled={isPending}
                        >
                          {isShared ? <Lock className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                          {isShared ? 'Ocultar' : 'Compartir'}
                        </Button>
                        <Button asChild size="sm">
                          <Link href={getStudentMaterialRoute(material.id)}>
                            <Eye className="h-4 w-4" />
                            {material.processing_status === 'ready' ? 'Abrir PDF' : 'Ver estado'}
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>
      </div>

      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto rounded-[1.5rem] border-slate-200 bg-white p-0 shadow-[0_24px_70px_rgba(15,23,42,0.16)]">
          <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
            <DialogHeader className="text-left">
              <DialogTitle className="text-[1.25rem] font-bold tracking-[-0.05em] text-slate-950">
                Sube tu material
              </DialogTitle>
              <DialogDescription className="mt-1.5 text-[13px] leading-5 text-slate-500">
                Completa la estructura base del documento antes de cargarlo. Despues podremos trabajar el
                resumen y el espacio de estudio sobre este mismo PDF.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="grid gap-3 px-4 py-4 sm:grid-cols-2 sm:px-5">
            <div className="sm:col-span-2">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Titulo</p>
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ej. Resumen completo para el primer parcial"
              />
            </div>

            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Universidad</p>
              <select
                value={universidadId}
                onChange={(event) => {
                  setUniversidadId(event.target.value);
                  setCarreraId('');
                  setMateriaId('');
                }}
                className="h-10 w-full rounded-[1rem] border border-slate-200 bg-white px-3 text-[13px] text-slate-700 outline-none"
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
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Carrera</p>
              <select
                value={carreraId}
                onChange={(event) => {
                  setCarreraId(event.target.value);
                  setMateriaId('');
                }}
                disabled={!universidadId}
                className="h-10 w-full rounded-[1rem] border border-slate-200 bg-white px-3 text-[13px] text-slate-700 outline-none disabled:bg-slate-50"
              >
                <option value="">Seleccionar carrera</option>
                {filteredCarreras.map((carrera) => (
                  <option key={carrera.id} value={carrera.id}>
                    {carrera.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Materia</p>
              <select
                value={materiaId}
                onChange={(event) => setMateriaId(event.target.value)}
                disabled={!carreraId}
                className="h-10 w-full rounded-[1rem] border border-slate-200 bg-white px-3 text-[13px] text-slate-700 outline-none disabled:bg-slate-50"
              >
                <option value="">Seleccionar materia</option>
                {filteredMaterias.map((materia) => (
                  <option key={materia.id} value={materia.id}>
                    {materia.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Archivo PDF</p>
              <Input
                key={fileInputKey}
                type="file"
                accept=".pdf,application/pdf"
                onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
              />
              {selectedFile ? (
                <p className="mt-2 text-xs text-slate-500">
                  {selectedFile.name} · {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              ) : null}
            </div>

            <div className="sm:col-span-2">
              <label className="flex items-start gap-3 rounded-[1rem] border border-slate-200 bg-slate-50 px-3.5 py-3 text-[13px] text-slate-700">
                <input
                  type="checkbox"
                  checked={shareWithCatalog}
                  onChange={(event) => setShareWithCatalog(event.target.checked)}
                  className="mt-1"
                />
                <span>Comparte este PDF en la materia y la carrera para que otros alumnos tambien lo vean.</span>
              </label>
            </div>
          </div>

          <DialogFooter className="border-t border-slate-100 px-4 py-4 sm:px-5">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setIsUploadDialogOpen(false);
                resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleUpload}
              disabled={isPending || !title || !universidadId || !carreraId || !materiaId || !selectedFile}
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Subir PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(activeProcessing)} modal>
        <DialogContent
          showCloseButton={activeProcessing?.status === 'failed'}
          onInteractOutside={(event) => event.preventDefault()}
          onEscapeKeyDown={(event) => {
            if (activeProcessing?.status !== 'failed') {
              event.preventDefault();
            }
          }}
          className="max-w-xl rounded-[1.75rem] border-slate-200 bg-white p-0 shadow-[0_30px_90px_rgba(15,23,42,0.2)]"
        >
          {activeProcessing ? (
            <div className="overflow-hidden rounded-[1.75rem]">
              <div className="bg-[linear-gradient(135deg,#FFF7ED_0%,#FFFFFF_40%,#EEF4FF_100%)] px-5 py-5 sm:px-6">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-[#F59E0B] text-white shadow-[0_12px_28px_rgba(245,158,11,0.18)]">
                    {activeProcessing.status === 'failed' ? (
                      <FileText className="h-5 w-5" />
                    ) : (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <DialogTitle className="text-[1.2rem] font-bold tracking-[-0.05em] text-slate-950">
                      {activeProcessing.status === 'failed' ? 'No pudimos terminar el PDF' : 'Estamos preparando tu material'}
                    </DialogTitle>
                    <DialogDescription className="mt-1.5 text-[13px] leading-5 text-slate-600">
                      {activeProcessing.fileName}
                    </DialogDescription>
                  </div>
                </div>
              </div>

              <div className="space-y-5 px-5 py-5 sm:px-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[12px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    <span>Progreso</span>
                    <span>{Math.min(100, Math.max(displayProgress, activeProcessing.progress))}%</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-[width] duration-500 ${
                        activeProcessing.status === 'failed'
                          ? 'bg-red-400'
                          : 'bg-[linear-gradient(90deg,#F59E0B_0%,#FB923C_45%,#2563EB_100%)]'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(displayProgress, activeProcessing.progress))}%` }}
                    />
                  </div>
                </div>

                <div className="grid gap-2 rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3">
                  {[
                    ['uploaded', 'PDF subido'],
                    ['extracting', 'Extrayendo texto y paginas'],
                    ['summarizing', 'Generando resumen'],
                    ['glossary', 'Generando glosario'],
                    ['ready', 'Material listo'],
                  ].map(([stageId, label]) => {
                    const isActive = activeProcessing.stage === stageId;
                    const isDone =
                      ['uploaded', 'extracting', 'summarizing', 'glossary', 'ready'].indexOf(activeProcessing.stage) >
                      ['uploaded', 'extracting', 'summarizing', 'glossary', 'ready'].indexOf(stageId);

                    return (
                      <div key={stageId} className="flex items-center justify-between gap-3 text-[13px]">
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${
                              isDone ? 'bg-emerald-500' : isActive ? 'bg-[#F59E0B]' : 'bg-slate-300'
                            }`}
                          />
                          <span className={isActive ? 'font-semibold text-slate-950' : 'text-slate-600'}>{label}</span>
                        </div>
                        {isActive && activeProcessing.status !== 'failed' ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-[#F59E0B]" />
                        ) : null}
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-[13px] text-slate-600">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EEF4FF] px-3 py-1 text-[#2563EB]">
                    <Clock3 className="h-3.5 w-3.5" />
                    Tiempo estimado restante: {estimatedTimeLabel}
                  </span>
                </div>

                <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3">
                  <p className="text-[13px] font-semibold text-slate-950">
                    {activeProcessing.status === 'failed' ? 'Se interrumpio el procesamiento' : activeProcessing.message}
                  </p>
                  <p className="mt-1.5 text-[12.5px] leading-5 text-slate-500">
                    {activeProcessing.status === 'failed'
                      ? activeProcessing.error ?? 'No recibimos mas detalle del error.'
                      : 'Puedes dejar esta ventana abierta mientras armamos el resumen y el glosario del PDF.'}
                  </p>
                </div>

                {activeProcessing.status === 'failed' ? (
                  <div className="flex justify-end">
                    <Button type="button" variant="outline" onClick={() => setActiveProcessing(null)}>
                      Cerrar
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={showPremiumUpsell} onOpenChange={setShowPremiumUpsell}>
        <DialogContent className="w-[min(calc(100vw-1.5rem),420px)] rounded-[24px] border border-slate-200 bg-white p-0 text-slate-900 shadow-[0_24px_70px_rgba(15,23,42,0.16)]">
          <div className="px-4 py-4 sm:px-5 sm:py-5">
            <PremiumUpsell
              title="Alcanzaste el límite de subida de materiales"
              description="El plan gratis permite 1 material cada 15 días. Con Premium subí hasta 3 por día y estudiá sin esperas."
              source="materiales_upload_limit"
              features={[
                'Hasta 3 materiales por día',
                'Resúmenes y glosarios automáticos',
                'Repaso con IA sobre tus apuntes',
              ]}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
