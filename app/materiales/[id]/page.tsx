import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { FileText } from 'lucide-react';
import { MaterialStudyWorkspace } from '@/components/material-study-workspace';
import { StudentMaterialProcessingRetry } from '@/components/student-material-processing-retry';
import { StudentMaterialShareControl } from '@/components/student-material-share-control';
import { resolveAdminActor } from '@/lib/access-control';
import { createAdminClient } from '@/lib/supabase-admin';
import { hasPremiumAccess } from '@/lib/premium';
import { getMateriaRoute } from '@/lib/routes';
import { trackServerAnalyticsEvent } from '@/lib/server-analytics';
import { recoverStaleStudentMaterialJobs } from '@/lib/student-material-jobs';
import { isUuid } from '@/lib/uuid';
import { buildSeoEntitySlug, parseSeoEntitySlug } from '@/lib/seo-intents';
import { buildShareCardPath } from '@/lib/share-card';
import {
  buildPedagogicalArtifacts,
  ensureStudentMaterialStudyArtifacts,
} from '@/lib/student-material-summary';
import { createClientServer } from '@/lib/supabase-server';

type PageProps = {
  params: Promise<{ id: string }>;
};

function resolveMaterialId(routeValue: string) {
  return parseSeoEntitySlug(routeValue).id;
}

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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id: routeValue } = await params;
  const materialId = resolveMaterialId(routeValue);

  const fallback: Metadata = {
    title: 'Material de estudio',
    description: 'Material de estudio preparado en Evaluo.',
    robots: { index: false, follow: false },
  };

  if (!isUuid(materialId)) return fallback;

  try {
    const supabase = await createClientServer();
    const { data: material } = await supabase
      .from('student_materials')
      .select('id, title, materia_id, carrera_id, universidad_id, visibility, processing_status, page_count')
      .eq('id', materialId)
      .maybeSingle();

    if (!material || material.visibility !== 'shared' || material.processing_status !== 'ready') {
      return fallback;
    }

    const admin = createAdminClient();
    const [{ data: carrera }, { data: universidad }, { data: materia }] = await Promise.all([
      admin.from('carreras').select('nombre').eq('id', material.carrera_id).maybeSingle(),
      admin.from('universidades').select('nombre').eq('id', material.universidad_id).maybeSingle(),
      admin.from('materias').select('nombre').eq('id', material.materia_id).maybeSingle(),
    ]);

    const canonicalHref = `/materiales/${buildSeoEntitySlug(material.title, material.id)}`;
    const context = [materia?.nombre, carrera?.nombre, universidad?.nombre].filter(Boolean).join(' · ');
    const pageDetail = material.page_count ? `${material.page_count} páginas · PDF, resumen y glosario` : 'PDF, resumen y glosario';
    const description = materia?.nombre
      ? `Material de ${materia.nombre} compartido en Evaluo. Abrí el PDF procesado junto con su resumen y glosario.`
      : 'Material de estudio compartido en Evaluo con PDF procesado, resumen y glosario.';
    const socialImage = buildShareCardPath({
      kind: 'material',
      title: material.title,
      subtitle: context || 'Material de estudio compartido',
      detail: pageDetail,
    });

    return {
      title: material.title,
      description,
      alternates: { canonical: canonicalHref },
      robots: { index: false, follow: false },
      openGraph: {
        title: `${material.title} | Evaluo`,
        description,
        url: canonicalHref,
        images: [{ url: socialImage, width: 1200, height: 630, alt: `${material.title} en Evaluo` }],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${material.title} | Evaluo`,
        description,
        images: [socialImage],
      },
    };
  } catch {
    return fallback;
  }
}

export default async function StudentMaterialViewerPage({ params }: PageProps) {
  const { id: routeValue } = await params;
  const materialId = resolveMaterialId(routeValue);

  if (!isUuid(materialId)) {
    notFound();
  }

  const supabase = await createClientServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  try {
    const admin = createAdminClient();

    // Vercel puede cortar un worker largo antes de que llegue a ejecutar su catch.
    // Antes de mostrar el estado, liberamos cualquier lease vencido y reflejamos
    // el fallo en student_materials para que el usuario pueda reintentarlo.
    await recoverStaleStudentMaterialJobs(admin, materialId);

    const { data: material, error } = await supabase
      .from('student_materials')
      .select(
        'id, user_id, universidad_id, carrera_id, materia_id, title, file_name, file_path, page_count, visibility, created_at, processing_status, processing_stage, processing_progress, processing_message, processing_error'
      )
      .eq('id', materialId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!material) {
      notFound();
    }

    const canonicalSegment = buildSeoEntitySlug(material.title, material.id);
    if (routeValue.includes('--') && routeValue !== canonicalSegment) {
      redirect(`/materiales/${canonicalSegment}`);
    }

    const [{ data: carrera }, { data: universidad }, { data: materia }, signedUrlResult] =
      await Promise.all([
        admin.from('carreras').select('nombre').eq('id', material.carrera_id).maybeSingle(),
        admin
          .from('universidades')
          .select('nombre')
          .eq('id', material.universidad_id)
          .maybeSingle(),
        admin.from('materias').select('nombre').eq('id', material.materia_id).maybeSingle(),
        admin.storage.from('biblioteca').createSignedUrl(material.file_path, 60 * 15),
      ]);

    const viewerUrl = signedUrlResult.data?.signedUrl;
    if (!viewerUrl || signedUrlResult.error) {
      notFound();
    }

    const isOwner = user?.id === material.user_id;
    const canRegenerate = await resolveAdminActor(user);
    const isPremium = await hasPremiumAccess(user?.id ?? '');

    if (material.processing_status !== 'ready') {
      return (
        <div className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center px-4 py-12">
          <div className="surface-panel flex w-full flex-col gap-4 border-slate-200 bg-white px-6 py-8 sm:px-8">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#EEF4FF] text-[#2563EB]">
              <FileText className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-lg font-semibold tracking-[-0.03em] text-slate-950">
                {material.processing_status === 'failed'
                  ? 'El procesamiento se interrumpió'
                  : 'Estamos preparando este material'}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {material.processing_status === 'failed'
                  ? (material.processing_error ??
                    'No pudimos generar el espacio de estudio del PDF.')
                  : (material.processing_message ??
                    'Seguimos generando el resumen y el glosario del documento.')}
              </p>
              <p className="mt-3 text-xs leading-5 text-slate-500">
                Progreso actual: {material.processing_progress ?? 0}%.
              </p>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white">
              <div
                className={`h-full rounded-full ${
                  material.processing_status === 'failed'
                    ? 'bg-red-400'
                    : 'bg-[linear-gradient(90deg,#F59E0B_0%,#FB923C_45%,#2563EB_100%)]'
                }`}
                style={{
                  width: `${Math.min(100, Math.max(0, material.processing_progress ?? 0))}%`,
                }}
              />
            </div>
            <div className="flex flex-wrap gap-3">
              {material.processing_status === 'failed' && isOwner ? (
                <StudentMaterialProcessingRetry materialId={material.id} />
              ) : null}
              <Link
                href="/dashboard/materiales"
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Volver a materiales
              </Link>
              {material.processing_status !== 'failed' ? (
                <Link
                  href={
                    isOwner
                      ? '/dashboard/materiales'
                      : getMateriaRoute(material.materia_id, material.carrera_id)
                  }
                  className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Actualizar luego
                </Link>
              ) : null}
            </div>
          </div>
        </div>
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
        <div className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center px-4 py-12">
          <div className="surface-panel flex w-full flex-col gap-4 border-slate-200 bg-white px-6 py-8 sm:px-8">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#EEF4FF] text-[#2563EB]">
              <FileText className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-lg font-semibold tracking-[-0.03em] text-slate-950">
                Estamos sincronizando el material
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                El PDF ya figura como listo, pero todavía no encontramos todos los artefactos
                persistidos. En breve debería aparecer el resumen y el glosario sin reprocesar desde
                esta vista.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href={
                  isOwner
                    ? '/dashboard/materiales'
                    : getMateriaRoute(material.materia_id, material.carrera_id)
                }
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#6366F1] px-5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(37,99,235,0.18)] transition hover:from-[#1D4ED8] hover:to-[#4F46E5]"
              >
                Volver
              </Link>
            </div>
          </div>
        </div>
      );
    }

    if (user?.id) {
      await trackServerAnalyticsEvent({
        eventName: 'student_material_study_opened',
        userId: user.id,
        path: `/materiales/${material.id}`,
        metadata: {
          material_id: material.id,
          is_owner: isOwner,
          visibility: normalizeMaterialVisibility(material.visibility),
        },
      });
    }

    const { data: sourceChunks } = await admin
      .from('student_material_chunks')
      .select('chunk_text, page_start, page_end, section_title')
      .eq('student_material_id', material.id)
      .order('chunk_index', { ascending: true });
    const pedagogicalArtifacts = buildPedagogicalArtifacts({
      summary: studySummary,
      glossary: studyGlossary,
      chunks: (sourceChunks ?? []).map((chunk) => ({
        text: chunk.chunk_text,
        pageStart: chunk.page_start,
        pageEnd: chunk.page_end,
        sectionTitle: chunk.section_title,
        excerpt: '',
      })),
    });

    const visibility = normalizeMaterialVisibility(material.visibility);
    const sharePath = `/materiales/${canonicalSegment}`;

    return (
      <>
        {isOwner ? (
          <StudentMaterialShareControl
            materialId={material.id}
            title={material.title}
            sharePath={sharePath}
            initialVisibility={visibility}
          />
        ) : null}
        <MaterialStudyWorkspace
          backHref={
            isOwner
              ? '/dashboard/materiales'
              : getMateriaRoute(material.materia_id, material.carrera_id)
          }
          canRegenerate={canRegenerate}
          carreraName={carrera?.nombre ?? 'Carrera'}
          fileName={material.file_name}
          isPremium={isPremium}
          materialId={material.id}
          isOwner={isOwner}
          materiaName={materia?.nombre ?? 'Materia'}
          pageCount={material.page_count}
          title={material.title}
          universidadName={universidad?.nombre ?? 'Universidad'}
          viewerUrl={viewerUrl}
          visibility={visibility}
          studyGlossary={studyGlossary}
          studySummary={studySummary}
          pedagogicalArtifacts={pedagogicalArtifacts}
        />
      </>
    );
  } catch (error) {
    if (!isMissingStudentMaterialsTableError(error)) {
      throw error;
    }

    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center px-4 py-12">
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
      </div>
    );
  }
}
