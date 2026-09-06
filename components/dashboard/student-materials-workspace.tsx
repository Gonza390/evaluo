'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  BookOpenCheck,
  Clock3,
  Eye,
  FileText,
  Files,
  Globe,
  GraduationCap,
  Loader2,
  Lock,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  deleteStudentMaterialAction,
  getStudentMaterialProcessingStateAction,
  processStudentMaterialAction,
  type StudentMaterialProcessingState,
  updateStudentMaterialVisibilityAction,
} from '@/app/dashboard/materiales/actions';
import {
  cancelStudentMaterialUploadAction,
  finalizeStudentMaterialUploadAction,
  prepareStudentMaterialUploadAction,
} from '@/app/dashboard/materiales/upload-actions';
import type { StudentMaterial } from '@/lib/data/student-materials';
import { getCareerRoute, getMateriaRoute, getStudentMaterialRoute } from '@/lib/routes';
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { trackMarketingEvent } from '@/lib/marketing-analytics';
import { PremiumUpsell } from '@/components/premium/premium-upsell';
import { GuidedTour, type GuidedTourStep } from '@/components/ui/guided-tour';
import { useUser } from '@/hooks/useUser';
import { getSupabaseBrowserClient } from '@/lib/supabase-client';
import { MAX_STUDENT_MATERIAL_FILE_SIZE_BYTES } from '@/lib/student-materials/validation';

function getMaterialsTourStorageKey(userId: string) {
  return `evaluo_mi_espacio_tour_seen:${userId}`;
}

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
  initialUniversidadId?: string;
  initialCarreraId?: string;
  initialMateriaId?: string;
  initialOpenUpload?: boolean;
}

const STUDY_OUTPUTS = ['Resumen', 'Glosario', 'Tarjetas', 'Ejercicios'] as const;

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

function isMaterialUploadQuotaMessage(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('limite') ||
    normalized.includes('límite') ||
    normalized.includes('plan gratis')
  );
}

export function StudentMaterialsWorkspace({
  initialMaterials,
  universidades,
  carreras,
  materias,
  carreraMaterias,
  initialUniversidadId = '',
  initialCarreraId = '',
  initialMateriaId = '',
  initialOpenUpload = false,
}: StudentMaterialsWorkspaceProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const [isPending, startTransition] = useTransition();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [showMaterialsTour, setShowMaterialsTour] = useState(false);
  const [materialsTourStepIndex, setMaterialsTourStepIndex] = useState(0);
  const materialsTourDismissedRef = useRef(false);
  const uploadHeroTourRef = useRef<HTMLElement | null>(null);
  const libraryTourRef = useRef<HTMLElement | null>(null);
  const materialEntryTourRef = useRef<HTMLElement | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [universidadId, setUniversidadId] = useState(initialUniversidadId);
  const [carreraId, setCarreraId] = useState(initialCarreraId);
  const [materiaId, setMateriaId] = useState(initialMateriaId);
  const [shareWithCatalog, setShareWithCatalog] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [activeProcessing, setActiveProcessing] = useState<StudentMaterialProcessingState | null>(
    null
  );
  const [displayProgress, setDisplayProgress] = useState(0);
  const [processingStartedAt, setProcessingStartedAt] = useState<number | null>(null);
  const [showPremiumUpsell, setShowPremiumUpsell] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<StudentMaterial | null>(null);
  const hasAcademicProfile = Boolean(initialUniversidadId && initialCarreraId);

  const featuredMaterial = initialMaterials[0] ?? null;

  const sharedMaterialsCount = useMemo(
    () => initialMaterials.filter((material) => material.visibility === 'shared').length,
    [initialMaterials]
  );
  const isContributor = sharedMaterialsCount > 0;

  useEffect(() => {
    if (initialOpenUpload) {
      setIsUploadDialogOpen(true);
    }
  }, [initialOpenUpload]);

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
    setDescription('');
    setUniversidadId(initialUniversidadId);
    setCarreraId(initialCarreraId);
    setMateriaId(initialMateriaId);
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
      return 'Necesita revisión';
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
        description: 'Seleccioná un PDF antes de continuar.',
        variant: 'destructive',
      });
      return;
    }

    if (description.trim().length < 3) {
      toast({
        description: 'Indicá brevemente a qué parcial, módulos o temas corresponde el material.',
        variant: 'destructive',
      });
      return;
    }

    if (selectedFile.size > MAX_STUDENT_MATERIAL_FILE_SIZE_BYTES) {
      toast({
        description: 'El PDF supera el limite de 20 MB. Reduce el archivo e intentalo nuevamente.',
        variant: 'destructive',
      });
      return;
    }

    if (
      !selectedFile.name.toLowerCase().endsWith('.pdf') ||
      (selectedFile.type && selectedFile.type !== 'application/pdf')
    ) {
      toast({
        description: 'Por ahora solo aceptamos archivos PDF.',
        variant: 'destructive',
      });
      return;
    }

    const file = selectedFile;
    const metadata = {
      title: title.trim(),
      description: description.trim(),
      universidadId,
      carreraId,
      materiaId,
      shareWithCatalog,
    };
    const fileMetadata = {
      name: file.name,
      mimeType: file.type || 'application/pdf',
      size: file.size,
    };

    const showUploadFailure = (message: string) => {
      if (isMaterialUploadQuotaMessage(message)) {
        trackMarketingEvent('limit_reached_material_upload', {
          materia_id: materiaId || undefined,
        });
        setShowPremiumUpsell(true);
        return;
      }

      toast({
        description: message,
        variant: 'destructive',
      });
    };

    startTransition(async () => {
      let preparedFilePath: string | null = null;

      try {
        const prepared = await prepareStudentMaterialUploadAction({
          metadata,
          file: fileMetadata,
        });

        if (!prepared.success || !prepared.filePath || !prepared.token) {
          showUploadFailure(prepared.message);
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
          await cancelStudentMaterialUploadAction(prepared.filePath);
          showUploadFailure('No pudimos transferir el PDF al almacenamiento. Intentá nuevamente.');
          return;
        }

        const result = await finalizeStudentMaterialUploadAction({
          metadata,
          file: fileMetadata,
          filePath: prepared.filePath,
        });

        if (!result.success) {
          await cancelStudentMaterialUploadAction(prepared.filePath);
          showUploadFailure(result.message);
          return;
        }

        toast({ description: result.message });

        if (result.materialId) {
          setActiveProcessing({
            materialId: result.materialId,
            title: metadata.title || file.name.replace(/\.pdf$/i, ''),
            fileName: file.name,
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
      } catch (error) {
        if (preparedFilePath) {
          await cancelStudentMaterialUploadAction(preparedFilePath).catch(() => undefined);
        }

        showUploadFailure(
          error instanceof Error
            ? error.message
            : 'No pudimos completar la subida del PDF. Intentá nuevamente.'
        );
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

  const handleDeleteMaterial = () => {
    if (!materialToDelete) {
      return;
    }

    const materialId = materialToDelete.id;
    startTransition(async () => {
      const result = await deleteStudentMaterialAction(materialId);

      toast({
        description: result.message,
        variant: result.success ? 'default' : 'destructive',
      });

      if (result.success) {
        setMaterialToDelete(null);
        router.refresh();
      }
    });
  };

  const materialsTourSteps: GuidedTourStep[] = [
    {
      title: 'Subí el PDF de tu materia',
      description:
        'Acá cargás el documento de tu curso. Completás título, alcance del material, universidad, carrera y materia.',
      target: { type: 'ref', ref: uploadHeroTourRef },
    },
    {
      title: 'La IA lo procesa por vos',
      description:
        'Cuando subís el PDF aparece en tu biblioteca con el estado "Procesando". En unos minutos queda listo, sin que hagas nada.',
      target: { type: 'ref', ref: libraryTourRef },
    },
    {
      title: 'Tu espacio de estudio',
      description:
        'Cuando el material está listo, tocá "Abrir": ahí vas a encontrar resumen, glosario, tarjetas, ejercicios y mapa mental para repasar.',
      target: initialMaterials[0]
        ? { type: 'ref', ref: materialEntryTourRef }
        : { type: 'ref', ref: libraryTourRef },
    },
  ];

  const closeMaterialsTour = useCallback(() => {
    materialsTourDismissedRef.current = true;
    setShowMaterialsTour(false);
    if (typeof window !== 'undefined' && user) {
      window.localStorage.setItem(getMaterialsTourStorageKey(user.id), 'done');
    }
  }, [user]);

  const handleMaterialsTourNext = useCallback(() => {
    if (materialsTourStepIndex >= materialsTourSteps.length - 1) {
      closeMaterialsTour();
      return;
    }
    setMaterialsTourStepIndex((current) => current + 1);
  }, [materialsTourStepIndex, materialsTourSteps.length, closeMaterialsTour]);

  const handleMaterialsTourPrevious = useCallback(() => {
    if (materialsTourStepIndex === 0) {
      return;
    }
    setMaterialsTourStepIndex((current) => current - 1);
  }, [materialsTourStepIndex]);

  useEffect(() => {
    if (typeof window === 'undefined' || !user || materialsTourDismissedRef.current) {
      return;
    }
    if (window.localStorage.getItem(getMaterialsTourStorageKey(user.id)) === 'done') {
      return;
    }
    const timeoutId = window.setTimeout(() => {
      setMaterialsTourStepIndex(0);
      setShowMaterialsTour(true);
    }, 400);
    return () => window.clearTimeout(timeoutId);
  }, [user]);

  return (
    <>
      <div className="min-w-0 space-y-4 overflow-x-clip">
        <section
          ref={uploadHeroTourRef}
          className="overflow-hidden rounded-[1.6rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(248,250,252,0.98)_100%)] p-4 shadow-[0_18px_50px_rgba(15,23,42,0.07)] sm:p-5"
        >
          <div className="text-center">
            <h1 className="text-[1.7rem] font-bold tracking-[-0.055em] text-slate-950 sm:text-[2.15rem]">
              Tu espacio de estudio
            </h1>
            <p className="mx-auto mt-2 max-w-md text-[13px] leading-5 text-slate-500">
              Subí tus materiales y convertilos en resúmenes, glosario, tarjetas y ejercicios con
              IA.
            </p>
            {isContributor ? (
              <div className="mx-auto mt-3 flex max-w-full flex-wrap items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 sm:inline-flex sm:rounded-full">
                <Globe className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-[12.5px] font-semibold text-emerald-700">
                  Colaborador de la comunidad
                </span>
                <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[11px] font-bold text-white">
                  {sharedMaterialsCount} {sharedMaterialsCount === 1 ? 'aporte' : 'aportes'}
                </span>
              </div>
            ) : null}
          </div>

          <div className="mt-6 grid gap-3 lg:grid-cols-[1.05fr_1fr]">
            <div className="relative order-2 overflow-hidden rounded-[1.35rem] border border-amber-200/70 bg-[linear-gradient(135deg,#FFF7ED_0%,#FFF1E6_52%,#FEF3C7_100%)] p-4 shadow-[0_16px_38px_rgba(245,158,11,0.09)] sm:p-[1.05rem] lg:order-1">
              <div className="absolute -right-8 -bottom-10 h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(251,191,36,0.28),transparent_72%)]" />
              <div className="relative flex h-full flex-col justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[1rem] bg-[#F59E0B] text-white shadow-[0_10px_24px_rgba(245,158,11,0.18)]">
                    <GraduationCap className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold tracking-[0.16em] text-amber-700/80 uppercase">
                      {getFeaturedMaterialLabel(featuredMaterial)}
                    </p>
                    <h2 className="mt-1.5 text-[1.3rem] font-bold tracking-[-0.05em] break-words text-slate-950 sm:text-[1.45rem]">
                      {featuredMaterial?.title ?? 'Tu primer material'}
                    </h2>
                    <p className="mt-1.5 text-[13px] leading-5 break-all text-slate-600">
                      {featuredMaterial
                        ? featuredMaterial.file_name
                        : 'Subí un documento y tendrás un espacio ordenado para estudiar, resumir y repasar.'}
                    </p>
                  </div>
                </div>

                <div className="relative flex flex-wrap items-center gap-2.5">
                  {featuredMaterial ? (
                    <>
                      <Button
                        asChild
                        className="bg-[#F59E0B] from-[#F59E0B] to-[#FB923C] text-white hover:opacity-95"
                      >
                        <Link href={getStudentMaterialRoute(featuredMaterial.id)}>
                          Continuar
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="border-amber-200 bg-white/70 backdrop-blur"
                      >
                        <Link
                          href={getMateriaRoute(
                            featuredMaterial.materia_id,
                            featuredMaterial.carrera_id
                          )}
                        >
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
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="border-amber-200 bg-white/70 backdrop-blur"
                      >
                        <Link
                          href={initialCarreraId ? getCareerRoute(initialCarreraId) : '/explorar'}
                        >
                          Ver materias
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="order-1 rounded-[1.35rem] border border-slate-200/80 bg-white p-4 shadow-[0_14px_34px_rgba(15,23,42,0.05)] sm:p-[1.05rem] lg:order-2">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[1rem] bg-[#EEF4FF] text-[#2563EB]">
                  <Files className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h2 className="text-[1.15rem] font-bold tracking-[-0.04em] text-slate-950">
                    Subí tu material del curso
                  </h2>
                  <p className="mt-1.5 text-[13px] leading-5 text-slate-500">
                    Mantendremos una estructura simple para que después puedas convertir cada PDF en
                    un espacio de estudio más completo.
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {STUDY_OUTPUTS.map((type) => (
                  <span
                    key={type}
                    className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[12px] font-semibold tracking-[0.14em] text-slate-500 uppercase"
                  >
                    {type}
                  </span>
                ))}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setIsUploadDialogOpen(true)}
                  className="group hover:border-primary/35 hover:bg-primary/5 focus-visible:ring-primary rounded-[1rem] border border-slate-200 bg-white p-3.5 text-left transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  <span className="bg-primary text-primary-foreground flex h-9 w-9 items-center justify-center rounded-xl shadow-sm">
                    <Upload className="h-4 w-4" />
                  </span>
                  <span className="text-primary mt-3 block text-[12px] font-semibold tracking-[0.14em] uppercase">
                    Tu material
                  </span>
                  <span className="mt-1 block text-sm font-semibold text-slate-950">
                    Subir un PDF
                  </span>
                  <span className="mt-1 block text-[12.5px] leading-5 text-slate-500">
                    Convertí tu apunte en un espacio de estudio.
                  </span>
                </button>

                <Link
                  href="/demo/material-estudio"
                  className="group focus-visible:ring-primary rounded-[1rem] border border-blue-200 bg-blue-50/70 p-3.5 text-left transition hover:border-blue-300 hover:bg-blue-50 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  <span className="text-primary flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm">
                    <BookOpenCheck className="h-4 w-4" />
                  </span>
                  <span className="text-primary mt-3 block text-[12px] font-semibold tracking-[0.14em] uppercase">
                    PDF de prueba
                  </span>
                  <span className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-950">
                    Ver cómo funciona
                    <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                  </span>
                  <span className="mt-1 block text-[12.5px] leading-5 text-slate-500">
                    Explorá el PDF ya procesado con resumen, glosario, flashcards y ejercicios.
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section
          ref={libraryTourRef}
          className="rounded-[1.6rem] border border-slate-200/80 bg-white p-4 shadow-[0_16px_46px_rgba(15,23,42,0.05)] sm:p-5"
        >
          <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[12px] font-semibold tracking-[0.18em] text-slate-500 uppercase">
                Biblioteca personal
              </p>
              <h2 className="mt-1.5 text-[1.25rem] font-bold tracking-[-0.05em] text-slate-950">
                Tus materiales
              </h2>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setIsUploadDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Nuevo material
            </Button>
          </div>

          <div className="mt-4 space-y-2.5">
            {initialMaterials.length === 0 ? (
              <div className="rounded-[1.25rem] border border-dashed border-slate-200 bg-white px-5 py-8 text-center">
                <FileText className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-3 text-sm font-semibold text-slate-900">
                  Todavía no subiste materiales
                </p>
                <p className="mt-1.5 text-[13px] leading-5 text-slate-500">
                  Cuando cargues tu primer PDF, aparecerá acá con su categoría y accesos rápidos.
                </p>
              </div>
            ) : (
              initialMaterials.map((material, index) => {
                const isShared = material.visibility === 'shared';

                return (
                  <article
                    key={material.id}
                    ref={index === 0 ? materialEntryTourRef : undefined}
                    onClick={() => router.push(getStudentMaterialRoute(material.id))}
                    className="flex cursor-pointer flex-col gap-3 rounded-[1.25rem] border border-slate-200 bg-[linear-gradient(180deg,#FFFFFF_0%,#FAFBFF_100%)] px-3.5 py-3.5 transition hover:border-slate-300 hover:shadow-[0_10px_28px_rgba(15,23,42,0.06)] sm:px-4"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-[15px] font-semibold tracking-[-0.03em] text-slate-950">
                            {material.title}
                          </h3>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-semibold ${
                              isShared
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-white text-slate-600'
                            }`}
                          >
                            {isShared ? (
                              <Globe className="h-3.5 w-3.5" />
                            ) : (
                              <Lock className="h-3.5 w-3.5" />
                            )}
                            {isShared ? 'Compartido' : 'Privado'}
                          </span>
                          {material.processing_status !== 'ready' ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[12px] font-semibold text-amber-700">
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Procesando
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1.5 text-[13px] break-all text-slate-500">
                          {material.file_name}
                        </p>
                        <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1.5 text-[12px] font-medium text-slate-500">
                          <span>
                            {universityNameById.get(material.universidad_id) ?? 'Universidad'}
                          </span>
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
                          onClick={(event) => {
                            event.stopPropagation();
                            handleVisibilityChange(material.id, isShared ? 'private' : 'shared');
                          }}
                          disabled={isPending}
                        >
                          {isShared ? <Lock className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                          {isShared ? 'Ocultar' : 'Compartir'}
                        </Button>
                        <Button asChild size="sm" onClick={(event) => event.stopPropagation()}>
                          <Link href={getStudentMaterialRoute(material.id)}>
                            <Eye className="h-4 w-4" />
                            {material.processing_status === 'ready' ? 'Abrir' : 'Ver estado'}
                          </Link>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-slate-400 hover:bg-red-50 hover:text-red-600"
                          onClick={(event) => {
                            event.stopPropagation();
                            setMaterialToDelete(material);
                          }}
                          disabled={isPending}
                          aria-label={`Eliminar ${material.title}`}
                        >
                          <Trash2 className="h-4 w-4" />
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
                Subí tu material
              </DialogTitle>
              <DialogDescription className="mt-1.5 text-[13px] leading-5 text-slate-500">
                Completá la estructura base del documento antes de cargarlo. Después podremos
                trabajar el resumen y el espacio de estudio sobre este mismo PDF.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="grid gap-3 px-4 py-4 sm:grid-cols-2 sm:px-5">
            <div className="sm:col-span-2">
              <label
                htmlFor="material-title"
                className="mb-1.5 block text-[12px] font-semibold tracking-[0.16em] text-slate-500 uppercase"
              >
                Título
              </label>
              <Input
                id="material-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={180}
                placeholder="Ej. Resumen completo para el primer parcial"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="material-description"
                className="mb-1.5 block text-[12px] font-semibold tracking-[0.16em] text-slate-500 uppercase"
              >
                Descripción breve
              </label>
              <Textarea
                id="material-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={240}
                rows={3}
                placeholder="Ej. Parcial 1 · Módulos 1 al 4 · incluye obligaciones y contratos"
              />
              <div className="mt-1.5 flex items-center justify-between gap-3 text-[11.5px] text-slate-500">
                <span>Indicá a qué parcial, módulos o temas corresponde. Es obligatorio.</span>
                <span>{description.length}/240</span>
              </div>
            </div>

            {hasAcademicProfile ? (
              <div className="rounded-[1rem] border border-blue-100 bg-blue-50/70 px-4 py-3 sm:col-span-2">
                <p className="text-[12px] font-semibold tracking-[0.16em] text-blue-700 uppercase">
                  Tu contexto académico
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {universityNameById.get(universidadId) ?? 'Tu universidad'}
                </p>
                <p className="mt-0.5 text-[13px] text-slate-600">
                  {careerNameById.get(carreraId) ?? 'Tu carrera'}
                </p>
              </div>
            ) : (
              <>
                <div>
                  <label
                    htmlFor="material-universidad"
                    className="mb-1.5 block text-[12px] font-semibold tracking-[0.16em] text-slate-500 uppercase"
                  >
                    Universidad
                  </label>
                  <select
                    id="material-universidad"
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
                  <label
                    htmlFor="material-carrera"
                    className="mb-1.5 block text-[12px] font-semibold tracking-[0.16em] text-slate-500 uppercase"
                  >
                    Carrera
                  </label>
                  <select
                    id="material-carrera"
                    value={carreraId}
                    onChange={(event) => {
                      setCarreraId(event.target.value);
                      setMateriaId('');
                    }}
                    disabled={!universidadId}
                    className="h-10 w-full rounded-[1rem] border border-slate-200 bg-white px-3 text-[13px] text-slate-700 outline-none disabled:bg-white"
                  >
                    <option value="">Seleccionar carrera</option>
                    {filteredCarreras.map((carrera) => (
                      <option key={carrera.id} value={carrera.id}>
                        {carrera.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div className="sm:col-span-2">
              <label
                htmlFor="material-materia"
                className="mb-1.5 block text-[12px] font-semibold tracking-[0.16em] text-slate-500 uppercase"
              >
                Materia
              </label>
              <select
                id="material-materia"
                value={materiaId}
                onChange={(event) => setMateriaId(event.target.value)}
                disabled={!carreraId}
                className="h-10 w-full rounded-[1rem] border border-slate-200 bg-white px-3 text-[13px] text-slate-700 outline-none disabled:bg-white"
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
              <label
                htmlFor="material-file"
                className="mb-1.5 block text-[12px] font-semibold tracking-[0.16em] text-slate-500 uppercase"
              >
                Archivo PDF
              </label>
              <Input
                id="material-file"
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
              <label className="flex items-start gap-3 rounded-[1rem] border border-slate-200 bg-white px-3.5 py-3 text-[13px] text-slate-700">
                <input
                  type="checkbox"
                  checked={shareWithCatalog}
                  onChange={(event) => setShareWithCatalog(event.target.checked)}
                  className="mt-1"
                />
                <span>
                  Compartir públicamente en esta materia y carrera. Otros alumnos podrán abrir el
                  documento y su contenido procesado. Dejalo desmarcado para mantenerlo privado.
                </span>
              </label>
              {shareWithCatalog ? (
                <p className="mt-2 rounded-[1rem] border border-amber-200 bg-amber-50/70 px-3.5 py-2.5 text-[12px] leading-5 text-amber-800">
                  Al compartir declarás que tenés derecho a publicar este material (es tuyo, de tu
                  cátedra con autorización, o de dominio público) y que no infringe derechos de
                  terceros. Si no estás seguro, mantenelo privado.
                </p>
              ) : null}
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
              disabled={
                isPending ||
                !title.trim() ||
                description.trim().length < 3 ||
                !universidadId ||
                !carreraId ||
                !materiaId ||
                !selectedFile
              }
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
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
                      {activeProcessing.status === 'failed'
                        ? 'No pudimos terminar el PDF'
                        : 'Estamos preparando tu material'}
                    </DialogTitle>
                    <DialogDescription className="mt-1.5 text-[13px] leading-5 text-slate-600">
                      {activeProcessing.fileName}
                    </DialogDescription>
                  </div>
                </div>
              </div>

              <div className="space-y-5 px-5 py-5 sm:px-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[12px] font-semibold tracking-[0.16em] text-slate-500 uppercase">
                    <span>Progreso</span>
                    <span>
                      {Math.min(100, Math.max(displayProgress, activeProcessing.progress))}%
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-white">
                    <div
                      className={`h-full rounded-full transition-[width] duration-500 ${
                        activeProcessing.status === 'failed'
                          ? 'bg-red-400'
                          : 'bg-[linear-gradient(90deg,#F59E0B_0%,#FB923C_45%,#2563EB_100%)]'
                      }`}
                      style={{
                        width: `${Math.min(100, Math.max(displayProgress, activeProcessing.progress))}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="grid gap-2 rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3">
                  {[
                    ['uploaded', 'PDF subido'],
                    ['extracting', 'Extrayendo texto y paginas'],
                    ['summarizing', 'Generando resumen'],
                    ['glossary', 'Generando glosario'],
                    ['ready', 'Material listo'],
                  ].map(([stageId, label]) => {
                    const isActive = activeProcessing.stage === stageId;
                    const isDone =
                      ['uploaded', 'extracting', 'summarizing', 'glossary', 'ready'].indexOf(
                        activeProcessing.stage
                      ) >
                      ['uploaded', 'extracting', 'summarizing', 'glossary', 'ready'].indexOf(
                        stageId
                      );

                    return (
                      <div
                        key={stageId}
                        className="flex items-center justify-between gap-3 text-[13px]"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${
                              isDone ? 'bg-emerald-500' : isActive ? 'bg-[#F59E0B]' : 'bg-slate-300'
                            }`}
                          />
                          <span
                            className={isActive ? 'font-semibold text-slate-950' : 'text-slate-600'}
                          >
                            {label}
                          </span>
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
                    {activeProcessing.status === 'failed'
                      ? 'Se interrumpió el procesamiento'
                      : activeProcessing.message}
                  </p>
                  <p className="mt-1.5 text-[12.5px] leading-5 text-slate-500">
                    {activeProcessing.status === 'failed'
                      ? (activeProcessing.error ?? 'No recibimos más detalle del error.')
                      : 'Podés dejar esta ventana abierta mientras armamos el resumen y el glosario del PDF.'}
                  </p>
                </div>

                {activeProcessing.status === 'failed' ? (
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveProcessing(null)}
                    >
                      Cerrar
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(materialToDelete)}
        onOpenChange={(open) => !open && setMaterialToDelete(null)}
      >
        <DialogContent className="w-[min(calc(100vw-1.5rem),440px)] rounded-[1.5rem] border-slate-200 bg-white p-0 text-slate-900 shadow-[0_24px_70px_rgba(15,23,42,0.16)]">
          <div className="px-5 py-5 sm:px-6">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] bg-red-50 text-red-600">
                <Trash2 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-[1.15rem] font-bold tracking-[-0.05em] text-slate-950">
                  ¿Eliminar este material?
                </DialogTitle>
                <DialogDescription className="mt-1.5 text-[13px] leading-5 text-slate-600">
                  Se borrará el PDF y todo su espacio de estudio (resumen, glosario, tarjetas y
                  ejercicios). Esta acción no se puede deshacer.
                </DialogDescription>
              </div>
            </div>

            {materialToDelete ? (
              <div className="mt-4 rounded-[1rem] border border-slate-200 bg-white px-3.5 py-3">
                <p className="text-sm font-semibold break-words text-slate-950">
                  {materialToDelete.title}
                </p>
                <p className="mt-0.5 text-[12.5px] break-all text-slate-500">
                  {materialToDelete.file_name}
                </p>
              </div>
            ) : null}

            <DialogFooter className="mt-5 gap-2 sm:justify-end">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setMaterialToDelete(null)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={handleDeleteMaterial}
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Eliminar
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPremiumUpsell} onOpenChange={setShowPremiumUpsell}>
        <DialogContent className="w-[min(calc(100vw-1.5rem),420px)] rounded-[24px] border border-slate-200 bg-white p-0 text-slate-900 shadow-[0_24px_70px_rgba(15,23,42,0.16)]">
          <div className="px-4 py-4 sm:px-5 sm:py-5">
            <PremiumUpsell
              title="Convertí tu próximo apunte en un plan de estudio"
              description="Ya usaste la generación gratuita. Con Premium podés subir este material, detectar los temas clave y practicar antes del parcial."
              source="materiales_upload_limit"
              features={[
                'Hasta 3 materiales por día',
                'Resúmenes y glosarios automáticos',
                'Repaso con IA sobre tus apuntes',
              ]}
              ctaLabel="Estudiar este material con Premium"
            />
          </div>
        </DialogContent>
      </Dialog>

      <GuidedTour
        open={showMaterialsTour}
        stepIndex={materialsTourStepIndex}
        steps={materialsTourSteps}
        onNext={handleMaterialsTourNext}
        onPrevious={handleMaterialsTourPrevious}
        onClose={closeMaterialsTour}
        ariaLabel="Guía de Mi espacio"
      />
    </>
  );
}
