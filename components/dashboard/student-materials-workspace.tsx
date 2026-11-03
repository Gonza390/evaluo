'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  CircleAlert,
  FileText,
  Globe,
  Loader2,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { deleteStudentMaterialAction } from '@/app/dashboard/materiales/actions';
import type { StudentMaterial } from '@/lib/data/student-materials';
import { getStudentMaterialRoute } from '@/lib/routes';
import { Button } from '@/components/ui/button';
import { AppPageHeader } from '@/components/ui/app-page-header';
import { StudyStatePanel } from '@/components/study-state-panel';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { usePdfUploadTrigger } from '@/components/dashboard/pdf-first-upload-shell';

interface StudentMaterialsWorkspaceProps {
  initialMaterials: StudentMaterial[];
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
 * Upload creation is owned by PdfFirstUploadShell; each CTA invokes its
 * explicit action rather than relying on the button's visible text.
 */
export function StudentMaterialsWorkspace({
  initialMaterials,
}: StudentMaterialsWorkspaceProps) {
  const router = useRouter();
  const { toast } = useToast();
  const openUploadPicker = usePdfUploadTrigger();
  const [isPending, startTransition] = useTransition();
  const [materialToDelete, setMaterialToDelete] = useState<StudentMaterial | null>(null);
  const [materialQuery, setMaterialQuery] = useState('');
  const normalizedQuery = materialQuery
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es-AR')
    .trim();
  const visibleMaterials = normalizedQuery
    ? initialMaterials.filter((material) =>
        material.title
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLocaleLowerCase('es-AR')
          .includes(normalizedQuery)
      )
    : initialMaterials;

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
      <section className="rounded-[1.25rem] border border-slate-200/80 bg-white p-3.5 shadow-[0_8px_22px_rgba(15,23,42,0.03)] sm:p-4">
        <AppPageHeader
          as="h2"
          size="compact"
          className="gap-3 pb-3 sm:pb-3 [&_h2]:text-[19px] sm:[&_h2]:text-[20px] [&_h2]:tracking-[-0.04em]"
          eyebrow="Tu estudio"
          title="Tus PDFs"
          visuallyHiddenTitle
          description={
            initialMaterials.length === 0
              ? 'Subí tu primer material y empezá a estudiar desde la misma fuente.'
              : `${initialMaterials.length} ${initialMaterials.length === 1 ? 'material disponible' : 'materiales disponibles'} para retomar cuando quieras.`
          }
        />

        {initialMaterials.length >= 3 ? (
          <div data-desktop-material-search className="mt-4 hidden items-center justify-between gap-4 lg:flex">
            <div className="relative w-full max-w-[360px]">
              <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                aria-label="Buscar entre tus PDFs"
                value={materialQuery}
                onChange={(event) => setMaterialQuery(event.target.value)}
                placeholder="Buscar un PDF..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-white py-2 pr-10 pl-10 text-[13px] text-slate-900 shadow-sm outline-none transition-colors placeholder:text-slate-400 hover:border-slate-300 focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/15"
              />
              {materialQuery ? (
                <button
                  type="button"
                  aria-label="Limpiar búsqueda"
                  onClick={() => setMaterialQuery('')}
                  className="absolute top-1/2 right-2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              ) : null}
            </div>
            <span className="shrink-0 text-[12px] font-medium text-slate-500" aria-live="polite">
              {visibleMaterials.length} de {initialMaterials.length} PDFs
            </span>
          </div>
        ) : null}

        <div className={`mt-3 ${initialMaterials.length >= 2 ? 'grid gap-3 xl:grid-cols-2' : 'space-y-2'}`}>
          {initialMaterials.length === 0 ? (
            <StudyStatePanel
              icon={FileText}
              eyebrow="Primer material"
              title="Todavía no subiste un PDF"
              description="Cuando subas tu primer PDF, vas a poder resumirlo, practicar y volver a estudiarlo directamente desde acá."
              primaryActionLabel="Subí tu PDF"
              onPrimaryAction={() => openUploadPicker('dashboard_empty_materials')}
              secondaryActionLabel="Ver cómo funciona con un PDF de ejemplo"
              secondaryActionHref="/preview/primer-pdf?source=dashboard_empty"
              className="border-dashed"
            />
          ) : visibleMaterials.length === 0 ? (
            <div className="col-span-full flex flex-col items-start gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-6">
              <p className="text-[13px] font-semibold text-slate-900">No encontramos PDFs con ese nombre.</p>
              <p className="text-[12px] text-slate-600">Probá con otra palabra o volvé a mostrar todos tus materiales.</p>
              <button
                type="button"
                onClick={() => setMaterialQuery('')}
                className="text-brand mt-1 min-h-9 rounded-lg px-1 text-[12.5px] font-semibold hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Mostrar todos
              </button>
            </div>
          ) : (
            visibleMaterials.map((material) => {
              const isShared = material.visibility === 'shared';
              const isFailed = material.processing_status === 'failed';

              return (
                <article
                  data-evaluo-motion-card
                  key={material.id}
                  className="relative flex h-full flex-col gap-2 rounded-xl border border-slate-200 bg-[linear-gradient(180deg,#FFFFFF_0%,#FAFBFF_100%)] px-3 py-3 transition hover:border-slate-300 hover:shadow-[0_6px_18px_rgba(15,23,42,0.05)] sm:px-3.5"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between xl:flex-col xl:items-stretch xl:justify-start">
                    <div className="flex min-w-0 items-center gap-3">
                      <div aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <FileText className="h-5 w-5" strokeWidth={1.8} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-[13.5px] font-semibold leading-5 tracking-[-0.025em] text-slate-950">
                          <Link
                            href={getStudentMaterialRoute(material.id)}
                            className="rounded-sm before:absolute before:inset-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                            aria-label={`Abrir material ${material.title}`}
                          >
                            {material.title}
                          </Link>
                        </h3>
                        {isShared ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                            <Globe className="h-3.5 w-3.5" />
                            Compartido
                          </span>
                        ) : null}
                        {isFailed ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                            <CircleAlert className="h-3.5 w-3.5" />
                            Necesita revisión
                          </span>
                        ) : material.processing_status !== 'ready' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Procesando
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-medium text-slate-500">
                        <span>{formatDate(material.created_at)}</span>
                        {material.page_count ? <span>{material.page_count} páginas</span> : null}
                      </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMaterialToDelete(material)}
                      disabled={isPending}
                      aria-label={`Eliminar material ${material.title}`}
                      title="Eliminar PDF"
                      className="relative z-10 inline-flex h-10 w-10 shrink-0 items-center justify-center self-end rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 sm:self-center xl:self-end"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
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
                  Se borrará el PDF y todo su espacio de estudio (resumen, glosario, flashcards y
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
