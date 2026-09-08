import 'server-only';

import { createAdminClient } from '@/lib/supabase-admin';
import { logError, logInfo } from '@/lib/observability';
import { sendSenderCustomEvent } from '@/lib/email/sender';

const CAMPAIGN_KEY = 'reactivation_next_subject_30d_v1';
const SENDER_EVENT_TYPE = 'reactivation_next_subject_30d';
const INACTIVE_DAYS = 30;
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

export async function runReactivationNextSubjectDispatch(options?: { dryRun?: boolean }) {
  const dryRun = Boolean(options?.dryRun);
  const enabled = process.env.REACTIVATION_NEXT_SUBJECT_ENABLED?.trim() === '1';
  const cutoff = new Date(Date.now() - INACTIVE_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const admin = createAdminClient();
  // RPC y tabla agregadas por migración; todavía no forman parte del tipo generado.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any;

  const { data, error } = await db.rpc('get_reactivation_next_subject_candidates', {
    p_cutoff: cutoff,
    p_limit: DAILY_BATCH_SIZE,
  });

  if (error) throw error;

  const candidates = (data ?? []) as ReactivationCandidate[];
  const summary = {
    success: true,
    dryRun,
    enabled,
    campaignKey: CAMPAIGN_KEY,
    senderEventType: SENDER_EVENT_TYPE,
    inactiveDays: INACTIVE_DAYS,
    batchSize: DAILY_BATCH_SIZE,
    cutoff,
    candidates: candidates.length,
    triggered: 0,
    duplicates: 0,
    skippedDisabled: 0,
    failed: 0,
  };

  if (dryRun) {
    logInfo('reactivationNextSubject.dispatch', summary);
    return summary;
  }

  if (!enabled) {
    summary.skippedDisabled = candidates.length;
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
          sender_event_type: SENDER_EVENT_TYPE,
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
      const subject = `¿Qué materia sigue después de ${candidate.materia_nombre}?`;

      await sendSenderCustomEvent({
        type: SENDER_EVENT_TYPE,
        subscriberEmail: candidate.email,
        properties: {
          campaign_key: CAMPAIGN_KEY,
          subject,
          firstname: displayFirstName,
          nombre: displayFirstName,
          materia: candidate.materia_nombre,
          materia_anterior: candidate.materia_nombre,
          last_parcial: candidate.last_parcial,
          ultimo_parcial: candidate.last_parcial,
          upload_url: uploadUrl,
          cta_url: uploadUrl,
        },
      });

      const now = new Date().toISOString();
      const { error: markTriggeredError } = await db
        .from('email_campaign_deliveries')
        .update({
          status: 'triggered',
          triggered_at: now,
          updated_at: now,
        })
        .eq('id', reservation.id);

      if (markTriggeredError) {
        logError('reactivationNextSubject.markTriggered', markTriggeredError, {
          deliveryId: reservation.id,
          campaignKey: CAMPAIGN_KEY,
        });
      }

      summary.triggered += 1;
    } catch (error) {
      summary.failed += 1;
      logError('reactivationNextSubject.trigger', error, {
        userId: candidate.user_id,
        materiaId: candidate.materia_id,
        campaignKey: CAMPAIGN_KEY,
      });

      // Si Sender rechaza el evento, liberamos la reserva para que el cron pueda reintentar.
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

  logInfo('reactivationNextSubject.dispatch', summary);
  return summary;
}
