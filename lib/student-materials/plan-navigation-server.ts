import type { SupabaseClient } from '@supabase/supabase-js';
import {
  nextPlanActivity, PLAN_HOME_HREF, type NextPlanActivity,
} from '@/lib/student-materials/next-plan-activity';
import type { PlanPracticeCompletion, PlanPracticeMode } from '@/lib/student-materials/study-plan-completion';
import type { PlanDay } from '@/lib/student-materials/study-plan-distribution';

export type PlanNavigation = { backHref: string; next: NextPlanActivity | null };

const MISSING_TABLE = ['42P01', 'PGRST205'];

/**
 * Salidas de una práctica lanzada desde el plan: volver al plan y, si queda algo
 * pendiente, la siguiente actividad. Devuelve null si el alumno no tiene plan
 * guardado o si este material no forma parte de él. Es solo lectura: nunca
 * modifica el plan ni sus fechas.
 */
export async function loadPlanNavigation(args: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- tablas del plan fuera de los tipos generados
  supabase: SupabaseClient<any>;
  userId: string;
  materialId: string;
  topicIndex: number;
  mode: PlanPracticeMode;
}): Promise<PlanNavigation | null> {
  const { supabase, userId, materialId, topicIndex, mode } = args;
  const { data, error } = await supabase.from('student_personal_study_plans')
    .select('daily_minutes,material_ids,preferences,schedule').eq('user_id', userId).maybeSingle();
  if (error || !data) return null;
  const plan = data as { daily_minutes: number; material_ids: string[]; preferences: string[]; schedule: PlanDay[] };
  const planIds = Array.isArray(plan.material_ids) ? plan.material_ids : [];
  if (!planIds.includes(materialId) || !Array.isArray(plan.schedule)) return null;
  const [reading, practice] = await Promise.all([
    supabase.from('student_material_topic_activity_progress')
      .select('material_id,topic_index').eq('user_id', userId).eq('activity', 'reading').in('material_id', planIds),
    supabase.from('student_personal_study_plan_practice_progress')
      .select('material_id,topic_index,mode').eq('user_id', userId).in('material_id', planIds),
  ]);
  // Sin el progreso no se puede decir cuál sigue: se ofrece solo volver al plan.
  if (reading.error || (practice.error && !MISSING_TABLE.includes(practice.error.code ?? '')))
    return { backHref: PLAN_HOME_HREF, next: null };
  const readingKeys = ((reading.data ?? []) as Array<{ material_id: string; topic_index: number }>)
    .map(row => `${row.material_id}:${row.topic_index}`);
  return {
    backHref: PLAN_HOME_HREF,
    next: nextPlanActivity({
      days: plan.schedule, preferences: plan.preferences ?? [], dailyMinutes: plan.daily_minutes,
      readingKeys, practice: (practice.data ?? []) as PlanPracticeCompletion[],
      current: { materialId, topicIndex, mode },
    }),
  };
}
