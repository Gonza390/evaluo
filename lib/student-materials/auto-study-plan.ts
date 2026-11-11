import 'server-only';

import { createAdminClient } from '@/lib/supabase-admin';
import { hasPremiumAccess } from '@/lib/premium';
import { isFreeStudyV2Active } from '@/lib/free-study-v2';
import { logError } from '@/lib/observability';
import { trackServerAnalyticsEvent } from '@/lib/server-analytics';
import { buildPlanSchedule, buildPlanTopics } from '@/lib/student-materials/study-plan-builder';
import type { PlanDay } from '@/lib/student-materials/study-plan-distribution';

/**
 * Plan de estudio automático (onboarding etapa 2).
 *
 * Antes el plan solo se armaba con el asistente de 4 pasos y casi nadie lo
 * completaba (2 de 167 cuentas nuevas en 30 días). Ahora, cuando un apunte
 * está listo y tiene fecha de examen, se arma solo con valores por defecto.
 *
 * Reglas:
 * - Solo si el usuario todavía NO tiene plan: nunca se pisa uno existente.
 * - Valores por defecto: ese apunte, 30 minutos por día, entender + practicar.
 * - Mismo reparto que el plan manual (`buildPlanTopics` / `buildPlanSchedule`).
 * - En Free v2 usa la misma RPC que el plan manual (consume el plan gratuito).
 */
export const AUTO_STUDY_PLAN_DEFAULTS = {
  minutesPerDay: 30,
  preferences: ['entender', 'practicar'],
} as const;

export type AutoStudyPlanResult =
  | 'created'
  | 'plan_exists'
  | 'not_ready'
  | 'no_exam_date'
  | 'no_topics'
  | 'limit_reached'
  | 'error';

export function argentinaTodayKey(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/** La fecha tiene que ser posterior a hoy (hora AR) y estar dentro del próximo año. */
export function isPlannableExamDate(examDate: unknown, todayKey = argentinaTodayKey()) {
  if (typeof examDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(examDate)) return false;
  if (examDate <= todayKey) return false;
  const exam = new Date(`${examDate}T12:00:00Z`).getTime();
  const today = new Date(`${todayKey}T12:00:00Z`).getTime();
  return Number.isFinite(exam) && exam - today <= 366 * 86_400_000;
}

export async function ensureAutoStudyPlan(input: {
  userId: string;
  materialId: string;
}): Promise<AutoStudyPlanResult> {
  const { userId, materialId } = input;
  try {
    const admin = createAdminClient();
    // Tablas y columnas que el tipo generado todavía no conoce.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = admin as any;

    const existing = await db
      .from('student_personal_study_plans')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();
    if (existing.error) throw existing.error;
    if (existing.data) return 'plan_exists';

    const { data: material, error: materialError } = await db
      .from('student_materials')
      .select('id, title, exam_date, processing_status')
      .eq('id', materialId)
      .eq('user_id', userId)
      .maybeSingle();
    if (materialError) throw materialError;
    if (!material || material.processing_status !== 'ready') return 'not_ready';

    const todayKey = argentinaTodayKey();
    if (!isPlannableExamDate(material.exam_date, todayKey)) return 'no_exam_date';
    const examDate = material.exam_date as string;

    const { data: summary, error: summaryError } = await db
      .from('student_material_summaries')
      .select('summary_sections')
      .eq('student_material_id', materialId)
      .maybeSingle();
    if (summaryError) throw summaryError;

    const { minutesPerDay } = AUTO_STUDY_PLAN_DEFAULTS;
    const preferences = [...AUTO_STUDY_PLAN_DEFAULTS.preferences];
    const topics = buildPlanTopics(
      [{ id: material.id, title: material.title }],
      new Map([[material.id, summary?.summary_sections]]),
      preferences,
      minutesPerDay
    );
    if (!topics.length) return 'no_topics';

    const { schedule } = buildPlanSchedule(
      topics,
      examDate,
      minutesPerDay,
      preferences,
      new Date(`${todayKey}T12:00:00`)
    );
    if (!schedule.length) return 'no_topics';

    if (isFreeStudyV2Active() && !(await hasPremiumAccess(userId))) {
      const { data, error } = await admin.rpc('save_free_study_v2_plan' as never, {
        p_user_id: userId,
        p_exam_date: examDate,
        p_daily_minutes: minutesPerDay,
        p_material_ids: [materialId],
        p_preferences: preferences,
        p_schedule: schedule,
      } as never);
      if (error) throw error;
      if (data !== true) return 'limit_reached';
    } else {
      // insert (no upsert): si mientras tanto el usuario armó su plan a mano, gana el suyo.
      const { error } = await db.from('student_personal_study_plans').insert({
        user_id: userId,
        exam_date: examDate,
        daily_minutes: minutesPerDay,
        material_ids: [materialId],
        preferences,
        schedule,
        updated_at: new Date().toISOString(),
      });
      if (error) {
        if (error.code === '23505') return 'plan_exists';
        throw error;
      }
    }

    await trackServerAnalyticsEvent({
      eventName: 'study_plan_auto_created',
      userId,
      path: '/dashboard/procesando',
      metadata: {
        material_id: materialId,
        exam_date: examDate,
        topic_count: topics.length,
        study_days: schedule.length,
        daily_minutes: minutesPerDay,
      },
    });
    return 'created';
  } catch (error) {
    logError('studyPlan.autoCreate', error, { materialId, userId });
    return 'error';
  }
}

export type StudyPlanSummary = {
  examDate: string;
  topicCount: number;
  studyDays: number;
  dailyMinutes: number;
  includesMaterial: boolean;
  todayTopicTitle: string | null;
};

/** Resumen del plan para la pantalla "Listo" (lectura con el cliente del usuario). */
export function summarizeStudyPlan(
  plan: { exam_date: string; daily_minutes: number; material_ids: string[]; schedule: PlanDay[] },
  materialId: string,
  todayKey = argentinaTodayKey()
): StudyPlanSummary {
  const schedule = Array.isArray(plan.schedule) ? plan.schedule : [];
  const topicCount = schedule.reduce((sum, day) => sum + (Array.isArray(day.topics) ? day.topics.length : 0), 0);
  const today = schedule.find((day) => day.date >= todayKey && day.topics?.length);
  return {
    examDate: plan.exam_date,
    topicCount,
    studyDays: schedule.length,
    dailyMinutes: plan.daily_minutes,
    includesMaterial: Array.isArray(plan.material_ids) && plan.material_ids.includes(materialId),
    todayTopicTitle: today?.topics?.[0]?.title ?? null,
  };
}
