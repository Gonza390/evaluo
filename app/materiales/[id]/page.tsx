import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { FileText } from 'lucide-react';
import { MaterialStudyWorkspace } from '@/components/material-study-workspace';
import { MaterialStudyStatusWorkspace } from '@/components/material-study-status-workspace';
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
  if (!error || typeof error !== 'object') return false;
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
    const pageDetail = material.page_count
      ? `${material.page_count} páginas · PDF, resumen y glosario`
      : 'PDF, resumen y glosario';
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

  if (!isUuid(materialId)) notFound();

  const supabase = await createClientServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  try {
    const admin = createAdminClient();
    await recoverStaleStudentMaterialJobs(admin, materialId);

    const { data: material, error } = await supabase
      .from('student_materials')
      .select(
        'id, user_id, universidad_id, carrera_id, materia_id, title, file_name, file_path, page_count, visibility, created_at, processing_status, processing_stage, processing_progress, processing_message, processing_error'
      )
      .eq('id', materialId)
      .maybeSingle();

    if (error) throw error;
    if (!material) notFound();

    const canonicalSegment = buildSeoEntitySlug(material.title, material.id);
    if (routeValue.includes('--') && routeValue !== canonicalSegment) {
      redirect(`/materiales/${canonicalSegment}`);
    }

    const [{ data: carrera }, { data: universidad }, { data: materia }, signedUrlResult] =
      await Promise.all([
        admin.from('carreras').select('nombre').eq('id', material.carrera_id).maybeSingle(),
        admin.from('universidades').select('nombre').eq('id', material.universidad_id).maybeSingle(),
        admin.from('materias').select('nombre').eq('id', material.materia_id).maybeSingle(),
        admin.storage.from('biblioteca').createSignedUrl(material.file_path, 60 * 15),
      ]);

    const viewerUrl = signedUrlResult.data?.signedUrl;
    if (!viewerUrl || signedUrlResult.error) notFound();

    const isOwner = user?.id === material.user_id;
    const canRegenerate = isOwner && (await resolveAdminActor(user));
    const isPremium = await hasPremiumAccess(user?.id ?? '');
    const backHref = isOwner
      ? '/dashboard/materiales'
      : getMateriaRoute(material.materia_id, material.carrera_id);

    if (material.processing_status !== 'ready') {
      const failed = material.processing_status === 'failed';
      return (
        <MaterialStudyStatusWorkspace
          backHref={backHref}
          carreraName={carrera?.nombre ?? 'Carrera'}
          universidadName={universidad?.nombre ?? 'Universidad'}
          materiaName={materia?.nombre ?? 'Materia'}
          title={material.title}
          fileName={material.file_name}
          viewerUrl={viewerUrl}
          status={failed ? 'failed' : 'processing'}
          progress={material.processing_progress}
          message={
            failed
              ? material.processing_error ?? 'No pudimos generar el espacio de estudio del PDF.'
              : material.processing_message ?? 'Seguimos generando el resumen y el glosario del documento.'
          }
          actions={
            <>
              {failed && isOwner ? <StudentMaterialProcessingRetry materialId={material.id} /> : null}
              {!failed ? (
                <Link
                  href={backHref}
                  className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Continuar luego
                </Link>
              ) : null}
            </>
          }
        />
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
        <MaterialStudyStatusWorkspace
          backHref={backHref}
          carreraName={carrera?.nombre ?? 'Carrera'}
          universidadName={universidad?.nombre ?? 'Universidad'}
          materiaName={materia?.nombre ?? 'Materia'}
          title={material.title}
          fileName={material.file_name}
          viewerUrl={viewerUrl}
          status="syncing"
          progress={100}
          message="El PDF ya está procesado. Estamos terminando de sincronizar el resumen, el glosario y el resto de tu espacio de estudio."
          actions={
            <Link
              href={backHref}
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Continuar luego
            </Link>
          }
        />
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

    const [{ data: sourceChunks }, modelResult] = await Promise.all([
      admin
        .from('student_material_chunks')
        .select('chunk_text, page_start, page_end, section_title')
        .eq('student_material_id', material.id)
        .order('chunk_index', { ascending: true }),
      (admin as unknown as { from: (table: string) => any })
        .from('student_materials')
        .select('pedagogical_model')
        .eq('id', material.id)
        .maybeSingle(),
    ]);

    const canonicalModel = (modelResult.data?.pedagogical_model ?? null) as Parameters<
      typeof buildPedagogicalArtifacts
    >[0]['canonicalModel'];

    const pedagogicalArtifacts = buildPedagogicalArtifacts({
      summary: studySummary,
      glossary: studyGlossary,
      canonicalModel,
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
          backHref={backHref}
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
    if (!isMissingStudentMaterialsTableError(error)) throw error;

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
