import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClientServer } from '@/lib/supabase-server';
import { getStudyErrorsPageData } from '@/lib/study-errors';
import { StudyErrorsClient } from '@/components/dashboard/study-errors-client';
import { StudyReadingCards } from '@/components/dashboard/study-reading-cards';
import { createAdminClient } from '@/lib/supabase-admin';
import { isUuid } from '@/lib/uuid';
import { pdfProgressReviewHref } from '@/lib/study-error-navigation';

export const metadata: Metadata = {
  title: 'Estudiar',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function StudyErrorsPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; material?: string }>;
}) {
  const supabase = await createClientServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/dashboard/explicaciones');
  }

  const data = await getStudyErrorsPageData(user.id);
  const params = (await searchParams) ?? {};
  // The main Estudiar entry shows PDF reading cards. Deep links to error review stay intact.
  if (!params.error && !params.material) {
    const materials = data.materials;
    const ids = materials.map((material) => material.id);
    const chaptersByMaterial = new Map<string, number>();
    if (ids.length > 0) {
      const { data: summaries, error: summaryError } = await createAdminClient()
        .from('student_material_summaries')
        .select('student_material_id, summary_sections')
        .in('student_material_id', ids);
      if (!summaryError) {
        for (const summary of summaries ?? []) {
          chaptersByMaterial.set(
            summary.student_material_id,
            Array.isArray(summary.summary_sections) ? summary.summary_sections.length : 0
          );
        }
      }
    }
    return (
      <StudyReadingCards
        materials={materials.map((material) => ({
          id: material.id,
          title: material.title,
          chapterCount: chaptersByMaterial.get(material.id) ?? 0,
        }))}
      />
    );
  }
  const requestedErrorId = String(params.error ?? '').slice(0, 80) || null;
  const requestedError = [...data.pending, ...data.resolved].find(
    (item) => item.id === requestedErrorId
  );
  // Los errores de PDF tienen un único espacio de refuerzo: Progreso.
  // Un error del simulador conserva su contexto aunque tenga un PDF recomendado.
  const targetMaterialId =
    requestedError?.sourceType === 'simulator'
      ? null
      : (requestedError?.recommendation?.materialId ??
        (params.material && isUuid(params.material) ? params.material : null));
  if (!data.loadError && targetMaterialId) {
    const href = pdfProgressReviewHref(
      targetMaterialId,
      requestedError
    );
    if (href) redirect(href);
  }
  return (
    <StudyErrorsClient
      data={data}
      initialErrorId={requestedError?.id}
      initialMaterialId={params.material && isUuid(params.material) ? params.material : undefined}
    />
  );
}
