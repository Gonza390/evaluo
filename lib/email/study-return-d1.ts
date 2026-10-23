import 'server-only';

import { createAdminClient } from '@/lib/supabase-admin';
import { getDashboardNextStudyAction, type DashboardNextStudyAction } from '@/lib/dashboard-next-study-action';
import type { StudentMaterial } from '@/lib/data/student-materials';
import { logError, logInfo } from '@/lib/observability';
import { sendSenderTransactional } from '@/lib/email/sender';
import { canSendPdfStudyNudge } from '@/lib/email/pdf-study-frequency';
import { getRealStudyMaterialId } from '@/lib/email/study-return-material-id';

const CAMPAIGN_KEY = 'study_return_d1_v1';
const INACTIVE_HOURS = 24;
const MAX_INACTIVE_HOURS = 48;
const LOOKBACK_HOURS = 72;
const BATCH_SIZE = 50;
const MAX_EVENTS = 5000;

type AnalyticsRow = {
  user_id: string | null;
  event_name: string;
  path: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

type Candidate = {
  userId: string;
  materialId: string;
  lastStudyAt: string;
  lastActivityAt: string;
};

type ProfileRow = {
  id: string;
  nombre: string | null;
  role: string | null;
};

function firstName(value: string | null | undefined) {
  const normalized = value?.trim();
  if (!normalized) return 'estudiante';
  return normalized.split(/\s+/)[0] || 'estudiante';
}

function truncate(value: string, max = 76) {
  const normalized = value.trim();
  if (!normalized) return 'tu material';
  return normalized.length <= max ? normalized : `${normalized.slice(0, max - 1).trimEnd()}…`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function metadataString(row: AnalyticsRow, key: string) {
  const value = row.metadata?.[key];
  return typeof value === 'string' ? value : null;
}

function materialIdFromEvent(row: AnalyticsRow) {
  return getRealStudyMaterialId(row);
}

function isMeaningfulStudySignal(row: AnalyticsRow) {
  if (!materialIdFromEvent(row)) return false;

  if (row.event_name === 'study_tab_engagement') {
    const activeMs = Number(row.metadata?.active_ms ?? 0);
    return Number.isFinite(activeMs) && activeMs >= 30_000;
  }

  if (row.event_name === 'meaningful_study_completed') {
    return metadataString(row, 'content_type') === 'student_material';
  }

  return new Set([
    'student_material_study_opened',
    'summary_reading_started',
    'summary_completed',
    'student_material_exam_started',
    'student_material_exam_completed',
    'student_material_flashcards_started',
    'study_error_viewed',
    'study_error_reviewed',
    'study_error_repractice_started',
    'study_error_resolved',
  ]).has(row.event_name);
}

function materialTitle(material: StudentMaterial) {
  return truncate(material.title?.trim() || material.file_name?.trim() || 'tu material');
}

function buildTrackedReturnUrl(action: DashboardNextStudyAction) {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://evaluo.com.ar').replace(/\/$/, '');
  const url = new URL(action.href, baseUrl);
  url.searchParams.set('utm_source', 'sender');
  url.searchParams.set('utm_medium', 'email');
  url.searchParams.set('utm_campaign', CAMPAIGN_KEY);
  url.searchParams.set('utm_content', action.kind);
  return url.toString();
}

export function buildStudyReturnD1Message(input: {
  firstname: string;
  materialTitle: string;
  action: Pick<DashboardNextStudyAction, 'kind' | 'title' | 'description' | 'cta'>;
  returnUrl: string;
  pendingTopics?: string[];
}) {
  const title = truncate(input.materialTitle);
  const safeFirstName = escapeHtml(input.firstname);
  const safeTitle = escapeHtml(title);
  const safeUrl = escapeHtml(input.returnUrl);
  const safeCta = escapeHtml(input.action.cta);
  const safeNextStep = escapeHtml(input.action.description);
  const topics = [...new Set((input.pendingTopics ?? []).map((topic) => topic.trim()).filter(Boolean))].slice(0, 2);
  const topicsHtml = topics.length ? `<p style="margin:0 0 10px;font-weight:700;font-size:14px;color:#0F1B3D;">Temas para reforzar</p><ul style="padding-left:20px;margin:0 0 12px;color:#334155;">${topics.map((topic) => `<li>${escapeHtml(topic)}</li>`).join('')}</ul>` : '';

  const copyByKind: Record<
    DashboardNextStudyAction['kind'],
    { subject: string; heading: string; paragraph: string }
  > = {
    reinforce: {
      subject: `Volvé a reforzar ${title}`,
      heading: input.action.title,
      paragraph: `Ya avanzaste con ${title}. Volvé a los puntos que te costaron y comprobá si ahora los entendés mejor.`,
    },
    resume_practice: {
      subject: `Te quedó una práctica de ${title} pendiente`,
      heading: 'Tenés una práctica pendiente',
      paragraph: `Ya empezaste a practicar ${title}. Retomá desde ahí y terminá de comprobar qué entendiste.`,
    },
    start_practice: {
      subject: `Ya terminaste el resumen de ${title}`,
      heading: 'Ahora comprobá qué entendiste',
      paragraph: `Ya recorriste el resumen de ${title}. El próximo paso es practicar para detectar qué parte necesitás reforzar antes de seguir.`,
    },
    saved_objective: {
      subject: `Tenés un repaso listo de ${title}`,
      heading: input.action.title,
      paragraph: `Preparaste tu próximo objetivo en ${title}. Retomá el repaso que Evaluo te dejó guardado.`,
    },
    continue_summary: {
      subject: `Seguí con ${title} desde donde lo dejaste`,
      heading: `Continuá con ${title}`,
      paragraph: `Hace más de un día que no volvés a este material. Retomalo desde el resumen y seguí avanzando con tu próximo paso de estudio.`,
    },
  };

  const copy = copyByKind[input.action.kind];
  const safeHeading = escapeHtml(copy.heading);
  const safeParagraph = escapeHtml(copy.paragraph);

  const html = `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:0;background:#F5F7FB;font-family:Inter,Arial,sans-serif;color:#0F1B3D;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F5F7FB;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#FFFFFF;border:1px solid #E7EBF4;border-radius:20px;">
            <tr>
              <td style="padding:32px;">
                <div style="margin-bottom:28px;"><img src="https://evaluo.com.ar/evaluo-logo-email.png" width="180" height="66" alt="Evaluo" style="display:block;width:180px;height:66px;border:0;" /></div>
                <p style="margin:0 0 12px;font-size:15px;line-height:1.6;">Hola ${safeFirstName},</p>
                <h1 style="margin:0 0 12px;font-size:24px;line-height:1.25;letter-spacing:-0.02em;color:#0F1B3D;">${safeHeading}</h1>
                <p style="margin:0 0 8px;font-size:13px;line-height:1.5;font-weight:700;color:#6366F1;">${safeTitle}</p>
                <p style="margin:0 0 16px;font-size:16px;line-height:1.65;color:#475569;">${safeParagraph}</p>
                <div style="padding:14px 18px;border:1px solid #DCE6F9;border-radius:12px;background:#F4F7FF;margin:0 0 22px;">${topicsHtml}<p style="margin:0;font-size:14px;line-height:1.5;color:#334155;">${safeNextStep}</p></div>
                <a href="${safeUrl}" style="display:inline-block;background:#2563EB;color:#FFFFFF;text-decoration:none;font-weight:700;font-size:15px;padding:13px 20px;border-radius:12px;">${safeCta}</a>
                <p style="margin:28px 0 0;font-size:12px;line-height:1.5;color:#94A3B8;">Te enviamos este mensaje porque estudiaste este material recientemente en Evaluo y todavía tenés un próximo paso disponible.</p>
                <div style="margin-top:30px;padding-top:24px;border-top:1px solid #E7EBF4;text-align:center;">
<p style="margin:0;font-size:14px;line-height:1.5;font-weight:700;color:#0F1B3D;">Equipo Evaluo</p>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = `Hola ${input.firstname}. ${copy.heading}. ${copy.paragraph} ${input.action.cta}: ${input.returnUrl}`;

  return { subject: copy.subject, html, text };
}

function isUniqueViolation(error: unknown) {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code?: string }).code === '23505'
  );
}

export async function runStudyReturnD1Dispatch(options?: { dryRun?: boolean }) {
  const dryRun = Boolean(options?.dryRun);
  const enabled = process.env.STUDY_RETURN_D1_ENABLED?.trim() === '1';
  const nowMs = Date.now();
  const cutoff24Ms = nowMs - INACTIVE_HOURS * 60 * 60 * 1000;
  const cutoff48Ms = nowMs - MAX_INACTIVE_HOURS * 60 * 60 * 1000;
  const lookback = new Date(nowMs - LOOKBACK_HOURS * 60 * 60 * 1000).toISOString();
  const recentEmailCutoff = new Date(cutoff24Ms).toISOString();

  const admin = createAdminClient();
  // Varias tablas lifecycle todavía no están incluidas en los tipos generados.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any;

  const { data: eventData, error: eventsError } = await db
    .from('analytics_events')
    .select('user_id,event_name,path,metadata,created_at')
    .not('user_id', 'is', null)
    .gte('created_at', lookback)
    .order('created_at', { ascending: false })
    .limit(MAX_EVENTS);

  if (eventsError) throw eventsError;

  const events = (eventData ?? []) as AnalyticsRow[];
  const grouped = new Map<string, AnalyticsRow[]>();

  for (const event of events) {
    if (!event.user_id) continue;
    const rows = grouped.get(event.user_id) ?? [];
    rows.push(event);
    grouped.set(event.user_id, rows);
  }

  const rawCandidates: Candidate[] = [];
  for (const [userId, rows] of grouped) {
    const lastActivity = rows[0];
    const lastActivityMs = Date.parse(lastActivity.created_at);
    if (!Number.isFinite(lastActivityMs)) continue;
    if (lastActivityMs > cutoff24Ms || lastActivityMs <= cutoff48Ms) continue;

    const studyEvent = rows.find((row) => {
      const studyAt = Date.parse(row.created_at);
      return studyAt > cutoff48Ms && isMeaningfulStudySignal(row);
    });
    const materialId = studyEvent ? materialIdFromEvent(studyEvent) : null;
    if (!studyEvent || !materialId) continue;

    rawCandidates.push({
      userId,
      materialId,
      lastStudyAt: studyEvent.created_at,
      lastActivityAt: lastActivity.created_at,
    });

    if (rawCandidates.length >= BATCH_SIZE * 3) break;
  }

  const summary = {
    success: true,
    dryRun,
    enabled,
    campaignKey: CAMPAIGN_KEY,
    inactiveHours: INACTIVE_HOURS,
    maxInactiveHours: MAX_INACTIVE_HOURS,
    candidates: rawCandidates.length,
    eligible: 0,
    sent: 0,
    duplicates: 0,
    skippedDisabled: 0,
    skippedAdmin: 0,
    skippedRecentEmail: 0,
    skippedFrequency: 0,
    skippedInvalid: 0,
    failed: 0,
    actions: {
      reinforce: 0,
      resume_practice: 0,
      start_practice: 0,
      continue_summary: 0,
      saved_objective: 0,
    },
  };

  async function persistHeartbeat() {
    const { error } = await db.from('analytics_events').insert({
      event_name: 'study_return_d1_dispatch',
      session_key: 'server:study-return-d1',
      path: '/api/internal/study-return-d1',
      metadata: summary,
    });
    if (error) logError('studyReturnD1.heartbeat', error, summary);
  }

  if (rawCandidates.length === 0) {
    await persistHeartbeat();
    return summary;
  }

  const userIds = [...new Set(rawCandidates.map((candidate) => candidate.userId))];
  const materialIds = [...new Set(rawCandidates.map((candidate) => candidate.materialId))];
  const next24h = new Date(nowMs + 24 * 60 * 60 * 1000).toISOString();

  const [
    profilesResult,
    materialsResult,
    campaignResult,
    examResult,
    readyResult,
    flashRecentResult,
    flashPendingResult,
  ] = await Promise.all([
    db.from('profiles').select('id,nombre,role').in('id', userIds),
    db.from('student_materials').select('*').in('id', materialIds).eq('processing_status', 'ready'),
    db
      .from('email_campaign_deliveries')
      .select('user_id')
      .in('user_id', userIds)
      .gte('created_at', recentEmailCutoff),
    db
      .from('email_reminder_deliveries')
      .select('user_id')
      .in('user_id', userIds)
      .gte('created_at', recentEmailCutoff)
      .not('status', 'in', '(pending,cancelled)'),
    db
      .from('student_material_ready_emails')
      .select('user_id')
      .in('user_id', userIds)
      .gte('created_at', recentEmailCutoff)
      .in('status', ['sending', 'sent']),
    db
      .from('flashcard_review_reminders')
      .select('user_id')
      .in('user_id', userIds)
      .gte('created_at', recentEmailCutoff)
      .in('status', ['sending', 'sent']),
    db
      .from('flashcard_review_reminders')
      .select('user_id')
      .in('user_id', userIds)
      .eq('status', 'pending')
      .lte('scheduled_for', next24h),
  ]);

  for (const result of [
    profilesResult,
    materialsResult,
    campaignResult,
    examResult,
    readyResult,
    flashRecentResult,
    flashPendingResult,
  ]) {
    if (result.error) throw result.error;
  }

  const profiles = (profilesResult.data ?? []) as ProfileRow[];
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const materialById = new Map(
    ((materialsResult.data ?? []) as StudentMaterial[]).map((material) => [material.id, material])
  );

  const blockedUsers = new Set<string>();
  for (const result of [
    campaignResult,
    examResult,
    readyResult,
    flashRecentResult,
    flashPendingResult,
  ]) {
    for (const row of result.data ?? []) {
      const userId = (row as { user_id?: string }).user_id;
      if (userId) blockedUsers.add(userId);
    }
  }

  if (!enabled && !dryRun) {
    summary.skippedDisabled = rawCandidates.length;
    await persistHeartbeat();
    logInfo('studyReturnD1.dispatch', summary);
    return summary;
  }

  for (const candidate of rawCandidates) {
    if (summary.sent >= BATCH_SIZE) break;

    const profile = profileById.get(candidate.userId);
    if (profile?.role === 'admin') {
      summary.skippedAdmin += 1;
      continue;
    }
    if (blockedUsers.has(candidate.userId)) {
      summary.skippedRecentEmail += 1;
      continue;
    }
    if (!dryRun && !(await canSendPdfStudyNudge(candidate.userId))) {
      summary.skippedFrequency += 1;
      continue;
    }

    const material = materialById.get(candidate.materialId);
    if (!material || material.user_id !== candidate.userId) {
      summary.skippedInvalid += 1;
      continue;
    }

    const action = await getDashboardNextStudyAction(candidate.userId, [material]);
    if (!action) {
      summary.skippedInvalid += 1;
      continue;
    }

    summary.eligible += 1;
    summary.actions[action.kind] += 1;
    if (dryRun) continue;

    const userResult = await admin.auth.admin.getUserById(candidate.userId);
    if (userResult.error) {
      summary.failed += 1;
      logError('studyReturnD1.user', userResult.error, { userId: candidate.userId });
      continue;
    }

    const user = userResult.data.user;
    if (!user?.email || !user.email_confirmed_at) {
      summary.skippedInvalid += 1;
      continue;
    }

    const displayName =
      profile?.nombre ||
      (typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : null) ||
      (typeof user.user_metadata?.name === 'string' ? user.user_metadata.name : null);
    const pendingTopics = action.kind === 'reinforce'
      ? await db.from('study_errors').select('topic').eq('user_id', candidate.userId)
          .eq('student_material_id', material.id).eq('status', 'pending').limit(50)
      : { data: [], error: null };
    if (pendingTopics.error) logError('studyReturnD1.pendingTopics', pendingTopics.error, { userId: candidate.userId });
    const returnUrl = buildTrackedReturnUrl(action);
    const message = buildStudyReturnD1Message({
      firstname: firstName(displayName),
      materialTitle: materialTitle(material),
      action,
      returnUrl,
      pendingTopics: (pendingTopics.data ?? []).map((x: { topic: string | null }) => x.topic ?? '').filter(Boolean),
    });
    const uniqueCampaignKey = `${CAMPAIGN_KEY}:${candidate.lastStudyAt}`;

    const { data: reservation, error: reservationError } = await db
      .from('email_campaign_deliveries')
      .insert({
        campaign_key: uniqueCampaignKey,
        user_id: candidate.userId,
        materia_id: material.materia_id ?? null,
        status: 'sending',
        context: {
          campaign_family: CAMPAIGN_KEY,
          delivery_mode: 'transactional',
          material_id: material.id,
          material_title: materialTitle(material),
          last_study_at: candidate.lastStudyAt,
          last_activity_at: candidate.lastActivityAt,
          inactivity_hours: INACTIVE_HOURS,
          action_kind: action.kind,
          action_title: action.title,
          action_cta: action.cta,
          destination: action.href,
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
      const senderResult = await sendSenderTransactional({
        toEmail: user.email,
        toName: displayName,
        subject: message.subject,
        text: message.text,
        html: message.html,
      });

      const sentAt = new Date().toISOString();
      const { error: markSentError } = await db
        .from('email_campaign_deliveries')
        .update({
          status: 'sent',
          sender_email_id: senderResult.emailId,
          sent_at: sentAt,
          triggered_at: sentAt,
          updated_at: sentAt,
        })
        .eq('id', reservation.id);

      if (markSentError) {
        logError('studyReturnD1.markSent', markSentError, {
          deliveryId: reservation.id,
          userId: candidate.userId,
        });
      }

      const { error: analyticsError } = await db.from('analytics_events').insert({
        event_name: 'study_return_d1_sent',
        user_id: candidate.userId,
        session_key: 'server:study-return-d1',
        path: '/api/internal/study-return-d1',
        metadata: {
          campaign_key: CAMPAIGN_KEY,
          material_id: material.id,
          action_kind: action.kind,
          last_study_at: candidate.lastStudyAt,
          last_activity_at: candidate.lastActivityAt,
          sender_email_id: senderResult.emailId,
        },
      });

      if (analyticsError) {
        logError('studyReturnD1.analytics', analyticsError, {
          deliveryId: reservation.id,
          userId: candidate.userId,
        });
      }

      summary.sent += 1;
      blockedUsers.add(candidate.userId);
    } catch (error) {
      summary.failed += 1;
      logError('studyReturnD1.send', error, {
        userId: candidate.userId,
        materialId: material.id,
        actionKind: action.kind,
      });

      const { error: cleanupError } = await db
        .from('email_campaign_deliveries')
        .delete()
        .eq('id', reservation.id);

      if (cleanupError) {
        logError('studyReturnD1.cleanupReservation', cleanupError, {
          deliveryId: reservation.id,
        });
      }
    }
  }

  await persistHeartbeat();
  logInfo('studyReturnD1.dispatch', summary);
  return summary;
}
