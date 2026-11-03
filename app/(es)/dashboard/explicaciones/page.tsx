import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClientServer } from '@/lib/supabase-server';
import { getStudyErrorsPageData } from '@/lib/study-errors';
import { StudyErrorsClient } from '@/components/dashboard/study-errors-client';
import { fetchStudentMaterialsByUser } from '@/lib/data/student-materials';
import { PracticeModePicker } from '@/components/dashboard/practice-mode-picker';
import { getPracticeHistory } from '@/lib/student-materials/practice-history';
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

  const params = (await searchParams) ?? {};
  // La entrada normal de Estudiar muestra las modalidades de práctica, no el plan ni las tarjetas.
  // Los enlaces profundos para revisar errores conservan su comportamiento original.
  if (!params.error && !params.material) {
    const materials = (await fetchStudentMaterialsByUser(supabase, user.id))
      .filter(material => material.processing_status === 'ready')
      .map(material => ({ id: material.id, title: material.title }));
    let lastOpenedMaterialId: string | null = null;
    if (materials.length) {
      const { data: recentOpens } = await supabase.from('analytics_events')
        .select('metadata').eq('user_id', user.id)
        .eq('event_name','student_material_study_opened')
        .order('created_at',{ ascending:false }).limit(40);
      const ids = new Set(materials.map(material=>material.id));
      lastOpenedMaterialId = (recentOpens ?? [])
        .map(event => event.metadata && typeof event.metadata === 'object' && !Array.isArray(event.metadata)
          ? (event.metadata as Record<string, unknown>).material_id : null)
        .find((id): id is string => typeof id === 'string' && ids.has(id)) ?? null;
    }
    let history: Awaited<ReturnType<typeof getPracticeHistory>> = [];
    let historyLoadError = false;
    try {
      history = await getPracticeHistory(user.id, materials.map(material=>material.id));
    } catch {
      historyLoadError = true;
    }
    return <PracticeModePicker materials={materials} initialMaterialId={lastOpenedMaterialId}
      history={history} historyLoadError={historyLoadError}
      advancedPracticeEnabled={process.env.PRACTICE_BANK_ENABLED === '1'} />;
  }
  const data = await getStudyErrorsPageData(user.id);
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
