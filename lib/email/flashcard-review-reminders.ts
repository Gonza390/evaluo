import 'server-only';
import { SITE_URL } from '@/lib/site';

import { createAdminClient } from '@/lib/supabase-admin';
import { logError, logInfo } from '@/lib/observability';
import { sendSenderTransactional } from '@/lib/email/sender';
import { canSendPdfStudyNudge } from '@/lib/email/pdf-study-frequency';
import { buildEvaluoEmailHtml, escapeEmailHtml } from '@/lib/email/evaluo-email';

type ReminderRow = {
  id: string;
  user_id: string;
  material_id: string;
  topics: string[];
  unknown_count: number;
  scheduled_for: string;
  attempt_count: number;
};

type StudyErrorRow = {
  topic: string | null;
};

function firstName(value: string | null | undefined) {
  const normalized = value?.trim();
  if (!normalized) return 'estudiante';
  return normalized.split(/\s+/)[0] || 'estudiante';
}

function buildReviewUrl(materialId: string) {
  const baseUrl = SITE_URL.replace(/\/$/, '');
  const url = new URL(`/materiales/${materialId}`, baseUrl);
  url.searchParams.set('tab', 'tarjetas');
  url.searchParams.set('utm_source', 'sender');
  url.searchParams.set('utm_medium', 'email');
  url.searchParams.set('utm_campaign', 'flashcard_review_reminder');
  url.searchParams.set('utm_content', 'review_now');
  return url.toString();
}

function buildExtraTopicsText(topicCount: number) {
  const extra = Math.max(0, topicCount - 3);
  if (extra === 0) return '';
  return `+${extra} tema${extra === 1 ? '' : 's'} más`;
}

function buildFlashcardReviewMessage(input: {
  firstname: string;
  materialTitle: string;
  pendingCount: number;
  topics: string[];
  reviewUrl: string;
}) {
  const subject =
    input.pendingCount === 1
      ? `Tenés 1 concepto para reforzar en ${input.materialTitle}`
      : `Tenés ${input.pendingCount} conceptos para reforzar en ${input.materialTitle}`;
  const heading =
    input.pendingCount === 1
      ? 'Tenés un concepto para reforzar'
      : `Tenés ${input.pendingCount} conceptos para reforzar`;

  const visibleTopics = input.topics.slice(0, 3);
  const topicList = visibleTopics.length
    ? `<ul style="margin:12px 0 0;padding-left:20px;">${visibleTopics
        .map((topic) => `<li style="margin:0 0 6px;">${escapeEmailHtml(topic)}</li>`)
        .join('')}</ul>`
    : '';
  const extraTopicsText = buildExtraTopicsText(input.topics.length);
  const extraTopics = extraTopicsText
    ? `<p style="margin:8px 0 0;font-size:13px;color:#7F8AA3;">${escapeEmailHtml(extraTopicsText)}</p>`
    : '';

  const bodyHtml = `<p style="margin:0;">En tus flashcards de <strong>${escapeEmailHtml(
    input.materialTitle
  )}</strong> quedaron conceptos que todavía conviene repasar.</p>${topicList}${extraTopics}`;

  const html = buildEvaluoEmailHtml({
    firstname: input.firstname,
    heading,
    eyebrow: input.materialTitle,
    bodyHtml,
    ctaLabel: 'Repasar ahora',
    ctaUrl: input.reviewUrl,
    reason:
      'Te enviamos este mensaje porque marcaste conceptos como desconocidos mientras estudiabas tus flashcards en Evaluo.',
  });

  const text = `Hola ${input.firstname}. Tenés ${input.pendingCount} concepto${input.pendingCount === 1 ? '' : 's'} para reforzar en ${input.materialTitle}. Repasá ahora: ${input.reviewUrl}`;

  return { subject, html, text };
}

export async function runFlashcardReviewReminderDispatch(options?: { dryRun?: boolean }) {
  const dryRun = Boolean(options?.dryRun);
  const admin = createAdminClient();
  // Estas tablas todavía no forman parte del tipo generado de Supabase.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any;
  const now = new Date().toISOString();

  const { data, error } = await db
    .from('flashcard_review_reminders')
    .select('id,user_id,material_id,topics,unknown_count,scheduled_for,attempt_count')
    .eq('status', 'pending')
    .lte('scheduled_for', now)
    .lt('attempt_count', 3)
    .order('scheduled_for', { ascending: true })
    .limit(50);

  if (error) throw error;

  const reminders = (data ?? []) as ReminderRow[];
  const summary = {
    success: true,
    dryRun,
    candidates: reminders.length,
    sent: 0,
    cancelled: 0,
    failed: 0,
    skipped: 0,
    deferredFrequency: 0,
  };

  for (const reminder of reminders) {
    if (dryRun) continue;

    if (!(await canSendPdfStudyNudge(reminder.user_id))) {
      // Preserve the user's requested flashcard reminder and retry tomorrow.
      const nextDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const { error: postponeError } = await db.from('flashcard_review_reminders')
        .update({ scheduled_for: nextDate, updated_at: new Date().toISOString() })
        .eq('id', reminder.id).eq('status', 'pending');
      if (postponeError) throw postponeError;
      summary.deferredFrequency += 1;
      continue;
    }

    const { data: claimed, error: claimError } = await db
      .from('flashcard_review_reminders')
      .update({
        status: 'sending',
        attempt_count: reminder.attempt_count + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reminder.id)
      .eq('status', 'pending')
      .select('id')
      .maybeSingle();

    if (claimError) throw claimError;
    if (!claimed) {
      summary.skipped += 1;
      continue;
    }

    try {
      const [errorsResult, materialResult, profileResult, userResult] = await Promise.all([
        db
          .from('study_errors')
          .select('topic')
          .eq('user_id', reminder.user_id)
          .eq('student_material_id', reminder.material_id)
          .eq('source_type', 'flashcard')
          .eq('status', 'pending')
          .limit(100),
        db
          .from('student_materials')
          .select('id,title,user_id')
          .eq('id', reminder.material_id)
          .eq('user_id', reminder.user_id)
          .maybeSingle(),
        db.from('profiles').select('nombre').eq('id', reminder.user_id).maybeSingle(),
        admin.auth.admin.getUserById(reminder.user_id),
      ]);

      if (errorsResult.error) throw errorsResult.error;
      if (materialResult.error) throw materialResult.error;
      if (profileResult.error) throw profileResult.error;
      if (userResult.error) throw userResult.error;

      const pendingErrors = (errorsResult.data ?? []) as StudyErrorRow[];
      const material = materialResult.data as { id: string; title: string; user_id: string } | null;
      const user = userResult.data.user;

      if (!material || pendingErrors.length === 0) {
        await db
          .from('flashcard_review_reminders')
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString(),
            last_error: null,
          })
          .eq('id', reminder.id);
        summary.cancelled += 1;
        continue;
      }

      if (!user?.email || !user.email_confirmed_at) {
        await db
          .from('flashcard_review_reminders')
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString(),
            last_error: 'Usuario sin email confirmado.',
          })
          .eq('id', reminder.id);
        summary.cancelled += 1;
        continue;
      }

      const topics = Array.from(
        new Set(
          pendingErrors
            .map((item) => item.topic?.trim() || '')
            .filter(Boolean)
        )
      ).slice(0, 12);

      const fallbackName =
        typeof user.user_metadata?.full_name === 'string'
          ? user.user_metadata.full_name
          : typeof user.user_metadata?.name === 'string'
            ? user.user_metadata.name
            : null;
      const displayName =
        (profileResult.data as { nombre?: string | null } | null)?.nombre || fallbackName;
      const displayFirstName = firstName(displayName);
      const reviewUrl = buildReviewUrl(reminder.material_id);

      const message = buildFlashcardReviewMessage({
        firstname: displayFirstName,
        materialTitle: material.title,
        pendingCount: pendingErrors.length,
        topics,
        reviewUrl,
      });

      const senderResult = await sendSenderTransactional({
        toEmail: user.email,
        toName: displayName,
        subject: message.subject,
        text: message.text,
        html: message.html,
      });

      const { error: sentError } = await db
        .from('flashcard_review_reminders')
        .update({
          status: 'sent',
          sender_email_id: senderResult.emailId,
          sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_error: null,
        })
        .eq('id', reminder.id);

      if (sentError) {
        logError('flashcardReviewReminders.markSent', sentError, { reminderId: reminder.id });
      }

      summary.sent += 1;
    } catch (error) {
      summary.failed += 1;
      const message = error instanceof Error ? error.message.slice(0, 500) : 'Error desconocido';
      const retry = reminder.attempt_count + 1 < 3;

      const { error: updateError } = await db
        .from('flashcard_review_reminders')
        .update({
          status: retry ? 'pending' : 'failed',
          last_error: message,
          updated_at: new Date().toISOString(),
        })
        .eq('id', reminder.id);

      if (updateError) {
        logError('flashcardReviewReminders.markFailure', updateError, {
          reminderId: reminder.id,
        });
      }

      logError('flashcardReviewReminders.send', error, {
        reminderId: reminder.id,
        userId: reminder.user_id,
        materialId: reminder.material_id,
      });
    }
  }

  const { error: heartbeatError } = await db.from('analytics_events').insert({
    event_name: 'flashcard_review_reminder_dispatch',
    session_key: 'server:flashcard-review-reminders',
    path: '/api/internal/flashcard-review-reminders',
    metadata: summary,
  });

  if (heartbeatError) {
    logError('flashcardReviewReminders.heartbeat', heartbeatError, summary);
  }

  logInfo('flashcardReviewReminders.dispatch', summary);
  return summary;
}
