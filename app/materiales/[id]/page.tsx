import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowRight, FileText, UploadCloud } from 'lucide-react';
import { MaterialStudyWorkspace } from '@/components/material-study-workspace';
import { MaterialStudyStatusWorkspace } from '@/components/material-study-status-workspace';
import { TrackedLink } from '@/components/marketing/tracked-link';
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
import { ensureStudentMaterialStudyArtifacts } from '@/lib/student-material-summary';
import { loadOrBuildPedagogicalArtifacts } from '@/lib/data/student-material-pedagogical-cache';
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

async function loadAcademicLabels(
  admin: ReturnType<typeof createAdminClient>,
  input: {
    universidadId: string | null | undefined;
    carreraId: string | null | undefined;
    materiaId: string | null | undefined;
  }
) {
  const adminClient = admin as any;
  const [carreraResult, universidadResult, materiaResult] = await Promise.all([
    input.carreraId
      ? adminClient.from('carreras').select('nombre').eq('id', input.carreraId).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    input.universidadId
      ? adminClient
          .from('universidades')
          .select('nombre')
          .eq('id', input.universidadId)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    input.materiaId
      ? adminClient.from('materias').select('nombre').eq('id', input.materiaId).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (carreraResult.error) throw carreraResult.error;
  if (universidadResult.error) throw universidadResult.error;
  if (materiaResult.error) throw materiaResult.error;

  return {
    carrera: carreraResult.data as { nombre: string } | null,
    universidad: universidadResult.data as { nombre: string } | null,
    materia: materiaResult.data as { nombre: string } | null,
  };
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
    const { carrera, universidad, materia } = await loadAcademicLabels(admin, {
      universidadId: material.universidad_id,
      carreraId: material.carrera_id,
      materiaId: material.materia_id,
    });

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

    const [{ carrera, universidad, materia }, signedUrlResult] = await Promise.all([
      loadAcademicLabels(admin, {
        universidadId: material.universidad_id,
        carreraId: material.carrera_id,
        materiaId: material.materia_id,
      }),
      admin.storage.from('biblioteca').createSignedUrl(material.file_path, 60 * 15),
    ]);

    const viewerUrl = signedUrlResult.data?.signedUrl;
    if (!viewerUrl || signedUrlResult.error) notFound();

    const isOwner = user?.id === material.user_id;
    const canRegenerate = isOwner && (await resolveAdminActor(user));
    const isPremium = await hasPremiumAccess(user?.id ?? '');
    const hasFullAcademicContext = Boolean(
      material.universidad_id && material.carrera_id && material.materia_id
    );
    const backHref = isOwner
      ? '/dashboard/materiales'
      : material.materia_id
        ? getMateriaRoute(material.materia_id, material.carrera_id)
        : '/explorar';

    if (material.processing_status !== 'ready') {
      const failed = material.processing_status === 'failed';
      return (
        <MaterialStudyStatusWorkspace
          backHref={backHref}
          carreraName={carrera?.nombre ?? 'Sin carrera'}
          universidadName={universidad?.nombre ?? 'Sin universidad'}
          materiaName={materia?.nombre ?? 'Sin materia'}
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
          carreraName={carrera?.nombre ?? 'Sin carrera'}
          universidadName={universidad?.nombre ?? 'Sin universidad'}
          materiaName={materia?.nombre ?? 'Sin materia'}
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

    const pedagogicalArtifacts = await loadOrBuildPedagogicalArtifacts({
      admin,
      materialId: material.id,
      summary: studySummary,
      glossary: studyGlossary,
    });

    const visibility = normalizeMaterialVisibility(material.visibility);
    const sharePath = `/materiales/${canonicalSegment}`;
    const uploadParams = new URLSearchParams({ openUpload: '1', source: 'shared_material' });
    if (material.universidad_id) uploadParams.set('universidadId', material.universidad_id);
    if (material.carrera_id) uploadParams.set('carreraId', material.carrera_id);
    if (material.materia_id) uploadParams.set('materiaId', material.materia_id);
    const uploadPath = `/dashboard/materiales?${uploadParams.toString()}`;
    const ownMaterialHref = user?.id
      ? uploadPath
      : `/login?mode=signup&next=${encodeURIComponent(uploadPath)}`;

    return (
      <>
        {isOwner && hasFullAcademicContext ? (
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
          carreraName={carrera?.nombre ?? 'Sin carrera'}
          fileName={material.file_name}
          isPremium={isPremium}
          materialId={material.id}
          isOwner={isOwner}
          materiaName={materia?.nombre ?? 'Sin materia'}
          pageCount={material.page_count}
          title={material.title}
          universidadName={universidad?.nombre ?? 'Sin universidad'}
          viewerUrl={viewerUrl}
          visibility={visibility}
          studyGlossary={studyGlossary}
          studySummary={studySummary}
          pedagogicalArtifacts={pedagogicalArtifacts}
        />

        {!isOwner && visibility === 'shared' ? (
          <section className="mx-auto w-full max-w-[1600px] px-4 pb-10 sm:px-6 lg:px-8 lg:pb-12">
            <div className="overflow-hidden rounded-[24px] border border-blue-200 bg-[linear-gradient(135deg,#EFF6FF_0%,#FFFFFF_48%,#EEF2FF_100%)] px-5 py-5 shadow-[0_16px_40px_rgba(37,99,235,0.08)] sm:px-6 sm:py-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3.5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-[#2563EB] text-white shadow-[0_10px_24px_rgba(37,99,235,0.18)]">
                    <UploadCloud className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold tracking-[0.15em] text-blue-600 uppercase">
                      Estudiá con tu material
                    </p>
                    <h2 className="mt-1.5 text-[1.25rem] font-bold tracking-[-0.04em] text-slate-950 sm:text-[1.4rem]">
                      ¿Tenés tus propios apuntes de {materia?.nombre ?? 'esta materia'}?
                    </h2>
                    <p className="mt-2 max-w-2xl text-[13.5px] leading-6 text-slate-600">
                      Subí tu PDF y convertí tus apuntes en un espacio de estudio como este: resumen, glosario, tarjetas y ejercicios sobre tu propio material.
                    </p>
                  </div>
                </div>

                <TrackedLink
                  href={ownMaterialHref}
                  eventName="cta_click"
                  payload={{
                    location: 'shared_material_pdf_activation',
                    cta_name: 'upload_own_pdf_after_shared_material',
                    material_id: material.id,
                    materia_id: material.materia_id,
                    materia_nombre: materia?.nombre ?? null,
                    destination: ownMaterialHref,
                  }}
                  className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(37,99,235,0.20)] transition hover:bg-[#1D4ED8]"
                >
                  Subir mi PDF
                  <ArrowRight className="h-4 w-4" />
                </TrackedLink>
              </div>
            </div>
          </section>
        ) : null}
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
