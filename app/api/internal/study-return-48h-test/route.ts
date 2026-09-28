import { createHash, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { sendSenderTransactional } from '@/lib/email/sender';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TOKEN_HASH = '913b4e32f48bf5a73500ad15551f9980da87ad9681df4556319f4b97f989be98';

function safeEquals(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token') ?? '';
  const userId = url.searchParams.get('uid') ?? '';
  const materialId = url.searchParams.get('material') ?? '';

  const digest = createHash('sha256').update(token).digest('hex');
  if (!safeEquals(digest, TOKEN_HASH) || !userId || !materialId) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any;

  const [materialResult, profileResult, errorsResult, userResult] = await Promise.all([
    db
      .from('student_materials')
      .select('id,title,user_id')
      .eq('id', materialId)
      .eq('user_id', userId)
      .maybeSingle(),
    db.from('profiles').select('nombre').eq('id', userId).maybeSingle(),
    db
      .from('study_errors')
      .select('id')
      .eq('user_id', userId)
      .eq('student_material_id', materialId)
      .eq('status', 'pending')
      .limit(200),
    admin.auth.admin.getUserById(userId),
  ]);

  if (materialResult.error) throw materialResult.error;
  if (profileResult.error) throw profileResult.error;
  if (errorsResult.error) throw errorsResult.error;
  if (userResult.error) throw userResult.error;

  const material = materialResult.data as { id: string; title: string } | null;
  const user = userResult.data.user;
  if (!material || !user?.email || !user.email_confirmed_at) {
    return NextResponse.json({ success: false, message: 'Invalid test target.' }, { status: 400 });
  }

  const pendingCount = (errorsResult.data ?? []).length;
  const displayName =
    (profileResult.data as { nombre?: string | null } | null)?.nombre ||
    (typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : null) ||
    (typeof user.user_metadata?.name === 'string' ? user.user_metadata.name : null);
  const firstname = displayName?.trim().split(/\s+/)[0] || 'estudiante';

  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://evaluo.com.ar').replace(/\/$/, '');
  const returnUrl = new URL(`/materiales/${material.id}`, baseUrl);
  returnUrl.searchParams.set('utm_source', 'sender');
  returnUrl.searchParams.set('utm_medium', 'email');
  returnUrl.searchParams.set('utm_campaign', 'study_return_48h_v1');
  returnUrl.searchParams.set('utm_content', pendingCount > 0 ? 'review_pending' : 'continue_studying');

  const subject =
    pendingCount > 0
      ? `Te quedaron ${pendingCount} conceptos para reforzar`
      : `¿Seguís con ${material.title}?`;

  const heading =
    pendingCount > 0
      ? `Tenés ${pendingCount} concepto${pendingCount === 1 ? '' : 's'} para reforzar`
      : 'Tu material sigue listo para continuar';

  const paragraph =
    pendingCount > 0
      ? `En tu última sesión con ${material.title} quedaron algunos conceptos pendientes. Podés retomarlos y comprobar si ahora los entendés mejor.`
      : `Hace un par de días estuviste trabajando con ${material.title}. Podés volver al material y seguir estudiando desde donde lo dejaste.`;

  const cta = pendingCount > 0 ? 'Repasar ahora' : 'Continuar estudiando';

  const html = `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:0;background:#F5F7FB;font-family:Inter,Arial,sans-serif;color:#0F1B3D;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F5F7FB;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#FFFFFF;border:1px solid #E7EBF4;border-radius:20px;">
          <tr><td style="padding:32px;">
            <div style="font-size:22px;font-weight:800;letter-spacing:-0.02em;margin-bottom:28px;"><span style="color:#032269;">evalu</span><span style="color:#0546f3;">o</span></div>
            <p style="margin:0 0 12px;font-size:15px;line-height:1.6;">Hola ${escapeHtml(firstname)},</p>
            <h1 style="margin:0 0 12px;font-size:24px;line-height:1.25;letter-spacing:-0.02em;color:#0F1B3D;">${escapeHtml(heading)}</h1>
            <p style="margin:0 0 24px;font-size:16px;line-height:1.65;color:#475569;">${escapeHtml(paragraph)}</p>
            <a href="${escapeHtml(returnUrl.toString())}" style="display:inline-block;background:#2563EB;color:#FFFFFF;text-decoration:none;font-weight:700;font-size:15px;padding:13px 20px;border-radius:12px;">${escapeHtml(cta)}</a>
            <p style="margin:28px 0 0;font-size:12px;line-height:1.5;color:#94A3B8;">Te enviamos este mensaje porque estudiaste este material en Evaluo.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  const senderResult = await sendSenderTransactional({
    toEmail: user.email,
    toName: displayName,
    subject,
    text: `Hola ${firstname}. Te quedaron ${pendingCount} conceptos para reforzar. Volvé a estudiar: ${returnUrl.toString()}`,
    html,
  });

  return NextResponse.json({
    success: true,
    pendingCount,
    emailId: senderResult.emailId,
  });
}
