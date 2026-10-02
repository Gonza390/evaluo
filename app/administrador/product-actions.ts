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
  device_type: string | null;
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
  user_id: string | null;
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
  dateKey: string;
  todayKey: string;
  dateLabel: string;
  isToday: boolean;
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

function dayBoundsFromKey(key: string) {
  const start = new Date(`${key}T00:00:00${ARGENTINA_OFFSET}`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { key, start, end };
}

function normalizeRequestedDateKey(value: string | null | undefined, now: Date) {
  const todayKey = argentinaDateKey(now);
  const requested = String(value ?? '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(requested)) return todayKey;

  const parsed = new Date(`${requested}T00:00:00${ARGENTINA_OFFSET}`);
  if (Number.isNaN(parsed.getTime())) return todayKey;
  return requested > todayKey ? todayKey : requested;
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

function isClientAnalyticsEvent(row: AnalyticsRow) {
  if (!row.session_key) return false;
  if (row.device_type === 'server') return false;
  if (row.session_key.startsWith('server:')) return false;
  return true;
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
      .select('event_name, user_id, session_key, device_type, metadata, created_at')
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

export async function obtenerProductoDiarioAdministrador(
  requestedDateKey?: string | null
): Promise<{
  success: boolean;
  stats?: ProductDailyStats;
  message?: string;
}> {
  try {
    await requireAdminAccess();
    const admin = createAdminClient();
    const adminUserIds = new Set(await listAdminUserIds());
    const now = new Date();
    const todayKey = argentinaDateKey(now);
    const selectedDateKey = normalizeRequestedDateKey(requestedDateKey, now);
    const selectedDay = dayBoundsFromKey(selectedDateKey);
    const previousDay = dayBoundsFromKey(
      argentinaDateKey(new Date(selectedDay.start.getTime() - 24 * 60 * 60 * 1000))
    );
    const isToday = selectedDateKey === todayKey;

    const [events, usersResult, materialsTodayResult, olderProcessingResult, feedbackResult] =
      await Promise.all([
        fetchAllEvents(admin, selectedDay.start.toISOString(), selectedDay.end.toISOString()),
        admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
        admin
          .from('student_materials')
          .select('id, user_id, processing_status, created_at')
          .gte('created_at', selectedDay.start.toISOString())
          .lt('created_at', selectedDay.end.toISOString())
          .order('created_at', { ascending: true }),
        Promise.resolve({ data: [], error: null }),
        admin
          .from('student_material_feedback')
          .select('user_id, rating, report_reason, created_at')
          .gte('created_at', selectedDay.start.toISOString())
          .lt('created_at', selectedDay.end.toISOString()),
      ]);

    if (usersResult.error) throw usersResult.error;
    if (materialsTodayResult.error) throw materialsTodayResult.error;
    if (olderProcessingResult.error) throw olderProcessingResult.error;
    if (feedbackResult.error) throw feedbackResult.error;

    const users = usersResult.data.users.filter((user) => !adminUserIds.has(user.id));
    const materialsToday = ((materialsTodayResult.data ?? []) as MaterialRow[]).filter(
      (row) => !adminUserIds.has(row.user_id)
    );
    const feedback = ((feedbackResult.data ?? []) as FeedbackRow[]).filter(
      (row) => !row.user_id || !adminUserIds.has(row.user_id)
    );

    const newUsersToday = users.filter((user) => {
      const created = new Date(user.created_at).getTime();
      return created >= selectedDay.start.getTime() && created < selectedDay.end.getTime();
    });
    const newUsersYesterday = users.filter((user) => {
      const created = new Date(user.created_at).getTime();
      return created >= previousDay.start.getTime() && created < previousDay.end.getTime();
    });

    const nonAdminEvents = events.filter(
      (row) => !row.user_id || !adminUserIds.has(row.user_id)
    );
    const clientEvents = events.filter(isClientAnalyticsEvent);
    const adminClientSessionKeys = new Set(
      clientEvents
        .filter((row) => Boolean(row.user_id) && adminUserIds.has(row.user_id as string))
        .map((row) => row.session_key as string)
    );
    const productClientEvents = clientEvents.filter(
      (row) =>
        (!row.user_id || !adminUserIds.has(row.user_id)) &&
        !adminClientSessionKeys.has(row.session_key as string)
    );

    const newUserIds = new Set(newUsersToday.map((user) => user.id));
    const activeLoggedUserIds = new Set(
      productClientEvents
        .map((row) => row.user_id)
        .filter((userId): userId is string => Boolean(userId))
    );
    const newLoggedUsers = Array.from(activeLoggedUserIds).filter((userId) =>
      newUserIds.has(userId)
    ).length;

    const sessionMap = new Map<string, { logged: boolean }>();
    for (const row of productClientEvents) {
      const sessionKey = row.session_key as string;
      const current = sessionMap.get(sessionKey) ?? { logged: false };
      if (row.user_id) current.logged = true;
      sessionMap.set(sessionKey, current);
    }
    const clientSessionKeys = Array.from(sessionMap.keys());
    const loggedSessions = clientSessionKeys.filter(
      (sessionKey) => sessionMap.get(sessionKey)?.logged
    ).length;
    const anonymousSessions = Math.max(0, clientSessionKeys.length - loggedSessions);

    const gateViewNames = new Set(['pdf_gate_viewed', 'simulator_login_gate_viewed']);
    const gateClickNames = new Set(['pdf_gate_cta_clicked', 'simulator_login_gate_cta_clicked']);
    const gateViewedSessions = new Set(
      productClientEvents
        .filter((row) => gateViewNames.has(row.event_name) && row.session_key)
        .map((row) => row.session_key as string)
    );
    const gateClickedSessions = new Set(
      productClientEvents
        .filter((row) => gateClickNames.has(row.event_name) && row.session_key)
        .map((row) => row.session_key as string)
    );
    const signupSessions = new Set(
      productClientEvents
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
      if (firstAt >= selectedDay.start.getTime() && firstAt < selectedDay.end.getTime()) {
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

    const jobsByMaterialId = new Map<string, JobRow[]>();
    for (const job of jobs) {
      const list = jobsByMaterialId.get(job.student_material_id) ?? [];
      list.push(job);
      jobsByMaterialId.set(job.student_material_id, list);
    }

    const selectedDayReferenceMs = isToday ? now.getTime() : selectedDay.end.getTime();
    const stuckOver15m = materialsToday.filter((material) => {
      const materialJobs = jobsByMaterialId.get(material.id) ?? [];
      const exceeded15mHistorically = materialJobs.some((job) => {
        const startedAt = job.started_at ? new Date(job.started_at).getTime() : null;
        const completedAt = job.completed_at ? new Date(job.completed_at).getTime() : null;
        if (startedAt === null) return false;
        if (completedAt !== null) return completedAt - startedAt > 15 * 60 * 1000;
        return selectedDayReferenceMs - startedAt > 15 * 60 * 1000;
      });

      if (exceeded15mHistorically) return true;
      if (!isToday) return false;

      const createdAt = new Date(material.created_at).getTime();
      return (
        material.processing_status !== 'ready' &&
        material.processing_status !== 'failed' &&
        now.getTime() - createdAt > 15 * 60 * 1000
      );
    }).length;

    const openedEvents = nonAdminEvents.filter(
      (row) => row.event_name === 'student_material_study_opened'
    );
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

    const totalSessions = clientSessionKeys.length;
    const anonymousSessionPct =
      totalSessions > 0 ? Number(((anonymousSessions / totalSessions) * 100).toFixed(1)) : 0;
    const loggedSessionPct =
      totalSessions > 0 ? Number(((loggedSessions / totalSessions) * 100).toFixed(1)) : 0;

    return {
      success: true,
      stats: {
        dateKey: selectedDateKey,
        todayKey,
        dateLabel: new Intl.DateTimeFormat('es-AR', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          timeZone: 'America/Argentina/Buenos_Aires',
        }).format(selectedDay.start),
        isToday,
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
          failedLogins: productClientEvents.filter((row) => row.event_name === 'login_error').length,
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
