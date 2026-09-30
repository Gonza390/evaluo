import 'server-only';

import { createAdminClient } from '@/lib/supabase-admin';
import { logError, logInfo } from '@/lib/observability';
import { sendSenderTransactional } from '@/lib/email/sender';

const CAMPAIGN_KEY = 'reactivation_next_subject_30d_v1';
const INACTIVE_DAYS = 30;
const MAX_INACTIVE_DAYS = 45;
const DAILY_BATCH_SIZE = 20;

type ReactivationCandidate = {
  user_id: string;
  email: string;
  display_name: string | null;
  materia_id: string;
  materia_nombre: string;
  last_parcial: number | null;
  last_simulator_at: string;
  last_active_at: string;
};

function firstName(value: string | null | undefined) {
  const normalized = value?.trim();
  if (!normalized) return 'estudiante';
  return normalized.split(/\s+/)[0] || 'estudiante';
}

function buildUploadUrl() {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://evaluo.com.ar').replace(/\/$/, '');
  const url = new URL('/dashboard/materiales', baseUrl);
  url.searchParams.set('openUpload', '1');
  url.searchParams.set('utm_source', 'sender');
  url.searchParams.set('utm_medium', 'email');
  url.searchParams.set('utm_campaign', CAMPAIGN_KEY);
  url.searchParams.set('utm_content', 'prepare_next_subject');
  return url.toString();
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function buildReactivationMessage(input: {
  firstname: string;
  materia: string;
  uploadUrl: string;
}) {
  const subject = `¿Qué materia sigue después de ${input.materia}?`;
  const safeFirstName = escapeHtml(input.firstname);
  const safeMateria = escapeHtml(input.materia);
  const safeUploadUrl = escapeHtml(input.uploadUrl);

  const html = `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:0;background:#F5F7FB;font-family:Inter,Arial,sans-serif;color:#0F1B3D;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F5F7FB;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#FFFFFF;border:1px solid #E7EBF4;border-radius:20px;">
            <tr>
              <td style="padding:32px;">
                <div style="font-size:22px;font-weight:800;letter-spacing:-0.02em;margin-bottom:28px;">
                  <span style="color:#032269;">evalu</span><span style="color:#0546f3;">o</span>
                </div>
                <p style="margin:0 0 12px;font-size:15px;line-height:1.6;">Hola ${safeFirstName},</p>
                <h1 style="margin:0 0 12px;font-size:24px;line-height:1.25;letter-spacing:-0.02em;color:#0F1B3D;">¿Qué materia sigue después de ${safeMateria}?</h1>
                <p style="margin:0 0 24px;font-size:16px;line-height:1.65;color:#475569;">Hace un tiempo practicaste ${safeMateria} en Evaluo. Si ya estás con la próxima materia, subí tu PDF y prepará resumen, glosario, flashcards y práctica desde el mismo material.</p>
                <a href="${safeUploadUrl}" style="display:inline-block;background:#2563EB;color:#FFFFFF;text-decoration:none;font-weight:700;font-size:15px;padding:13px 20px;border-radius:12px;">Subir mi PDF</a>
                <p style="margin:28px 0 0;font-size:12px;line-height:1.5;color:#94A3B8;">Te enviamos este mensaje porque usaste el simulador de Evaluo y hace un tiempo que no volvés.</p>
                <div style="margin-top:30px;padding-top:24px;border-top:1px solid #E7EBF4;text-align:center;">
                  <img src="https://evaluo.com.ar/icon.png" width="52" height="52" alt="Evaluo" style="display:block;width:52px;height:52px;margin:0 auto 10px;object-fit:contain;border:0;" />
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

  const text = `Hola ${input.firstname}. Hace un tiempo practicaste ${input.materia} en Evaluo. Si ya estás con la próxima materia, subí tu PDF acá: ${input.uploadUrl}`;

  return { subject, html, text };
}

export async function runReactivationNextSubjectDispatch(options?: { dryRun?: boolean }) {
  const dryRun = Boolean(options?.dryRun);
  const enabled = process.env.REACTIVATION_NEXT_SUBJECT_ENABLED?.trim() === '1';
  const cutoff = new Date(Date.now() - INACTIVE_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const minCutoff = new Date(Date.now() - MAX_INACTIVE_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const admin = createAdminClient();
  // RPC y tabla agregadas por migración; todavía no forman parte del tipo generado.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any;

  const { data, error } = await db.rpc('get_reactivation_next_subject_candidates', {
    p_cutoff: cutoff,
    p_min_cutoff: minCutoff,
    p_limit: DAILY_BATCH_SIZE,
  });

  if (error) throw error;

  const candidates = (data ?? []) as ReactivationCandidate[];
  const summary = {
    success: true,
    dryRun,
    enabled,
    campaignKey: CAMPAIGN_KEY,
    inactiveDays: INACTIVE_DAYS,
    maxInactiveDays: MAX_INACTIVE_DAYS,
    batchSize: DAILY_BATCH_SIZE,
    cutoff,
    minCutoff,
    candidates: candidates.length,
    triggered: 0,
    duplicates: 0,
    skippedDisabled: 0,
    failed: 0,
  };

  async function persistHeartbeat() {
    const { error: heartbeatError } = await db.from('analytics_events').insert({
      event_name: 'reactivation_next_subject_dispatch',
      session_key: 'server:reactivation-next-subject',
      path: '/api/internal/reactivation-next-subject',
      metadata: summary,
    });

    if (heartbeatError) {
      logError('reactivationNextSubject.heartbeat', heartbeatError);
    }
  }

  if (dryRun) {
    await persistHeartbeat();
    logInfo('reactivationNextSubject.dispatch', summary);
    return summary;
  }

  if (!enabled) {
    summary.skippedDisabled = candidates.length;
    await persistHeartbeat();
    logInfo('reactivationNextSubject.dispatch', summary);
    return summary;
  }

  const uploadUrl = buildUploadUrl();

  for (const candidate of candidates) {
    const { data: reservation, error: reservationError } = await db
      .from('email_campaign_deliveries')
      .insert({
        campaign_key: CAMPAIGN_KEY,
        user_id: candidate.user_id,
        materia_id: candidate.materia_id,
        status: 'sending',
        context: {
          delivery_mode: 'transactional',
          materia: candidate.materia_nombre,
          last_parcial: candidate.last_parcial,
          last_simulator_at: candidate.last_simulator_at,
          last_active_at: candidate.last_active_at,
        },
      })
      .select('id')
      .single();

    if (reservationError) {
      if (reservationError.code === '23505') {
        summary.duplicates += 1;
        continue;
      }
      throw reservationError;
    }

    try {
      const displayFirstName = firstName(candidate.display_name);
      const message = buildReactivationMessage({
        firstname: displayFirstName,
        materia: candidate.materia_nombre,
        uploadUrl,
      });

      const senderResult = await sendSenderTransactional({
        toEmail: candidate.email,
        toName: candidate.display_name,
        subject: message.subject,
        text: message.text,
        html: message.html,
      });

      const now = new Date().toISOString();
      const { error: markTriggeredError } = await db
        .from('email_campaign_deliveries')
        .update({
          status: 'sent',
          sender_email_id: senderResult.emailId,
          sent_at: now,
          triggered_at: now,
          updated_at: now,
        })
        .eq('id', reservation.id);

      if (markTriggeredError) {
        logError('reactivationNextSubject.markSent', markTriggeredError, {
          deliveryId: reservation.id,
          campaignKey: CAMPAIGN_KEY,
        });
      }

      summary.triggered += 1;
    } catch (error) {
      summary.failed += 1;
      logError('reactivationNextSubject.send', error, {
        userId: candidate.user_id,
        materiaId: candidate.materia_id,
        campaignKey: CAMPAIGN_KEY,
      });

      // Si Sender rechaza el envío, liberamos la reserva para que el cron pueda reintentar.
      const { error: cleanupError } = await db
        .from('email_campaign_deliveries')
        .delete()
        .eq('id', reservation.id);

      if (cleanupError) {
        logError('reactivationNextSubject.cleanupReservation', cleanupError, {
          deliveryId: reservation.id,
        });
      }
    }
  }

  await persistHeartbeat();
  logInfo('reactivationNextSubject.dispatch', summary);
  return summary;
}
