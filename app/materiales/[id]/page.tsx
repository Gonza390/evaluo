import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FileText } from 'lucide-react';
import { MaterialStudyWorkspace } from '@/components/material-study-workspace';
import { resolveAdminActor } from '@/lib/access-control';
import { createAdminClient } from '@/lib/supabase-admin';
import { getMateriaRoute } from '@/lib/routes';
import { isUuid } from '@/lib/uuid';
import {
  ensureStudentMaterialStudyArtifacts,
} from '@/lib/student-material-summary';
import { createClientServer } from '@/lib/supabase-server';

type PageProps = {
  params: Promise<{ id: string }>;
};

function normalizeMaterialVisibility(value: string | null | undefined): 'private' | 'shared' {
  return value === 'private' ? 'private' : 'shared';
}

function isMissingStudentMaterialsTableError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const code = 'code' in error ? String(error.code ?? '') : '';
  const message = 'message' in error ? String(error.message ?? '') : '';

  return code === '42P01' || message.toLowerCase().includes('student_materials');
}

export default async function StudentMaterialViewerPage({ params }: PageProps) {
  const { id } = await params;

  if (!isUuid(id)) {
    notFound();
  }

  const supabase = await createClientServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  try {
    const { data: material, error } = await supabase
      .from('student_materials')
      .select(
        'id, user_id, universidad_id, carrera_id, materia_id, title, file_name, file_path, page_count, visibility, created_at, processing_status, processing_stage, processing_progress, processing_message, processing_error'
      )
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!material) {
      notFound();
    }

    const admin = createAdminClient();
    const [{ data: carrera }, { data: universidad }, { data: materia }, signedUrlResult] =
      await Promise.all([
        admin.from('carreras').select('nombre').eq('id', material.carrera_id).maybeSingle(),
        admin.from('universidades').select('nombre').eq('id', material.universidad_id).maybeSingle(),
        admin.from('materias').select('nombre').eq('id', material.materia_id).maybeSingle(),
        admin.storage.from('biblioteca').createSignedUrl(material.file_path, 60 * 15),
      ]);

    const viewerUrl = signedUrlResult.data?.signedUrl;
    if (!viewerUrl || signedUrlResult.error) {
      notFound();
    }

    const isOwner = user?.id === material.user_id;
    const canRegenerate = await resolveAdminActor(user);

    if (material.processing_status !== 'ready') {
      return (
        <main className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center px-4 py-12">
          <div className="surface-panel flex w-full flex-col gap-4 border-slate-200 bg-white px-6 py-8 sm:px-8">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#EEF4FF] text-[#2563EB]">
              <FileText className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-lg font-semibold tracking-[-0.03em] text-slate-950">
                {material.processing_status === 'failed' ? 'Este material tuvo un error' : 'Estamos preparando este material'}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {material.processing_status === 'failed'
                  ? material.processing_error ?? 'No pudimos generar el espacio de estudio del PDF.'
                  : material.processing_message ?? 'Seguimos generando el resumen y el glosario del documento.'}
              </p>
              <p className="mt-3 text-xs leading-5 text-slate-400">
                Progreso actual: {material.processing_progress ?? 0}%.
              </p>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${
                  material.processing_status === 'failed'
                    ? 'bg-red-400'
                    : 'bg-[linear-gradient(90deg,#F59E0B_0%,#FB923C_45%,#2563EB_100%)]'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, material.processing_progress ?? 0))}%` }}
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard/materiales"
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#6366F1] px-5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(37,99,235,0.18)] transition hover:from-[#1D4ED8] hover:to-[#4F46E5]"
              >
                Volver a materiales
              </Link>
              <Link
                href={isOwner ? '/dashboard/materiales' : getMateriaRoute(material.materia_id, material.carrera_id)}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Actualizar luego
              </Link>
            </div>
          </div>
        </main>
      );
    }

    const { studySummary, studyGlossary } = await ensureStudentMaterialStudyArtifacts({
      admin,
      studentMaterialId: material.id,
      filePath: material.file_path,
      title: material.title,
      universidadName: universidad?.nombre ?? undefined,
      carreraName: carrera?.nombre ?? undefined,
      materiaName: materia?.nombre ?? undefined,
      allowOnDemandRegeneration: false,
    });

    if (studySummary.status !== 'ready') {
      return (
        <main className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center px-4 py-12">
          <div className="surface-panel flex w-full flex-col gap-4 border-slate-200 bg-white px-6 py-8 sm:px-8">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#EEF4FF] text-[#2563EB]">
              <FileText className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-lg font-semibold tracking-[-0.03em] text-slate-950">
                Estamos sincronizando el material
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                El PDF ya figura como listo, pero todavía no encontramos todos los artefactos persistidos.
                En breve debería aparecer el resumen y el glosario sin reprocesar desde esta vista.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href={isOwner ? '/dashboard/materiales' : getMateriaRoute(material.materia_id, material.carrera_id)}
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#6366F1] px-5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(37,99,235,0.18)] transition hover:from-[#1D4ED8] hover:to-[#4F46E5]"
              >
                Volver
              </Link>
            </div>
          </div>
        </main>
      );
    }

    return (
      <MaterialStudyWorkspace
        backHref={isOwner ? '/dashboard/materiales' : getMateriaRoute(material.materia_id, material.carrera_id)}
        canRegenerate={canRegenerate}
        carreraName={carrera?.nombre ?? 'Carrera'}
        fileName={material.file_name}
        materialId={material.id}
        isOwner={isOwner}
        materiaName={materia?.nombre ?? 'Materia'}
        pageCount={material.page_count}
        title={material.title}
        universidadName={universidad?.nombre ?? 'Universidad'}
        viewerUrl={viewerUrl}
        visibility={normalizeMaterialVisibility(material.visibility)}
        studyGlossary={studyGlossary}
        studySummary={studySummary}
      />
    );
  } catch (error) {
    if (!isMissingStudentMaterialsTableError(error)) {
      throw error;
    }

    return (
      <main className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center px-4 py-12">
        <div className="surface-panel flex w-full flex-col items-center justify-center gap-4 border-amber-200 bg-amber-50/70 px-6 py-8 text-center sm:px-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <FileText className="h-7 w-7" />
          </div>
          <div className="max-w-md">
            <h3 className="text-lg font-semibold tracking-[-0.03em] text-slate-950">
              Este material todavía no está disponible
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              La tabla `student_materials` no existe todavía en la base remota, así que no podemos
              abrir PDFs del espacio de alumnos hasta aplicar la migración.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-amber-600 px-5 text-sm font-semibold text-white transition hover:bg-amber-700"
          >
            Volver al dashboard
          </Link>
        </div>
      </main>
    );
  }
}
