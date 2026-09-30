'use server';

import { requireAdminAccess } from '@/lib/auth';
import { listAdminUserIds } from '@/lib/admin-users';
import { createAdminClient } from '@/lib/supabase-admin';

const ARGENTINA_OFFSET = '-03:00';
const GEMINI_INPUT_USD_PER_MILLION = 0.3;
const GEMINI_OUTPUT_USD_PER_MILLION = 2.5;

type AnalyticsRow = {
  event_name: string;
  user_id: string | null;
  session_key: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

type MaterialRow = {
  id: string;
  user_id: string;
  processing_status: string | null;
  created_at: string;
};

type JobRow = {
  student_material_id: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
};

type FeedbackRow = {
  rating: string | null;
  report_reason: string | null;
  created_at: string;
};

type AiUsageRow = {
  student_material_id: string;
  provider: string;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  total_tokens: number | null;
};

export type ProductDailyStats = {
  dateLabel: string;
  generatedAt: string;
  funnel: {
    sessions: number;
    registrations: number;
    pdfUploads: number;
    openedResults: number;
  };
  entry: {
    registrations: number;
    registrationsTrendPct: number | null;
    loggedUsers: number;
    newLoggedUsers: number;
    recurrentLoggedUsers: number;
    anonymousSessionPct: number;
    loggedSessionPct: number;
    failedLogins: number;
    gateViewed: number;
    gateClicked: number;
    gateRegistered: number;
  };
  activation: {
    uploads: number;
    ready: number;
    failed: number;
    stuckOver15m: number;
    averageProcessingSeconds: number | null;
    firstTimeUploaders: number;
    repeatUploaders: number;
    averageSignupToFirstPdfSeconds: number | null;
    averageAiCostUsd: number | null;
  };
  usage: {
    openedMaterials: number;
    positiveFeedback: number;
    negativeFeedbackOrReports: number;
    registeredWithoutPdf: number;
    uploadedWithoutOpen: number;
  };
};

function argentinaDateKey(value: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(value);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function dayBounds(date: Date) {
  const key = argentinaDateKey(date);
  const start = new Date(`${key}T00:00:00${ARGENTINA_OFFSET}`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { key, start, end };
}

function pctChange(current: number, previous: number) {
  if (previous <= 0) return current > 0 ? null : 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

function avg(values: number[]) {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function materialIdFromEvent(row: AnalyticsRow) {
  const value = row.metadata?.material_id;
  return typeof value === 'string' ? value : null;
}

async function fetchAllEvents(
  admin: ReturnType<typeof createAdminClient>,
  startIso: string,
  endIso: string
) {
  const rows: AnalyticsRow[] = [];
  const pageSize = 1000;

  for (let offset = 0; offset < 10_000; offset += pageSize) {
    const { data, error } = await admin
      .from('analytics_events')
      .select('event_name, user_id, session_key, metadata, created_at')
      .gte('created_at', startIso)
      .lt('created_at', endIso)
      .order('created_at', { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (error) throw error;
    const batch = (data ?? []) as AnalyticsRow[];
    rows.push(...batch);
    if (batch.length < pageSize) break;
  }

  return rows;
}

export async function obtenerProductoDiarioAdministrador(): Promise<{
  success: boolean;
  stats?: ProductDailyStats;
  message?: string;
}> {
  try {
    await requireAdminAccess();
    const admin = createAdminClient();
    const adminUserIds = new Set(await listAdminUserIds());
    const now = new Date();
    const today = dayBounds(now);
    const yesterday = dayBounds(new Date(today.start.getTime() - 24 * 60 * 60 * 1000));

    const [events, usersResult, materialsTodayResult, olderProcessingResult, feedbackResult] =
      await Promise.all([
        fetchAllEvents(admin, today.start.toISOString(), today.end.toISOString()),
        admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
        admin
          .from('student_materials')
          .select('id, user_id, processing_status, created_at')
          .gte('created_at', today.start.toISOString())
          .lt('created_at', today.end.toISOString())
          .order('created_at', { ascending: true }),
        admin
          .from('student_materials')
          .select('id, user_id, processing_status, created_at')
          .lt('created_at', new Date(now.getTime() - 15 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false })
          .limit(2000),
        admin
          .from('student_material_feedback')
          .select('rating, report_reason, created_at')
          .gte('created_at', today.start.toISOString())
          .lt('created_at', today.end.toISOString()),
      ]);

    if (usersResult.error) throw usersResult.error;
    if (materialsTodayResult.error) throw materialsTodayResult.error;
    if (olderProcessingResult.error) throw olderProcessingResult.error;
    if (feedbackResult.error) throw feedbackResult.error;

    const users = usersResult.data.users.filter((user) => !adminUserIds.has(user.id));
    const materialsToday = ((materialsTodayResult.data ?? []) as MaterialRow[]).filter(
      (row) => !adminUserIds.has(row.user_id)
    );
    const feedback = (feedbackResult.data ?? []) as FeedbackRow[];

    const newUsersToday = users.filter((user) => {
      const created = new Date(user.created_at).getTime();
      return created >= today.start.getTime() && created < today.end.getTime();
    });
    const newUsersYesterday = users.filter((user) => {
      const created = new Date(user.created_at).getTime();
      return created >= yesterday.start.getTime() && created < yesterday.end.getTime();
    });

    const newUserIds = new Set(newUsersToday.map((user) => user.id));
    const activeLoggedUserIds = new Set(
      events
        .map((row) => row.user_id)
        .filter(
          (userId): userId is string =>
            Boolean(userId) && !adminUserIds.has(userId as string)
        )
    );
    const newLoggedUsers = Array.from(activeLoggedUserIds).filter((userId) =>
      newUserIds.has(userId)
    ).length;

    const pageViews = events.filter((row) => row.event_name === 'page_view');
    const sessionMap = new Map<string, { logged: boolean }>();
    for (const row of events) {
      if (!row.session_key) continue;
      const current = sessionMap.get(row.session_key) ?? { logged: false };
      if (row.user_id) current.logged = true;
      sessionMap.set(row.session_key, current);
    }
    const pageViewSessionKeys = Array.from(
      new Set(pageViews.map((row) => row.session_key).filter((value): value is string => Boolean(value)))
    );
    const loggedSessions = pageViewSessionKeys.filter(
      (sessionKey) => sessionMap.get(sessionKey)?.logged
    ).length;
    const anonymousSessions = Math.max(0, pageViewSessionKeys.length - loggedSessions);

    const gateViewNames = new Set(['pdf_gate_viewed', 'simulator_login_gate_viewed']);
    const gateClickNames = new Set(['pdf_gate_cta_clicked', 'simulator_login_gate_cta_clicked']);
    const gateViewedSessions = new Set(
      events
        .filter((row) => gateViewNames.has(row.event_name) && row.session_key)
        .map((row) => row.session_key as string)
    );
    const gateClickedSessions = new Set(
      events
        .filter((row) => gateClickNames.has(row.event_name) && row.session_key)
        .map((row) => row.session_key as string)
    );
    const signupSessions = new Set(
      events
        .filter((row) => row.event_name === 'signup_completed' && row.session_key)
        .map((row) => row.session_key as string)
    );
    const gateRegistered = Array.from(gateViewedSessions).filter((sessionKey) =>
      signupSessions.has(sessionKey)
    ).length;

    const materialIdsToday = materialsToday.map((row) => row.id);
    const uploaderIds = Array.from(new Set(materialsToday.map((row) => row.user_id)));

    const [jobsResult, allUploaderMaterialsResult, newUserMaterialsResult, aiUsageResult] =
      await Promise.all([
        materialIdsToday.length
          ? admin
              .from('student_material_jobs')
              .select('student_material_id, status, started_at, completed_at, created_at')
              .in('student_material_id', materialIdsToday)
          : Promise.resolve({ data: [], error: null }),
        uploaderIds.length
          ? admin
              .from('student_materials')
              .select('id, user_id, processing_status, created_at')
              .in('user_id', uploaderIds)
              .order('created_at', { ascending: true })
          : Promise.resolve({ data: [], error: null }),
        newUsersToday.length
          ? admin
              .from('student_materials')
              .select('id, user_id, processing_status, created_at')
              .in('user_id', newUsersToday.map((user) => user.id))
          : Promise.resolve({ data: [], error: null }),
        materialIdsToday.length
          ? admin
              .from('student_material_ai_usage')
              .select(
                'student_material_id, provider, prompt_tokens, completion_tokens, total_tokens'
              )
              .in('student_material_id', materialIdsToday)
          : Promise.resolve({ data: [], error: null }),
      ]);

    if (jobsResult.error) throw jobsResult.error;
    if (allUploaderMaterialsResult.error) throw allUploaderMaterialsResult.error;
    if (newUserMaterialsResult.error) throw newUserMaterialsResult.error;
    if (aiUsageResult.error) throw aiUsageResult.error;

    const jobs = (jobsResult.data ?? []) as JobRow[];
    const allUploaderMaterials = (allUploaderMaterialsResult.data ?? []) as MaterialRow[];
    const newUserMaterials = (newUserMaterialsResult.data ?? []) as MaterialRow[];
    const aiUsage = (aiUsageResult.data ?? []) as AiUsageRow[];

    const firstMaterialByUser = new Map<string, MaterialRow>();
    for (const material of allUploaderMaterials) {
      if (!firstMaterialByUser.has(material.user_id)) {
        firstMaterialByUser.set(material.user_id, material);
      }
    }

    let firstTimeUploaders = 0;
    let repeatUploaders = 0;
    const signupToFirstPdfSeconds: number[] = [];
    const usersById = new Map(users.map((user) => [user.id, user]));

    for (const userId of uploaderIds) {
      const firstMaterial = firstMaterialByUser.get(userId);
      if (!firstMaterial) continue;
      const firstAt = new Date(firstMaterial.created_at).getTime();
      if (firstAt >= today.start.getTime() && firstAt < today.end.getTime()) {
        firstTimeUploaders += 1;
        const user = usersById.get(userId);
        if (user) {
          const signupAt = new Date(user.created_at).getTime();
          if (firstAt >= signupAt) signupToFirstPdfSeconds.push((firstAt - signupAt) / 1000);
        }
      } else {
        repeatUploaders += 1;
      }
    }

    const processingDurations = jobs.flatMap((job) => {
      if (!job.started_at || !job.completed_at) return [];
      const started = new Date(job.started_at).getTime();
      const completed = new Date(job.completed_at).getTime();
      return completed >= started ? [(completed - started) / 1000] : [];
    });

    const stuckOver15m = ((olderProcessingResult.data ?? []) as MaterialRow[]).filter(
      (row) =>
        !adminUserIds.has(row.user_id) &&
        row.processing_status !== 'ready' &&
        row.processing_status !== 'failed'
    ).length;

    const openedEvents = events.filter((row) => row.event_name === 'student_material_study_opened');
    const openedMaterialIds = new Set(
      openedEvents.map(materialIdFromEvent).filter((value): value is string => Boolean(value))
    );
    const openedTodayUploaded = materialsToday.filter((row) => openedMaterialIds.has(row.id)).length;
    const uploadedWithoutOpen = materialsToday.filter(
      (row) => row.processing_status === 'ready' && !openedMaterialIds.has(row.id)
    ).length;

    const usersWithAnyMaterial = new Set(newUserMaterials.map((row) => row.user_id));
    const registeredWithoutPdf = newUsersToday.filter(
      (user) => !usersWithAnyMaterial.has(user.id)
    ).length;

    const paidEquivalentCost = aiUsage.reduce((total, row) => {
      if (row.provider !== 'gemini') return total;
      const prompt = row.prompt_tokens ?? 0;
      const completion = row.completion_tokens ?? 0;
      const totalTokens = row.total_tokens ?? prompt + completion;
      const output = Math.max(completion, totalTokens - prompt);
      return (
        total +
        (prompt / 1_000_000) * GEMINI_INPUT_USD_PER_MILLION +
        (output / 1_000_000) * GEMINI_OUTPUT_USD_PER_MILLION
      );
    }, 0);

    const relevantAiMaterials = new Set(aiUsage.map((row) => row.student_material_id)).size;

    const totalSessions = pageViewSessionKeys.length;
    const anonymousSessionPct =
      totalSessions > 0 ? Number(((anonymousSessions / totalSessions) * 100).toFixed(1)) : 0;
    const loggedSessionPct =
      totalSessions > 0 ? Number(((loggedSessions / totalSessions) * 100).toFixed(1)) : 0;

    return {
      success: true,
      stats: {
        dateLabel: new Intl.DateTimeFormat('es-AR', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          timeZone: 'America/Argentina/Buenos_Aires',
        }).format(now),
        generatedAt: now.toISOString(),
        funnel: {
          sessions: totalSessions,
          registrations: newUsersToday.length,
          pdfUploads: materialsToday.length,
          openedResults: openedTodayUploaded,
        },
        entry: {
          registrations: newUsersToday.length,
          registrationsTrendPct: pctChange(newUsersToday.length, newUsersYesterday.length),
          loggedUsers: activeLoggedUserIds.size,
          newLoggedUsers,
          recurrentLoggedUsers: Math.max(0, activeLoggedUserIds.size - newLoggedUsers),
          anonymousSessionPct,
          loggedSessionPct,
          failedLogins: events.filter((row) => row.event_name === 'login_error').length,
          gateViewed: gateViewedSessions.size,
          gateClicked: gateClickedSessions.size,
          gateRegistered,
        },
        activation: {
          uploads: materialsToday.length,
          ready: materialsToday.filter((row) => row.processing_status === 'ready').length,
          failed: materialsToday.filter((row) => row.processing_status === 'failed').length,
          stuckOver15m,
          averageProcessingSeconds: avg(processingDurations),
          firstTimeUploaders,
          repeatUploaders,
          averageSignupToFirstPdfSeconds: avg(signupToFirstPdfSeconds),
          averageAiCostUsd:
            relevantAiMaterials > 0 ? paidEquivalentCost / relevantAiMaterials : null,
        },
        usage: {
          openedMaterials: openedTodayUploaded,
          positiveFeedback: feedback.filter((row) => row.rating === 'up').length,
          negativeFeedbackOrReports: feedback.filter(
            (row) => row.rating === 'down' || Boolean(row.report_reason)
          ).length,
          registeredWithoutPdf,
          uploadedWithoutOpen,
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : 'No pudimos cargar el resumen diario de Producto.',
    };
  }
}
