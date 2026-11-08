import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { createAdminClient } from '@/lib/supabase-admin';
import { logError } from '@/lib/observability';
import type { StudentMaterial } from '@/lib/data/student-materials';
import type { PlanDay } from '@/lib/student-materials/study-plan-distribution';
import { buildHomeView, type HomeExam, type HomePlan, type HomeView } from '@/lib/dashboard-home-model';

/** Fecha de hoy en Argentina (YYYY-MM-DD). */
export function argentinaToday(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/** Minutos de lectura de un tema: misma fórmula que el plan de estudio. */
function topicMinutes(body: string | undefined) {
  const words = (body ?? '').trim().split(/\s+/u).filter(Boolean).length;
  return Math.max(10, Math.ceil(words / 180) + 10);
}

type Client = SupabaseClient<Database>;

/**
 * Datos de la home nueva. Devuelve null si no hay un PDF listo o si algo falla:
 * en ese caso la página muestra la home anterior.
 */
export async function getDashboardHomeView(
  supabase: Client,
  userId: string,
  materials: StudentMaterial[],
  firstName?: string,
): Promise<HomeView | null> {
  const ready = materials.filter((material) => material.processing_status === 'ready');
  const primary = ready[0];
  if (!primary) return null;

  try {
    // exam_date y las tablas de progreso/plan existen en producción pero no en el tipo generado.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const admin = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const adminDb = admin as any;
    const readyIds = ready.map((material) => material.id);

    const [examsResult, summaryResult, progressResult, planResult, errorsResult] = await Promise.all([
      db.from('student_materials').select('id,title,exam_date').eq('user_id', userId).in('id', readyIds),
      supabase.from('student_material_summaries').select('summary_sections').eq('student_material_id', primary.id).maybeSingle(),
      db.from('student_material_topic_activity_progress').select('topic_index,activity')
        .eq('user_id', userId).eq('material_id', primary.id),
      db.from('student_personal_study_plans').select('exam_date,material_ids,schedule').eq('user_id', userId).maybeSingle(),
      adminDb.from('study_errors').select('topic').eq('user_id', userId)
        .eq('status', 'pending').eq('student_material_id', primary.id).limit(300),
    ]);

    if (examsResult.error) throw examsResult.error;
    if (summaryResult.error) throw summaryResult.error;
    if (progressResult.error) throw progressResult.error;
    if (planResult.error && !['42P01', 'PGRST205'].includes(planResult.error.code ?? '')) throw planResult.error;
    if (errorsResult.error && errorsResult.error.code !== '42P01') {
      logError('dashboardHome.studyErrors', errorsResult.error, { userId });
    }

    const examRows = (examsResult.data ?? []) as Array<{ id: string; title: string | null; exam_date: string | null }>;
    const primaryExam = examRows.find((row) => row.id === primary.id)?.exam_date ?? null;
    const exams: HomeExam[] = examRows
      .filter((row) => typeof row.exam_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(row.exam_date))
      .map((row) => ({ materialId: row.id, title: row.title?.trim() || 'Tu apunte', examDate: row.exam_date! }));

    const sections = Array.isArray(summaryResult.data?.summary_sections) ? summaryResult.data.summary_sections : [];
    const topics = sections.map((section: unknown, index: number) => {
      const item = section as { title?: string; body?: string };
      return { title: item.title?.trim() || `Tema ${index + 1}`, minutes: topicMinutes(item.body) };
    });

    const progress = (progressResult.data ?? []) as Array<{ topic_index: number; activity: string }>;
    const readTopics = progress.filter((row) => row.activity === 'reading').map((row) => row.topic_index);
    const touchedTopics = progress.map((row) => row.topic_index);

    const weakTopicCount = new Set(
      ((errorsResult.data ?? []) as Array<{ topic: string | null }>).map((row) => row.topic?.trim().toLowerCase() || '?'),
    ).size;

    const rawPlan = planResult.data as { exam_date?: string; material_ids?: string[]; schedule?: PlanDay[] } | null;
    const plan: HomePlan | null =
      rawPlan && Array.isArray(rawPlan.material_ids) && rawPlan.material_ids.includes(primary.id) &&
      typeof rawPlan.exam_date === 'string' && Array.isArray(rawPlan.schedule)
        ? {
            examDate: rawPlan.exam_date,
            days: rawPlan.schedule.map((day) => ({
              date: day.date,
              topics: (day.topics ?? []).map((topic) => ({
                materialId: topic.materialId,
                topicIndex: topic.topicIndex,
                title: topic.title,
                estimatedMinutes: topic.estimatedMinutes,
              })),
            })),
          }
        : null;

    return buildHomeView({
      firstName,
      today: argentinaToday(),
      material: { id: primary.id, title: primary.title?.trim() || primary.file_name || 'tu apunte', examDate: primaryExam },
      topics,
      readTopics,
      touchedTopics,
      weakTopicCount,
      plan,
      exams,
    });
  } catch (error) {
    logError('dashboardHome.view', error, { userId });
    return null;
  }
}
