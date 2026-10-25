import 'server-only';

import { createAdminClient } from '@/lib/supabase-admin';
import { logError, logInfo } from '@/lib/observability';
import { sendSenderTransactional } from '@/lib/email/sender';
import { canSendPdfStudyNudge } from '@/lib/email/pdf-study-frequency';

const CAMPAIGN_KEY = 'study_return_48h_v1';
const INACTIVE_HOURS = 48;
// Extend the candidate window so the second message can respect D+1 cooldown.
const CANDIDATE_WINDOW_HOURS = 96;
const D1_COOLDOWN_HOURS = 36;
const MAX_STUDY_AGE_DAYS = 7;
const BATCH_SIZE = 50;

type Candidate = {
  user_id: string;
  email: string;
  display_name: string | null;
  material_id: string;
  material_title: string;
  last_study_at: string;
  last_activity_at: string;
  pending_count: number;
};

function firstName(value: string | null | undefined) {
  const normalized = value?.trim();
  if (!normalized) return 'estudiante';
  return normalized.split(/\s+/)[0] || 'estudiante';
}

function truncate(value: string, max = 88) {
  const normalized = value.trim();
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

function buildReturnUrl(materialId: string, hasPending: boolean) {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://evaluo.com.ar').replace(/\/$/, '');
  // Open the PDF's progress directly; intermediate redirects strip UTM tags.
  const url = new URL(`/materiales/${materialId}`, baseUrl);
  url.searchParams.set('tab', hasPending ? 'progreso' : 'ejercicios');
  url.searchParams.set('utm_source', 'sender');
  url.searchParams.set('utm_medium', 'email');
  url.searchParams.set('utm_campaign', CAMPAIGN_KEY);
  url.searchParams.set('utm_content', hasPending ? 'review_pending' : 'continue_studying');
  return url.toString();
}

export function buildStudyReturn48hMessage(input: {
  firstname: string;
  materialTitle: string;
  pendingCount: number;
  pendingTopics: string[];
  returnUrl: string;
}) {
  const title = truncate(input.materialTitle);
  const hasPending = input.pendingCount > 0;

  const subject = hasPending
    ? `Un repaso breve para tus temas de ${title}`
    : `¿Hacemos una práctica corta de ${title}?`;

  const heading = hasPending
    ? 'Elegí un tema para reforzar hoy'
    : 'Retomá con una práctica breve';

  const paragraph = hasPending
    ? `En tu último estudio de ${title} quedaron ${input.pendingCount} ${input.pendingCount === 1 ? 'tema pendiente' : 'temas pendientes'}. No hace falta empezar todo el PDF: elegí uno y volvé a practicarlo.`
    : `Hace unos días estudiaste ${title}. Si querés retomarlo, una práctica corta con tu PDF puede ayudarte a comprobar qué recordás.`;

  const cta = hasPending ? 'Elegir un tema para repasar' : 'Ir a mi práctica';
  const topicNames = [...new Set(input.pendingTopics.map((t) => t.trim()).filter(Boolean))].slice(0, 3);
  const topicHtml = hasPending && topicNames.length ? `<div style="background:#F4F7FF;border:1px solid #DCE6F9;border-radius:12px;padding:14px 18px;margin:0 0 22px;"><p style="margin:0 0 10px;font-weight:700;font-size:14px;">Temas que te conviene repasar</p><ul style="padding-left:18px;margin:0;">${topicNames.map((name) => `<li style="margin-bottom:5px;">${escapeHtml(name)}</li>`).join('')}</ul></div>` : '';

  const safeFirstName = escapeHtml(input.firstname);
  const safeHeading = escapeHtml(heading);
  const safeParagraph = escapeHtml(paragraph);
  const safeCta = escapeHtml(cta);
  const safeUrl = escapeHtml(input.returnUrl);

  const html = `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:0;background:#F5F7FB;font-family:Inter,Arial,sans-serif;color:#0F1B3D;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F5F7FB;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#FFFFFF;border:1px solid #E7EBF4;border-radius:20px;">
            <tr>
              <td style="padding:32px;">
                <div style="margin-bottom:28px;"><img src="https://evaluo.com.ar/evaluo-logo-landing-email.png" width="40" height="40" alt="" style="display:inline-block;width:40px;height:40px;vertical-align:middle;border:0;" /><span style="display:inline-block;vertical-align:middle;margin-left:10px;font-size:22px;line-height:40px;font-weight:800;letter-spacing:-0.04em;color:#0F1B3D;">Evaluo</span></div>
                <p style="margin:0 0 12px;font-size:15px;line-height:1.6;">Hola ${safeFirstName},</p>
                <h1 style="margin:0 0 12px;font-size:24px;line-height:1.25;letter-spacing:-0.02em;color:#0F1B3D;">${safeHeading}</h1>
                <p style="margin:0 0 24px;font-size:16px;line-height:1.65;color:#475569;">${safeParagraph}</p>
                ${topicHtml}
                <a href="${safeUrl}" style="display:inline-block;background:#2563EB;color:#FFFFFF;text-decoration:none;font-weight:700;font-size:15px;padding:13px 20px;border-radius:12px;">${safeCta}</a>
                <p style="margin:28px 0 0;font-size:12px;line-height:1.5;color:#94A3B8;">Este repaso se basa en la actividad y los temas pendientes de tu propio PDF.</p>
                <div style="margin-top:30px;padding-top:24px;border-top:1px solid #E7EBF4;text-align:center;">
<p style="margin:0;font-size:14px;line-height:1.5;font-weight:700;color:#0F1B3D;">Equipo Evaluo</p>
                  <img src="https://evaluo.com.ar/evaluo-logo-landing-email.png" width="36" height="36" alt="Evaluo" style="display:block;width:36px;height:36px;margin:12px auto 0;border:0;" />
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = hasPending
    ? `Hola ${input.firstname}. Te quedaron ${input.pendingCount} conceptos para reforzar de ${title}. Volvé a estudiarlos: ${input.returnUrl}`
    : `Hola ${input.firstname}. Hace un par de días estuviste trabajando con ${title}. Continuá estudiando: ${input.returnUrl}`;

  return { subject, html, text };
}

function isUniqueViolation(error: unknown) {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code?: string }).code === '23505'
  );
}

export async function runStudyReturn48hDispatch(options?: { dryRun?: boolean }) {
  const dryRun = Boolean(options?.dryRun);
  const enabled = process.env.STUDY_RETURN_48H_ENABLED?.trim() === '1';
  const now = Date.now();
  const cutoff = new Date(now - INACTIVE_HOURS * 60 * 60 * 1000).toISOString();
  const minCutoff = new Date(now - CANDIDATE_WINDOW_HOURS * 60 * 60 * 1000).toISOString();
  const studyMin = new Date(now - MAX_STUDY_AGE_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const admin = createAdminClient();
  // RPC/table are intentionally accessed with the service-role client.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any;

  const { data, error } = await db.rpc('get_study_return_48h_candidates', {
    p_cutoff: cutoff,
    p_min_cutoff: minCutoff,
    p_study_min: studyMin,
    p_limit: BATCH_SIZE,
  });

  if (error) throw error;

  const candidates = (data ?? []) as Candidate[];
  const summary = {
    success: true,
    dryRun,
    enabled,
    campaignKey: CAMPAIGN_KEY,
    inactiveHours: INACTIVE_HOURS,
    candidateWindowHours: CANDIDATE_WINDOW_HOURS,
    maxStudyAgeDays: MAX_STUDY_AGE_DAYS,
    candidates: candidates.length,
    sent: 0,
    duplicates: 0,
    skippedDisabled: 0,
    skippedReturned: 0,
    skippedInvalid: 0,
    skippedFrequency: 0,
    skippedRecentD1: 0,
    failed: 0,
  };

  async function persistHeartbeat() {
    const { error: heartbeatError } = await db.from('analytics_events').insert({
      event_name: 'study_return_48h_dispatch',
      session_key: 'server:study-return-48h',
      path: '/api/internal/study-return-48h',
      metadata: summary,
    });

    if (heartbeatError) {
      logError('studyReturn48h.heartbeat', heartbeatError, summary);
    }
  }

  if (dryRun) {
    await persistHeartbeat();
    logInfo('studyReturn48h.dispatch', summary);
    return summary;
  }

  if (!enabled) {
    summary.skippedDisabled = candidates.length;
    await persistHeartbeat();
    logInfo('studyReturn48h.dispatch', summary);
    return summary;
  }

  for (const candidate of candidates) {
    // D+1 and the follow-up must not arrive almost together for the same PDF.
    const d1Cutoff = new Date(Date.now() - D1_COOLDOWN_HOURS * 60 * 60 * 1000).toISOString();
    const { data: recentD1, error: recentD1Error } = await db
      .from('email_campaign_deliveries')
      .select('id')
      .eq('user_id', candidate.user_id)
      .eq('status', 'sent')
      .like('campaign_key', 'study_return_d1_v1:%')
      .contains('context', { material_id: candidate.material_id })
      .gte('sent_at', d1Cutoff)
      .limit(1);
    if (recentD1Error) throw recentD1Error;
    if ((recentD1 ?? []).length > 0) {
      summary.skippedRecentD1 += 1;
      continue;
    }
    if (!(await canSendPdfStudyNudge(candidate.user_id))) {
      summary.skippedFrequency += 1;
      continue;
    }
    const { data: reservation, error: reservationError } = await db
      .from('study_return_reminders')
      .insert({
        user_id: candidate.user_id,
        material_id: candidate.material_id,
        last_study_at: candidate.last_study_at,
        last_activity_at: candidate.last_activity_at,
        pending_count: candidate.pending_count,
        status: 'sending',
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
      const [newActivityResult, materialResult, errorsResult, userResult] = await Promise.all([
        db
          .from('analytics_events')
          .select('id')
          .eq('user_id', candidate.user_id)
          .gt('created_at', candidate.last_activity_at)
          .or('session_key.is.null,session_key.not.like.server:%')
          .limit(1),
        db
          .from('student_materials')
          .select('id,title,user_id,processing_status')
          .eq('id', candidate.material_id)
          .eq('user_id', candidate.user_id)
          .eq('processing_status', 'ready')
          .maybeSingle(),
        db
          .from('study_errors')
          .select('id,topic')
          .eq('user_id', candidate.user_id)
          .eq('student_material_id', candidate.material_id)
          .eq('status', 'pending')
          .limit(200),
        admin.auth.admin.getUserById(candidate.user_id),
      ]);

      if (newActivityResult.error) throw newActivityResult.error;
      if (materialResult.error) throw materialResult.error;
      if (errorsResult.error) throw errorsResult.error;
      if (userResult.error) throw userResult.error;

      if ((newActivityResult.data ?? []).length > 0) {
        await db.from('study_return_reminders').delete().eq('id', reservation.id);
        summary.skippedReturned += 1;
        continue;
      }

      const material = materialResult.data as { id: string; title: string } | null;
      const user = userResult.data.user;

      if (!material || !user?.email || !user.email_confirmed_at) {
        await db.from('study_return_reminders').delete().eq('id', reservation.id);
        summary.skippedInvalid += 1;
        continue;
      }

      const pendingTopics = new Set(
        ((errorsResult.data ?? []) as Array<{ id: string; topic: string | null }>).map((item) => {
          const topic = item.topic?.trim();
          return topic || item.id;
        })
      );
      const pendingCount = pendingTopics.size;
      const displayName = candidate.display_name;
      const displayFirstName = firstName(displayName);
      const returnUrl = buildReturnUrl(candidate.material_id, pendingCount > 0);
      const message = buildStudyReturn48hMessage({
        firstname: displayFirstName,
        materialTitle: material.title,
        pendingCount,
        pendingTopics: ((errorsResult.data ?? []) as Array<{ topic: string | null }>).map((x) => x.topic ?? ''),
        returnUrl,
      });

      const senderResult = await sendSenderTransactional({
        toEmail: user.email,
        toName: displayName,
        subject: message.subject,
        text: message.text,
        html: message.html,
      });

      const sentAt = new Date().toISOString();
      const { error: markSentError } = await db
        .from('study_return_reminders')
        .update({
          status: 'sent',
          pending_count: pendingCount,
          sender_email_id: senderResult.emailId,
          sent_at: sentAt,
          updated_at: sentAt,
        })
        .eq('id', reservation.id);

      if (markSentError) {
        logError('studyReturn48h.markSent', markSentError, {
          reminderId: reservation.id,
          userId: candidate.user_id,
        });
      }

      const { error: analyticsError } = await db.from('analytics_events').insert({
        event_name: 'study_return_48h_sent',
        user_id: candidate.user_id,
        session_key: 'server:study-return-48h',
        path: '/api/internal/study-return-48h',
        metadata: {
          campaign_key: CAMPAIGN_KEY,
          material_id: candidate.material_id,
          last_study_at: candidate.last_study_at,
          last_activity_at: candidate.last_activity_at,
          pending_count: pendingCount,
          sender_email_id: senderResult.emailId,
        },
      });

      if (analyticsError) {
        logError('studyReturn48h.analytics', analyticsError, {
          reminderId: reservation.id,
          userId: candidate.user_id,
        });
      }

      summary.sent += 1;
    } catch (error) {
      summary.failed += 1;
      logError('studyReturn48h.send', error, {
        userId: candidate.user_id,
        materialId: candidate.material_id,
      });

      const { error: cleanupError } = await db
        .from('study_return_reminders')
        .delete()
        .eq('id', reservation.id);

      if (cleanupError) {
        logError('studyReturn48h.cleanupReservation', cleanupError, {
          reminderId: reservation.id,
        });
      }
    }
  }

  await persistHeartbeat();
  logInfo('studyReturn48h.dispatch', summary);
  return summary;
}
