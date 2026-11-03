'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  CircleAlert,
  BookOpen,
  BookText,
  ChartNoAxesColumnIncreasing,
  FileText,
  Layers3,
  Network,
  ArrowRight,
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
  const [selectedMaterialId, setSelectedMaterialId] = useState(
    initialMaterials.find((material) => material.processing_status === 'ready')?.id ??
      initialMaterials[0]?.id ?? ''
  );
  const selectedMaterial =
    initialMaterials.find((material) => material.id === selectedMaterialId) ??
    initialMaterials.find((material) => material.processing_status === 'ready') ??
    initialMaterials[0];
  const materialReady = selectedMaterial?.processing_status === 'ready';
  const studyTools = [
    { id: 'resumen', label: 'Resumen', description: 'Repasá lo esencial.', Icon: BookOpen, color: 'bg-[#E8F1FF] text-[#3068B3]' },
    { id: 'tarjetas', label: 'Flashcards', description: 'Memorizá con tarjetas.', Icon: Layers3, color: 'bg-[#F0EAFE] text-[#7956C8]' },
    { id: 'glosario', label: 'Glosario', description: 'Entendé los conceptos.', Icon: BookText, color: 'bg-[#E1F2F7] text-[#378CA6]' },
    { id: 'mapa', label: 'Mapa mental', description: 'Conectá las ideas.', Icon: Network, color: 'bg-[#E7F4ED] text-[#34866B]' },
    { id: 'progreso', label: 'Progreso', description: 'Revisá tu aprendizaje.', Icon: ChartNoAxesColumnIncreasing, color: 'bg-[#FFF1E5] text-[#C37535]' },
  ] as const;
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
      <section data-dashboard-study-dual-pane className="mx-auto w-full max-w-[1190px] px-0 pb-4 pt-2 sm:pt-3">
        <div className="mb-5">
          <h2 className="text-[25px] font-semibold tracking-[-0.045em] text-[#0F1B3D] sm:text-[27px]">
            Tus materiales
          </h2>
          <p className="mt-1 text-[12px] text-[#66758D]">
            Seleccioná un material y elegí cómo querés estudiarlo.
          </p>
        </div>

        <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1.22fr)_minmax(310px,0.86fr)] lg:gap-6 xl:gap-9">
          <section aria-label="Herramientas de estudio" className="order-2 min-w-0 lg:order-1">
            <div className="mb-3">
              <h3 className="text-[16px] font-semibold tracking-tight text-[#0F1B3D]">Herramientas de estudio</h3>
              <p className="mt-1 line-clamp-2 text-[12px] text-[#66758D]">
                {selectedMaterial ? `Herramientas para ${selectedMaterial.title}` : 'Elegí un material para empezar.'}
              </p>
            </div>
            <div data-dashboard-study-tools className="grid grid-cols-2 gap-3">
              {studyTools.map(({ id, label, description, Icon, color }) => {
                const content = (
                  <>
                    <Icon aria-hidden="true" className="h-[19px] w-[19px]" strokeWidth={1.8} />
                    <span className="mt-auto pt-5 text-[15px] font-semibold leading-5">{label}</span>
                    <span className="mt-1 text-[12px] leading-[1.45] opacity-85">{description}</span>
                    <span className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold">
                      Abrir <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
                    </span>
                  </>
                );
                const styles = `flex min-h-[151px] min-w-0 flex-col items-start rounded-2xl p-4 text-left transition sm:min-h-[164px] ${color} ${id === 'progreso' ? 'col-span-2 sm:col-span-1' : ''}`;
                return materialReady && selectedMaterial ? (
                  <Link
                    key={id}
                    href={`${getStudentMaterialRoute(selectedMaterial.id)}?tab=${id}`}
                    className={styles + ' hover:brightness-[0.985] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]'}
                    aria-label={`Abrir ${label} de ${selectedMaterial.title}`}
                  >
                    {content}
                  </Link>
                ) : (
                  <div key={id} aria-disabled="true" className={`${styles} cursor-not-allowed opacity-55`}>
                    {content}
                  </div>
                );
              })}
            </div>
            {!materialReady && selectedMaterial ? (
              <p className="mt-3 text-[12px] text-[#66758D]" role="status">
                Las herramientas estarán disponibles cuando termine de procesarse el material.
              </p>
            ) : null}
          </section>

          <section aria-label="Seleccionar material de estudio" className="order-1 min-w-0 lg:order-2">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <h3 className="text-[16px] font-semibold tracking-tight text-[#0F1B3D]">Mis materiales</h3>
                <p className="mt-1 text-[12px] text-[#66758D]">
                  {initialMaterials.length} {initialMaterials.length === 1 ? 'material' : 'materiales'} disponibles
                </p>
              </div>
              <button
                type="button"
                onClick={() => openUploadPicker('dashboard_materials')}
                className="min-h-10 shrink-0 rounded-lg px-2 text-[12px] font-semibold text-[#2563EB] hover:bg-[#EEF2FF]"
              >
                Subir mi material
              </button>
            </div>

            {initialMaterials.length >= 3 ? (
              <div data-desktop-material-search className="relative mb-3">
                <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input type="search" aria-label="Buscar entre tus materiales" value={materialQuery}
                  onChange={(event) => setMaterialQuery(event.target.value)}
                  placeholder="Buscar un material..."
                  className="h-10 w-full rounded-xl border border-[#E7EBF4] bg-white py-2 pl-10 pr-10 text-[13px] text-[#0F1B3D] outline-none focus-visible:border-[#2563EB] focus-visible:ring-2 focus-visible:ring-[#2563EB]/15"
                />
                {materialQuery && (
                  <button type="button" aria-label="Limpiar búsqueda" onClick={() => setMaterialQuery('')}
                    className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100">
                    <X className="size-4" />
                  </button>
                )}
              </div>
            ) : null}

            <div data-dashboard-material-picker className="flex flex-col gap-2.5 lg:max-h-[520px] lg:overflow-y-auto lg:pr-1">
              {visibleMaterials.length === 0 && initialMaterials.length > 0 ? (
                <div className="rounded-xl border border-dashed border-[#E7EBF4] px-4 py-5 text-[12px] text-[#66758D]">
                  No encontramos materiales con ese nombre.
                  <button type="button" onClick={() => setMaterialQuery('')} className="ml-2 font-semibold text-[#2563EB]">Mostrar todos</button>
                </div>
              ) : null}
              {initialMaterials.length === 0 ? (
                <StudyStatePanel icon={FileText} eyebrow="Primer material" title="Todavía no subiste un material"
                  description="Subí tu primer material para acceder a las herramientas de estudio."
                  primaryActionLabel="Subir mi material"
                  onPrimaryAction={() => openUploadPicker('dashboard_empty_materials')}
                  className="border-dashed" />
              ) : visibleMaterials.map((material) => {
                const selected = material.id === selectedMaterial?.id;
                const isShared = material.visibility === 'shared';
                const isFailed = material.processing_status === 'failed';
                return (
                  <article key={material.id} data-evaluo-motion-card data-dashboard-material-option={material.id}
                    className={`flex min-w-0 items-center gap-2 rounded-2xl border bg-white p-2.5 transition-colors ${selected ? 'border-[#2563EB] bg-[#F7FAFF] ring-1 ring-[#DBE8FF]' : 'border-[#E7EBF4] hover:border-[#B9CAEC]'}`}>
                    <button type="button" onClick={() => setSelectedMaterialId(material.id)}
                      aria-pressed={selected}
                      aria-label={`Seleccionar ${material.title} para estudiar`}
                      className="flex min-w-0 flex-1 items-center gap-3 rounded-lg p-1.5 text-left focus-visible:outline-2 focus-visible:outline-[#2563EB]">
                      <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#2563EB]">
                        <FileText className="size-5" strokeWidth={1.8}/>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block break-words text-[13px] font-semibold leading-5 text-[#0F1B3D]">{material.title}</span>
                        <span className="mt-1 block text-[11px] text-[#66758D]">
                          {formatDate(material.created_at)}
                          {material.page_count ? ` · ${material.page_count} páginas` : ''}
                        </span>
                        {isShared ? <span className="mt-1 inline-flex items-center gap-1 text-[10px] text-emerald-700"><Globe className="size-3"/> Compartido</span> : null}
                        {isFailed ? <span className="mt-1 inline-flex items-center gap-1 text-[10px] text-red-700"><CircleAlert className="size-3"/> Necesita revisión</span> : null}
                        {!isFailed && material.processing_status !== 'ready' ? <span className="mt-1 inline-flex items-center gap-1 text-[10px] text-amber-700"><Loader2 className="size-3 animate-spin"/> Procesando</span> : null}
                      </span>
                    </button>
                    <div className="flex shrink-0 flex-col items-center gap-1">
                      <Link href={getStudentMaterialRoute(material.id)}
                        aria-label={`Abrir material ${material.title}`}
                        className="inline-flex size-9 items-center justify-center rounded-lg text-[#2563EB] hover:bg-[#EEF2FF] focus-visible:outline-2 focus-visible:outline-[#2563EB]">
                        <ArrowRight className="size-4" />
                      </Link>
                      <button type="button" onClick={() => setMaterialToDelete(material)} disabled={isPending}
                        aria-label={`Eliminar material ${material.title}`} title="Eliminar material"
                        className="inline-flex size-9 items-center justify-center rounded-lg text-[#9BA6BC] hover:bg-red-50 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-[#2563EB] disabled:opacity-50">
                        <Trash2 className="size-4"/>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
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
