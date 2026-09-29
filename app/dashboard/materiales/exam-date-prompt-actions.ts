'use server';

import { createAdminClient } from '@/lib/supabase-admin';
import { createClientServer } from '@/lib/supabase-server';
import { logError } from '@/lib/observability';

const MAX_PROMPT_VIEWS = 2;
const PROMPT_COOLDOWN_HOURS = 12;

type AnalyticsEventRow = {
  event_name: string;
  created_at: string;
  path: string | null;
  metadata: Record<string, unknown> | null;
};

function materialEventMatches(event: AnalyticsEventRow, materialId: string) {
  const metadataMaterialId =
    typeof event.metadata?.material_id === 'string' ? event.metadata.material_id : null;
  if (metadataMaterialId === materialId) return true;
  return Boolean(event.path?.includes(`/materiales/${materialId}`));
}

function argentinaTodayKey() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

async function requireOwnedMaterial(materialId: string) {
  const supabase = await createClientServer();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user?.id) {
    return { ok: false as const, reason: 'unauthenticated' as const };
  }

  const { data: material, error } = await supabase
    .from('student_materials')
    .select('id,user_id,file_name,exam_date,processing_status')
    .eq('id', materialId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) throw error;
  if (!material) {
    return { ok: false as const, reason: 'not_found' as const };
  }

  return { ok: true as const, user, material };
}

export async function getExamDatePromptEligibilityAction(input: {
  materialId: string;
  forceCurrentSignal?: boolean;
}) {
  try {
    const owned = await requireOwnedMaterial(input.materialId);
    if (!owned.ok) return { success: false, eligible: false, reason: owned.reason };

    const { material, user } = owned;
    if (material.processing_status !== 'ready') {
      return { success: true, eligible: false, reason: 'not_ready' };
    }
    if (material.exam_date) {
      return { success: true, eligible: false, reason: 'already_has_date' };
    }

    const admin = createAdminClient();
    // Service-role reads are scoped again by authenticated owner id + material id.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = admin as any;

    const { data: recentEvents, error: eventsError } = await db
      .from('analytics_events')
      .select('event_name,created_at,path,metadata')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(250);

    if (eventsError) throw eventsError;

    const events = ((recentEvents ?? []) as AnalyticsEventRow[]).filter((event) =>
      materialEventMatches(event, input.materialId)
    );

    const promptViews = events.filter(
      (event) => event.event_name === 'exam_date_prompt_viewed'
    );

    if (promptViews.length >= MAX_PROMPT_VIEWS) {
      return { success: true, eligible: false, reason: 'view_limit' };
    }

    const latestPromptView = promptViews[0]?.created_at;
    if (latestPromptView) {
      const cooldownMs = PROMPT_COOLDOWN_HOURS * 60 * 60 * 1000;
      if (Date.now() - new Date(latestPromptView).getTime() < cooldownMs) {
        return { success: true, eligible: false, reason: 'cooldown' };
      }
    }

    const { count: studyErrorCount, error: studyErrorError } = await db
      .from('study_errors')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('student_material_id', input.materialId);

    if (studyErrorError) throw studyErrorError;

    const hasMeaningfulStudy = events.some(
      (event) => event.event_name === 'meaningful_study_completed'
    );
    const hasFlashcardCompletion = events.some(
      (event) => event.event_name === 'flashcard_session_completed'
    );
    const hasLongTabEngagement = events.some((event) => {
      if (event.event_name !== 'study_tab_engagement') return false;
      const activeMs = Number(event.metadata?.active_ms ?? 0);
      return Number.isFinite(activeMs) && activeMs >= 30_000;
    });
    const activeDays = new Set(
      events
        .filter((event) =>
          ['student_material_study_opened', 'study_tab_engagement', 'flashcard_session_completed'].includes(
            event.event_name
          )
        )
        .map((event) =>
          new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/Argentina/Buenos_Aires',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          }).format(new Date(event.created_at))
        )
    );

    const hasSignal =
      Boolean(input.forceCurrentSignal) ||
      hasMeaningfulStudy ||
      hasFlashcardCompletion ||
      hasLongTabEngagement ||
      (studyErrorCount ?? 0) > 0 ||
      activeDays.size >= 2;

    return {
      success: true,
      eligible: hasSignal,
      reason: hasSignal ? 'eligible' : 'insufficient_study_signal',
      fileName: material.file_name,
      views: promptViews.length,
    };
  } catch (error) {
    logError('examDatePrompt.eligibility', error, { materialId: input.materialId });
    return { success: false, eligible: false, reason: 'error' };
  }
}

async function trackPromptEvent(
  eventName: 'exam_date_prompt_viewed' | 'exam_date_prompt_dismissed',
  materialId: string
) {
  const owned = await requireOwnedMaterial(materialId);
  if (!owned.ok) return { success: false };

  const admin = createAdminClient();
  const { error } = await admin.from('analytics_events').insert({
    event_name: eventName,
    user_id: owned.user.id,
    session_key: 'client:exam-date-prompt',
    path: `/materiales/${materialId}`,
    metadata: { material_id: materialId },
  });

  if (error) throw error;
  return { success: true };
}

export async function trackExamDatePromptViewedAction(materialId: string) {
  try {
    return await trackPromptEvent('exam_date_prompt_viewed', materialId);
  } catch (error) {
    logError('examDatePrompt.viewed', error, { materialId });
    return { success: false };
  }
}

export async function dismissExamDatePromptAction(materialId: string) {
  try {
    return await trackPromptEvent('exam_date_prompt_dismissed', materialId);
  } catch (error) {
    logError('examDatePrompt.dismissed', error, { materialId });
    return { success: false };
  }
}

export async function saveStudentMaterialExamDateAction(input: {
  materialId: string;
  examDate: string;
}) {
  try {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.examDate)) {
      return { success: false, message: 'Elegí una fecha válida.' };
    }

    const today = argentinaTodayKey();
    if (input.examDate <= today) {
      return { success: false, message: 'La fecha del examen tiene que ser posterior a hoy.' };
    }

    const owned = await requireOwnedMaterial(input.materialId);
    if (!owned.ok) {
      return { success: false, message: 'No pudimos guardar la fecha.' };
    }

    const supabase = await createClientServer();
    const { error: updateError } = await supabase
      .from('student_materials')
      .update({ exam_date: input.examDate })
      .eq('id', input.materialId)
      .eq('user_id', owned.user.id);

    if (updateError) throw updateError;

    const admin = createAdminClient();
    const { error: analyticsError } = await admin.from('analytics_events').insert({
      event_name: 'exam_date_prompt_saved',
      user_id: owned.user.id,
      session_key: 'client:exam-date-prompt',
      path: `/materiales/${input.materialId}`,
      metadata: {
        material_id: input.materialId,
        exam_date: input.examDate,
      },
    });

    if (analyticsError) {
      logError('examDatePrompt.savedAnalytics', analyticsError, {
        materialId: input.materialId,
      });
    }

    return { success: true, message: 'Fecha guardada.' };
  } catch (error) {
    logError('examDatePrompt.save', error, { materialId: input.materialId });
    return { success: false, message: 'No pudimos guardar la fecha. Probá de nuevo.' };
  }
}
