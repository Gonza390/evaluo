import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { FileText, ArrowRight } from 'lucide-react';
import { createClientServer } from '@/lib/supabase-server';
import { getPendingStudyErrorOnboarding, getStudyErrorsPageData } from '@/lib/study-errors';
import { isUuid } from '@/lib/uuid';
import { PdfProgressPanel } from '@/components/dashboard/pdf-progress-panel';
import { getPdfAssessmentData } from '@/lib/student-materials/answer-events';
import {
  getTopicQuestionCounts,
  readPracticeSummarySections,
} from '@/lib/student-materials/topic-practice';
import type { PedagogicalArtifacts } from '@/lib/student-materials/pedagogy';

export const metadata: Metadata = {
  title: 'Progreso de tu PDF',
  robots: { index: false, follow: false },
};

export default async function PdfProgressPage({
  searchParams,
}: {
  searchParams: Promise<{ material?: string; error?: string; tour?: string; from?: string }>;
}) {
  const { material: materialId, error: requestedError, tour, from } = await searchParams;
  if (materialId && !isUuid(materialId)) notFound();
  const supabase = await createClientServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    redirect(
      `/login?next=${encodeURIComponent(`/dashboard/progreso${materialId ? `?material=${materialId}` : ''}`)}`
    );

  // Verificar pertenencia antes de consultar el resumen y los errores del material.
  let query = supabase
    .from('student_materials')
    .select('id, title')
    .eq('user_id', user.id)
    .eq('processing_status', 'ready')
    .order('updated_at', { ascending: false });
  if (materialId) query = query.eq('id', materialId);
  const { data: materials, error } = await query;
  if (error) throw new Error('No pudimos cargar tus materiales. Intentá nuevamente.');
  const material = materialId ? materials?.find((item) => item.id === materialId) : null;
  if (materialId && !material) notFound();
  if (!material)
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-3xl font-semibold">Tu progreso</h1>
        <p className="text-muted-foreground mt-3">
          Elegí un PDF para ver sus temas y los errores que registraste.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {materials?.map((item) => (
            <Link
              key={item.id}
              href={`/dashboard/progreso?material=${item.id}`}
              className="border-border bg-card hover:border-primary focus-visible:outline-ring flex min-w-0 items-center gap-4 rounded-2xl border p-5 transition focus-visible:outline-2"
            >
              <FileText className="text-primary shrink-0" size={22} />
              <span className="min-w-0 flex-1 font-medium break-words">{item.title}</span>
              <ArrowRight size={18} className="text-primary shrink-0" />
            </Link>
          ))}
        </div>
        {!materials?.length && (
          <div className="border-border mt-8 rounded-2xl border p-6">
            <p>Todavía no tenés PDFs procesados.</p>
            <Link
              href="/dashboard/materiales?openUpload=1"
              className="text-primary mt-4 inline-flex text-sm font-semibold"
            >
              Subir un PDF
              <ArrowRight size={17} className="ml-2" />
            </Link>
          </div>
        )}
      </div>
    );
  const [errors, summary, assessmentData, storedArtifacts] = await Promise.all([
    getStudyErrorsPageData(user.id, material.id),
    supabase
      .from('student_material_summaries')
      .select('summary_sections, status')
      .eq('student_material_id', material.id)
      .maybeSingle(),
    getPdfAssessmentData(user.id, material.id),
    supabase
      .from('student_materials')
      .select('pedagogical_artifacts')
      .eq('id', material.id)
      .eq('user_id', user.id)
      .maybeSingle(),
  ]);
  const artifacts = storedArtifacts.data
    ?.pedagogical_artifacts as unknown as PedagogicalArtifacts | null;
  const initialErrorId = [...errors.pending, ...errors.resolved].find(
    (item) => item.id === requestedError
  )?.id;
  const onboardingErrorId =
    tour === 'first-error' && initialErrorId
      ? await getPendingStudyErrorOnboarding(user.id, initialErrorId)
      : null;
  const questionCounts = storedArtifacts.error
    ? undefined
    : getTopicQuestionCounts(
        readPracticeSummarySections(summary.data?.summary_sections),
        Array.isArray(artifacts?.questions) ? artifacts.questions : []
      );
  return (
    <PdfProgressPanel
      key={`${material.id}:${initialErrorId ?? ''}:${assessmentData.items.map((item) => item.lastAnsweredAt).join(':')}`}
      material={material}
      initialErrorId={initialErrorId}
      onboardingErrorId={onboardingErrorId}
      returnToErrors={from === 'errores'}
      data={errors}
      assessmentData={assessmentData}
      questionCounts={questionCounts}
      sections={summary.data?.status === 'ready' ? summary.data.summary_sections : []}
      summaryUnavailable={Boolean(summary.error) || summary.data?.status !== 'ready'}
    />
  );
}
