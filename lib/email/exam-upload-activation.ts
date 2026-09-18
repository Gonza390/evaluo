import 'server-only';

import { createAdminClient } from '@/lib/supabase-admin';
import { sendSenderTemplate } from '@/lib/email/sender';
import { logError, logInfo } from '@/lib/observability';

const ARGENTINA_TIME_ZONE = 'America/Argentina/Buenos_Aires';
const CAMPAIGN_PREFIX = 'exam_upload_activation_v1';
const TARGET_DAYS = [7, 3, 1] as const;

type TargetDays = (typeof TARGET_DAYS)[number];

type CalendarCandidateRow = {
  id: string;
  user_id: string;
  materia_id: string;
  materia_nombre: string | null;
  event_date: string;
  exam_instance: string | null;
  created_at: string;
};

type StudentMaterialRow = {
  user_id: string;
  materia_id: string;
};

type ProfileRow = {
  id: string;
  nombre: string | null;
};

function getDateKeyInTimeZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function addDays(dateKey: string, days: number) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days, 12));
  return date.toISOString().slice(0, 10);
}

function formatExamDate(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
}

function getTemplateId(days: TargetDays) {
  const envName =
    days === 7
      ? 'SENDER_TEMPLATE_EXAM_UPLOAD_7D'
      : days === 3
        ? 'SENDER_TEMPLATE_EXAM_UPLOAD_3D'
        : 'SENDER_TEMPLATE_EXAM_UPLOAD_1D';
  return process.env[envName]?.trim() || null;
}

function getSubject(days: TargetDays, materia: string) {
  if (days === 7) return `Rendís ${materia} en una semana: preparalo con tus apuntes`;
  if (days === 3) return `Te quedan 3 días para ${materia}: subí tu material`;
  return `Mañana rendís ${materia}: hacé el último repaso con tu PDF`;
}

function getExamInstanceLabel(value: string | null) {
  if (value === 'parcial_1') return 'Parcial 1';
  if (value === 'parcial_2') return 'Parcial 2';
  if (value === 'integrador') return 'Integrador';
  return 'Examen';
}

function firstName(value: string | null | undefined) {
  const normalized = value?.trim();
  if (!normalized) return 'estudiante';
  return normalized.split(/\s+/)[0] || 'estudiante';
}

function buildUploadUrl(candidate: CalendarCandidateRow, days: TargetDays) {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://evaluo.com.ar').replace(/\/$/, '');
  const url = new URL('/dashboard', baseUrl);
  url.searchParams.set('openUpload', '1');
  url.searchParams.set('materiaId', candidate.materia_id);
  url.searchParams.set('examDate', candidate.event_date);
  url.searchParams.set('source', 'exam-upload-email');
  url.searchParams.set('utm_source', 'sender');
  url.searchParams.set('utm_medium', 'email');
  url.searchParams.set('utm_campaign', `exam_upload_activation_${days}d`);
  url.searchParams.set('utm_content', candidate.exam_instance || 'exam');
  return url.toString();
}

function buildCampaignKey(candidate: CalendarCandidateRow, days: TargetDays) {
  return `${CAMPAIGN_PREFIX}:${candidate.id}:${days}d`;
}

function isUniqueViolation(error: unknown) {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code?: string }).code === '23505'
  );
}

export async function runExamUploadActivationDispatch(options?: { dryRun?: boolean }) {
  const dryRun = Boolean(options?.dryRun);
  const enabled = process.env.EXAM_UPLOAD_ACTIVATION_ENABLED?.trim() === '1';
  const today = getDateKeyInTimeZone(new Date(), ARGENTINA_TIME_ZONE);
  const targetDates = new Map<string, TargetDays>(
    TARGET_DAYS.map((days) => [addDays(today, days), days])
  );

  const admin = createAdminClient();
  // Las tablas de lifecycle todavía no están completas en el tipo generado.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any;

  const { data: calendarRows, error: calendarError } = await db
    .from('study_calendar_events')
    .select('id,user_id,materia_id,materia_nombre,event_date,exam_instance,created_at,source_payload')
    .eq('event_type', 'exam')
    .in('event_date', [...targetDates.keys()])
    .not('materia_id', 'is', null)
    .contains('source_payload', { simulator_exam_context: true })
    .order('created_at', { ascending: true });

  if (calendarError) throw calendarError;

  const calendarCandidates = ((calendarRows ?? []) as CalendarCandidateRow[]).filter(
    (row) => Boolean(row.user_id && row.materia_id && targetDates.has(row.event_date))
  );

  const userIds = [...new Set(calendarCandidates.map((row) => row.user_id))];
  const materiaIds = [...new Set(calendarCandidates.map((row) => row.materia_id))];

  const [materialsResult, profilesResult] = await Promise.all([
    userIds.length && materiaIds.length
      ? db
          .from('student_materials')
          .select('user_id,materia_id')
          .in('user_id', userIds)
          .in('materia_id', materiaIds)
      : Promise.resolve({ data: [], error: null }),
    userIds.length
      ? db.from('profiles').select('id,nombre').in('id', userIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (materialsResult.error) throw materialsResult.error;
  if (profilesResult.error) throw profilesResult.error;

  const materialPairs = new Set(
    ((materialsResult.data ?? []) as StudentMaterialRow[]).map(
      (row) => `${row.user_id}:${row.materia_id}`
    )
  );
  const profileNameById = new Map(
    ((profilesResult.data ?? []) as ProfileRow[]).map((row) => [row.id, row.nombre])
  );

  const candidates = calendarCandidates.filter(
    (candidate) => !materialPairs.has(`${candidate.user_id}:${candidate.materia_id}`)
  );

  const summary = {
    success: true,
    dryRun,
    enabled,
    today,
    candidates: candidates.length,
    calendarMatches: calendarCandidates.length,
    skippedHasMaterial: calendarCandidates.length - candidates.length,
    sent: 0,
    duplicates: 0,
    missingTemplate: 0,
    missingEmail: 0,
    skippedDisabled: 0,
    failed: 0,
  };

  if (dryRun) {
    logInfo('examUploadActivation.dispatch', summary);
    return summary;
  }

  if (!enabled) {
    summary.skippedDisabled = candidates.length;
    logInfo('examUploadActivation.dispatch', summary);
    return summary;
  }

  for (const candidate of candidates) {
    const days = targetDates.get(candidate.event_date);
    if (!days) continue;

    const templateId = getTemplateId(days);
    if (!templateId) {
      summary.missingTemplate += 1;
      continue;
    }

    const { data: authUserResult, error: userError } = await admin.auth.admin.getUserById(
      candidate.user_id
    );
    if (userError) {
      logError('examUploadActivation.getUser', userError, { userId: candidate.user_id });
      summary.failed += 1;
      continue;
    }

    const authUser = authUserResult.user;
    if (!authUser?.email || !authUser.email_confirmed_at) {
      summary.missingEmail += 1;
      continue;
    }

    const campaignKey = buildCampaignKey(candidate, days);
    const { data: reservation, error: reservationError } = await db
      .from('email_campaign_deliveries')
      .insert({
        campaign_key: campaignKey,
        user_id: candidate.user_id,
        materia_id: candidate.materia_id,
        status: 'sending',
        context: {
          calendar_event_id: candidate.id,
          exam_date: candidate.event_date,
          exam_instance: candidate.exam_instance,
          days_left: days,
        },
      })
      .select('id')
      .single();

    if (reservationError) {
      if (isUniqueViolation(reservationError)) {
        summary.duplicates += 1;
        continue;
      }
      throw reservationError;
    }

    try {
      const fallbackName =
        typeof authUser.user_metadata?.full_name === 'string'
          ? authUser.user_metadata.full_name
          : typeof authUser.user_metadata?.name === 'string'
            ? authUser.user_metadata.name
            : null;
      const displayName = profileNameById.get(candidate.user_id) || fallbackName;
      const displayFirstName = firstName(displayName);
      const materia = candidate.materia_nombre?.trim() || 'tu materia';
      const examInstance = getExamInstanceLabel(candidate.exam_instance);
      const uploadUrl = buildUploadUrl(candidate, days);
      const formattedExamDate = formatExamDate(candidate.event_date);
      const subject = getSubject(days, materia);

      const senderResult = await sendSenderTemplate({
        templateId,
        toEmail: authUser.email,
        toName: displayName,
        variables: {
          subject,
          firstname: displayFirstName,
          nombre: displayFirstName,
          materia,
          parcial: examInstance,
          exam_instance: examInstance,
          exam_date: formattedExamDate,
          fecha_del_examen: formattedExamDate,
          exam_date_iso: candidate.event_date,
          days_left: days,
          upload_url: uploadUrl,
          cta_url: uploadUrl,
        },
      });

      const now = new Date().toISOString();
      const { error: markSentError } = await db
        .from('email_campaign_deliveries')
        .update({
          status: 'sent',
          sender_email_id: senderResult.emailId,
          sent_at: now,
          updated_at: now,
        })
        .eq('id', reservation.id);

      if (markSentError) {
        logError('examUploadActivation.markSent', markSentError, {
          deliveryId: reservation.id,
          campaignKey,
        });
      }

      summary.sent += 1;
    } catch (error) {
      summary.failed += 1;
      logError('examUploadActivation.send', error, {
        userId: candidate.user_id,
        materiaId: candidate.materia_id,
        eventId: candidate.id,
        days,
      });

      const { error: cleanupError } = await db
        .from('email_campaign_deliveries')
        .delete()
        .eq('id', reservation.id);
      if (cleanupError) {
        logError('examUploadActivation.cleanupReservation', cleanupError, {
          deliveryId: reservation.id,
        });
      }
    }
  }

  logInfo('examUploadActivation.dispatch', summary);
  return summary;
}
