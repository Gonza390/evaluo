import 'server-only';

import { createAdminClient } from '@/lib/supabase-admin';
import { logError, logInfo } from '@/lib/observability';
import { sendSenderTransactional } from '@/lib/email/sender';

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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function firstName(value: string | null | undefined) {
  const normalized = value?.trim();
  if (!normalized) return 'estudiante';
  return normalized.split(/\s+/)[0] || 'estudiante';
}

function buildReviewUrl(materialId: string) {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://evaluo.com.ar').replace(/\/$/, '');
  const url = new URL(`/materiales/${materialId}`, baseUrl);
  url.searchParams.set('tab', 'tarjetas');
  url.searchParams.set('utm_source', 'sender');
  url.searchParams.set('utm_medium', 'email');
  url.searchParams.set('utm_campaign', 'flashcard_review_reminder');
  url.searchParams.set('utm_content', 'review_now');
  return url.toString();
}

function buildEmailHtml(input: {
  name: string;
  materialTitle: string;
  topics: string[];
  pendingCount: number;
  reviewUrl: string;
}) {
  const visibleTopics = input.topics.slice(0, 3);
  const extraTopics = Math.max(0, input.topics.length - visibleTopics.length);
  const topicsHtml = visibleTopics.length
    ? `
      <div style="margin:20px 0 0;padding:16px 18px;border:1px solid #E2E8F0;border-radius:14px;background:#F8FAFC;">
        <div style="font-size:13px;font-weight:700;color:#0F172A;margin-bottom:8px;">Temas para repasar</div>
        ${visibleTopics
          .map(
            (topic) =>
              `<div style="padding:7px 0;border-top:1px solid #E2E8F0;font-size:14px;color:#334155;">${escapeHtml(topic)}</div>`
          )
          .join('')}
        ${extraTopics > 0 ? `<div style="padding-top:8px;font-size:12px;color:#64748B;">+${extraTopics} tema${extraTopics === 1 ? '' : 's'} más</div>` : ''}
      </div>
    `
    : '';

  return `
    <div style="margin:0;padding:32px 18px;background:#F5F7FB;font-family:Arial,sans-serif;color:#0F172A;">
      <div style="max-width:560px;margin:0 auto;background:#FFFFFF;border:1px solid #E7EBF4;border-radius:20px;padding:28px;">
        <div style="font-size:18px;font-weight:800;color:#032269;">evalu<span style="color:#0546f3;">o</span></div>
        <h1 style="font-size:22px;line-height:1.25;margin:24px 0 10px;">¿Repasamos lo que te costó?</h1>
        <p style="font-size:14px;line-height:1.7;color:#475569;margin:0;">
          Hola ${escapeHtml(input.name)}. Elegiste que te recordemos este repaso de
          <strong>${escapeHtml(input.materialTitle)}</strong>.
        </p>
        <p style="font-size:14px;line-height:1.7;color:#475569;margin:12px 0 0;">
          Tenés <strong>${input.pendingCount} concepto${input.pendingCount === 1 ? '' : 's'}</strong>
          que todavía conviene reforzar. No hace falta empezar de cero.
        </p>
        ${topicsHtml}
        <div style="margin-top:22px;">
          <a href="${escapeHtml(input.reviewUrl)}" style="display:inline-block;background:#2563EB;color:#FFFFFF;text-decoration:none;font-size:14px;font-weight:700;padding:12px 18px;border-radius:12px;">
            Repasar ahora
          </a>
        </div>
        <p style="font-size:12px;line-height:1.6;color:#94A3B8;margin:20px 0 0;">
          Te enviamos este mensaje porque elegiste “Recordarme mañana” al terminar tus flashcards.
        </p>
      </div>
    </div>
  `;
}

function buildEmailText(input: {
  name: string;
  materialTitle: string;
  topics: string[];
  pendingCount: number;
  reviewUrl: string;
}) {
  const topicLines = input.topics.slice(0, 3).map((topic) => `- ${topic}`).join('\n');
  return [
    `Hola ${input.name},`,
    '',
    `Elegiste que te recordemos el repaso de ${input.materialTitle}.`,
    `Tenés ${input.pendingCount} concepto${input.pendingCount === 1 ? '' : 's'} para reforzar.`,
    topicLines ? `\nTemas para repasar:\n${topicLines}` : '',
    '',
    `Repasar ahora: ${input.reviewUrl}`,
    '',
    'Evaluo',
  ]
    .filter(Boolean)
    .join('\n');
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
  };

  for (const reminder of reminders) {
    if (dryRun) continue;

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
      const subject = '¿Repasamos lo que te costó?';

      const senderResult = await sendSenderTransactional({
        toEmail: user.email,
        toName: displayName,
        subject,
        text: buildEmailText({
          name: displayFirstName,
          materialTitle: material.title,
          topics,
          pendingCount: pendingErrors.length,
          reviewUrl,
        }),
        html: buildEmailHtml({
          name: displayFirstName,
          materialTitle: material.title,
          topics,
          pendingCount: pendingErrors.length,
          reviewUrl,
        }),
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
