'use client';

import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  CircleAlert,
  Eye,
  FileText,
  Globe,
  Loader2,
  Lock,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  deleteStudentMaterialAction,
  updateStudentMaterialVisibilityAction,
} from '@/app/dashboard/materiales/actions';
import type { StudentMaterial } from '@/lib/data/student-materials';
import { getStudentMaterialRoute } from '@/lib/routes';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

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

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Personal study materials.
 * Upload creation is owned by PdfFirstUploadShell, which wraps every current consumer
 * and captures the "Subí tu PDF" trigger below.
 */
export function StudentMaterialsWorkspace({
  initialMaterials,
  universidades,
  carreras,
  materias,
}: StudentMaterialsWorkspaceProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [materialToDelete, setMaterialToDelete] = useState<StudentMaterial | null>(null);

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

  return (
    <>
      <section className="rounded-[1.6rem] border border-slate-200/80 bg-white p-4 shadow-[0_16px_46px_rgba(15,23,42,0.05)] sm:p-5">
        <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[12px] font-semibold tracking-[0.18em] text-slate-500 uppercase">
              Tu estudio
            </p>
            <h2 className="mt-1.5 text-[1.25rem] font-bold tracking-[-0.05em] text-slate-950">
              Tus PDFs
            </h2>
          </div>
          <Button type="button" size="sm" variant="outline">
            <Upload className="h-4 w-4" />
            Subí tu PDF
          </Button>
        </div>

        <div className="mt-4 space-y-2.5">
          {initialMaterials.length === 0 ? (
            <div className="rounded-[1.25rem] border border-dashed border-slate-200 bg-white px-5 py-8 text-center">
              <FileText className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-slate-900">
                Todavía no subiste un PDF
              </p>
              <p className="mt-1.5 text-[13px] leading-5 text-slate-500">
                Cuando subas tu primer PDF, vas a poder empezar a estudiar directamente desde acá.
              </p>
              <Button type="button" size="sm" className="mt-4">
                <Upload className="h-4 w-4" />
                Subí tu PDF
              </Button>
            </div>
          ) : (
            initialMaterials.map((material) => {
              const isShared = material.visibility === 'shared';
              const isFailed = material.processing_status === 'failed';

              return (
                <article
                  key={material.id}
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
                        {isFailed ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[12px] font-semibold text-red-700">
                            <CircleAlert className="h-3.5 w-3.5" />
                            Necesita revisión
                          </span>
                        ) : material.processing_status !== 'ready' ? (
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
                        <span>{universityNameById.get(material.universidad_id) ?? 'Universidad'}</span>
                        <span>{careerNameById.get(material.carrera_id) ?? 'Carrera'}</span>
                        <span>{materiaNameById.get(material.materia_id) ?? 'Materia'}</span>
                        <span>{formatDate(material.created_at)}</span>
                        {material.page_count ? <span>{material.page_count} páginas</span> : null}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button asChild size="sm" onClick={(event) => event.stopPropagation()}>
                        <Link href={getStudentMaterialRoute(material.id)}>
                          <Eye className="h-4 w-4" />
                          {material.processing_status === 'ready'
                            ? 'Continuar estudiando'
                            : isFailed
                              ? 'Revisar'
                              : 'Ver estado'}
                        </Link>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-slate-500"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleVisibilityChange(material.id, isShared ? 'private' : 'shared');
                        }}
                        disabled={isPending}
                      >
                        {isShared ? <Lock className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                        {isShared ? 'Dejar de compartir' : 'Compartir'}
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
                  práctica). Esta acción no se puede deshacer.
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
    </>
  );
}
