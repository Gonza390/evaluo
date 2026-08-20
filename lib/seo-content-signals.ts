import { unstable_cache } from 'next/cache';
import { createPublicClient } from '@/lib/supabase-public';

export type MateriaSeoContentSignals = {
  questionCount: number;
  summaryCount: number;
  resourceCount: number;
  hasQuestions: boolean;
  hasSummaries: boolean;
  hasAcademicContent: boolean;
};

const loadMateriaSeoContentSignals = unstable_cache(
  async (materiaId: string): Promise<MateriaSeoContentSignals> => {
    const client = createPublicClient();
    const [questions, summaries, resources] = await Promise.all([
      client
        .from('preguntas_banco_public')
        .select('id', { count: 'exact', head: true })
        .eq('materia_id', materiaId),
      client
        .from('resumenes')
        .select('id', { count: 'exact', head: true })
        .eq('materia_id', materiaId),
      client
        .from('recursos')
        .select('id', { count: 'exact', head: true })
        .eq('materia_id', materiaId),
    ]);

    const questionCount = questions.error ? 0 : (questions.count ?? 0);
    const summaryCount = summaries.error ? 0 : (summaries.count ?? 0);
    const resourceCount = resources.error ? 0 : (resources.count ?? 0);
    const hasQuestions = questionCount > 0;
    const hasSummaries = summaryCount + resourceCount > 0;

    return {
      questionCount,
      summaryCount,
      resourceCount,
      hasQuestions,
      hasSummaries,
      hasAcademicContent: hasQuestions || hasSummaries,
    };
  },
  ['materia-seo-content-signals'],
  { revalidate: 600, tags: ['materia-bootstrap'] }
);

export function getMateriaSeoContentSignals(materiaId: string) {
  return loadMateriaSeoContentSignals(materiaId);
}
