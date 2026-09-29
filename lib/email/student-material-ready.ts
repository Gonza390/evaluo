import 'server-only';

import { createAdminClient } from '@/lib/supabase-admin';
import { logError, logInfo } from '@/lib/observability';
import { sendSenderTransactional } from '@/lib/email/sender';

const RECENT_ACTIVITY_MINUTES = 3;
const CAMPAIGN_KEY = 'student_material_ready_v1';

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function formatMaterialTitle(value: string | null | undefined) {
  const normalized = (value ?? '')
    .replace(/\.pdf$/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized || normalized.length < 3) return null;
  if (/^(ilovepdf|merged|documento?|archivo|scan(?:ned)?|untitled)(\s|$)/i.test(normalized)) {
    return null;
  }

  return normalized.length > 84 ? `${normalized.slice(0, 83).trimEnd()}…` : normalized;
}

export function buildStudentMaterialReadyMessage(input: {
  firstname: string;
  materialTitle: string | null;
  materialId: string;
}) {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://evaluo.com.ar').replace(/\/$/, '');
  const url = new URL(`/materiales/${input.materialId}`, baseUrl);
  url.searchParams.set('utm_source', 'sender');
  url.searchParams.set('utm_medium', 'email');
  url.searchParams.set('utm_campaign', CAMPAIGN_KEY);
  url.searchParams.set('utm_content', 'start_studying');

  const title = formatMaterialTitle(input.materialTitle);
  const intro = title
    ? `Terminamos de preparar “${title}”.`
    : 'Terminamos de preparar tu PDF.';

  const safeFirstName = escapeHtml(input.firstname);
  const safeIntro = escapeHtml(intro);
  const safeUrl = escapeHtml(url.toString());

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
                <h1 style="margin:0 0 12px;font-size:24px;line-height:1.25;letter-spacing:-0.02em;color:#0F1B3D;">Tu PDF ya está listo para estudiar</h1>
                <p style="margin:0 0 8px;font-size:16px;line-height:1.65;color:#475569;">${safeIntro}</p>
                <p style="margin:0 0 24px;font-size:16px;line-height:1.65;color:#475569;">Ya podés entrar y empezar a estudiar con tu material.</p>

                <a href="${safeUrl}" style="display:inline-block;background:#2563EB;color:#FFFFFF;text-decoration:none;font-weight:700;font-size:15px;padding:13px 20px;border-radius:12px;">Empezar a estudiar</a>

                <p style="margin:28px 0 0;font-size:12px;line-height:1.5;color:#94A3B8;">Te avisamos porque el PDF que subiste terminó de procesarse.</p>

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

  const text = `Hola ${input.firstname}. ${intro} Tu PDF ya está listo para estudiar. Empezá acá: ${url.toString()}`;

  return {
    subject: 'Tu PDF ya está listo para estudiar',
    text,
    html,
    url: url.toString(),
  };
}

function isUniqueViolation(error: unknown) {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code?: string }).code === '23505'
  );
}

function firstName(value: string | null | undefined) {
  const normalized = value?.trim();
  if (!normalized) return 'estudiante';
  return normalized.split(/\s+/)[0] || 'estudiante';
}

export async function sendStudentMaterialReadyEmailIfInactive(input: {
  userId: string;
  materialId: string;
  materialTitle: string | null;
}) {
  const enabled = process.env.STUDENT_MATERIAL_READY_EMAIL_ENABLED?.trim() === '1';

  if (!enabled) {
    return { sent: false, reason: 'disabled' as const };
  }

  const admin = createAdminClient();
  // Service-role access is intentional for server-only delivery state.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any;

  const recentCutoff = new Date(Date.now() - RECENT_ACTIVITY_MINUTES * 60 * 1000).toISOString();

  const { data: recentActivity, error: activityError } = await db
    .from('analytics_events')
    .select('id')
    .eq('user_id', input.userId)
    .gte('created_at', recentCutoff)
    .in('event_name', [
      'session_ping',
      'page_view',
      'pdf_upload_completed',
      'student_material_study_opened',
      'study_content_opened',
      'study_tab_opened',
      'meaningful_study_completed',
    ])
    .limit(1);

  if (activityError) throw activityError;

  if ((recentActivity ?? []).length > 0) {
    return { sent: false, reason: 'recent_activity' as const };
  }

  const { data: reservation, error: reservationError } = await db
    .from('student_material_ready_emails')
    .insert({
      user_id: input.userId,
      material_id: input.materialId,
      status: 'sending',
    })
    .select('id')
    .single();

  if (reservationError) {
    if (isUniqueViolation(reservationError)) {
      return { sent: false, reason: 'duplicate' as const };
    }
    throw reservationError;
  }

  try {
    const [profileResult, userResult, materialResult] = await Promise.all([
      db.from('profiles').select('nombre').eq('id', input.userId).maybeSingle(),
      admin.auth.admin.getUserById(input.userId),
      db
        .from('student_materials')
        .select('id,title,user_id,processing_status')
        .eq('id', input.materialId)
        .eq('user_id', input.userId)
        .eq('processing_status', 'ready')
        .maybeSingle(),
    ]);

    if (profileResult.error) throw profileResult.error;
    if (userResult.error) throw userResult.error;
    if (materialResult.error) throw materialResult.error;

    const user = userResult.data.user;
    const material = materialResult.data as { id: string; title: string | null } | null;

    if (!user?.email || !user.email_confirmed_at || !material) {
      await db.from('student_material_ready_emails').delete().eq('id', reservation.id);
      return { sent: false, reason: 'invalid_target' as const };
    }

    const displayName =
      (profileResult.data as { nombre?: string | null } | null)?.nombre ||
      (typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : null) ||
      (typeof user.user_metadata?.name === 'string' ? user.user_metadata.name : null);

    const message = buildStudentMaterialReadyMessage({
      firstname: firstName(displayName),
      materialTitle: material.title ?? input.materialTitle,
      materialId: input.materialId,
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
      .from('student_material_ready_emails')
      .update({
        status: 'sent',
        sender_email_id: senderResult.emailId,
        sent_at: sentAt,
        updated_at: sentAt,
      })
      .eq('id', reservation.id);

    if (markSentError) {
      logError('studentMaterialReadyEmail.markSent', markSentError, {
        materialId: input.materialId,
        userId: input.userId,
      });
    }

    const { error: analyticsError } = await db.from('analytics_events').insert({
      event_name: 'student_material_ready_email_sent',
      user_id: input.userId,
      session_key: 'server:student-material-ready-email',
      path: '/materiales',
      metadata: {
        campaign_key: CAMPAIGN_KEY,
        material_id: input.materialId,
        sender_email_id: senderResult.emailId,
      },
    });

    if (analyticsError) {
      logError('studentMaterialReadyEmail.analytics', analyticsError, {
        materialId: input.materialId,
        userId: input.userId,
      });
    }

    logInfo('studentMaterialReadyEmail.sent', {
      materialId: input.materialId,
      userId: input.userId,
    });

    return { sent: true, reason: 'sent' as const, emailId: senderResult.emailId };
  } catch (error) {
    await db.from('student_material_ready_emails').delete().eq('id', reservation.id);
    throw error;
  }
}
