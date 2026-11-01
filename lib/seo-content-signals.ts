import { unstable_cache } from 'next/cache';
import { createPublicClient } from '@/lib/supabase-public';
import { getPregunteroMateriaStats } from '@/lib/data/preguntero';

export type MateriaSeoContentSignals = {
  questionCount: number;
  summaryCount: number;
  summaryResourceCount: number;
  resourceCount: number;
  hasQuestions: boolean;
  hasSummaries: boolean;
  hasAcademicContent: boolean;
};

export function hasSubstantialStudyLandingContent(
  signals: Pick<MateriaSeoContentSignals, 'questionCount' | 'summaryCount' | 'resourceCount'>
) {
  const materialCount = signals.summaryCount + signals.resourceCount;

  return (
    signals.questionCount >= 10 ||
    materialCount >= 2 ||
    (signals.questionCount >= 3 && materialCount >= 1)
  );
}

const loadMateriaSeoContentSignals = unstable_cache(
  async (materiaId: string): Promise<MateriaSeoContentSignals> => {
    const client = createPublicClient();
    // Los conteos públicos provienen del RPC cacheado, no de un COUNT del banco.
    const [questions, summaries, summaryResources, resources] = await Promise.all([
      getPregunteroMateriaStats(materiaId).catch(() => null),
      client
        .from('resumenes')
        .select('id', { count: 'exact', head: true })
        .eq('materia_id', materiaId),
      client
        .from('recursos')
        .select('id', { count: 'exact', head: true })
        .eq('materia_id', materiaId)
        .eq('tipo', 'resumen-modulo'),
      client
        .from('recursos')
        .select('id', { count: 'exact', head: true })
        .eq('materia_id', materiaId),
    ]);

    const questionCount = questions?.totalPreguntas ?? 0;
    const summaryCount = summaries.error ? 0 : (summaries.count ?? 0);
    const summaryResourceCount = summaryResources.error ? 0 : (summaryResources.count ?? 0);
    const resourceCount = resources.error ? 0 : (resources.count ?? 0);
    const hasQuestions = questionCount > 0;
    const hasSummaries = summaryCount + summaryResourceCount > 0;

    return {
      questionCount,
      summaryCount,
      summaryResourceCount,
      resourceCount,
      hasQuestions,
      hasSummaries,
      hasAcademicContent: hasQuestions || hasSummaries || resourceCount > 0,
    };
  },
  ['materia-seo-content-signals'],
  { revalidate: 600, tags: ['materia-bootstrap'] }
);

export function getMateriaSeoContentSignals(materiaId: string) {
  return loadMateriaSeoContentSignals(materiaId);
}
