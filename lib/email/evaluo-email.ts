import 'server-only';

export function escapeEmailHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function buildEvaluoEmailHtml(input: {
  firstname: string;
  heading: string;
  bodyHtml: string;
  ctaLabel: string;
  ctaUrl: string;
  reason: string;
  eyebrow?: string | null;
  detailHtml?: string | null;
}) {
  const safeFirstName = escapeEmailHtml(input.firstname);
  const safeHeading = escapeEmailHtml(input.heading);
  const safeCtaLabel = escapeEmailHtml(input.ctaLabel);
  const safeCtaUrl = escapeEmailHtml(input.ctaUrl);
  const safeReason = escapeEmailHtml(input.reason);
  const safeEyebrow = input.eyebrow ? escapeEmailHtml(input.eyebrow) : null;

  return `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:0;background:#F5F7FB;font-family:Inter,Arial,sans-serif;color:#0F1B3D;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F5F7FB;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#FFFFFF;border:1px solid #E7EBF4;border-radius:20px;">
            <tr>
              <td style="padding:32px;">
                <div style="margin:0 0 28px;padding:14px 18px;background:#174BBD;border-radius:14px;"><img src="https://cdn.sender.net/email_images/455373/images/0/evaluo_logo_blanco_email.png" width="176" height="64" alt="Evaluo" style="display:block;width:176px;height:64px;border:0;" /></div>
                <p style="margin:0 0 12px;font-size:15px;line-height:1.6;">Hola ${safeFirstName},</p>
                <h1 style="margin:0 0 12px;font-size:24px;line-height:1.25;letter-spacing:-0.02em;color:#0F1B3D;">${safeHeading}</h1>
                ${safeEyebrow ? `<p style="margin:0 0 8px;font-size:13px;line-height:1.5;font-weight:700;color:#6366F1;">${safeEyebrow}</p>` : ''}
                <div style="margin:0 0 24px;font-size:16px;line-height:1.65;color:#475569;">${input.bodyHtml}</div>
                ${input.detailHtml ? `<div style="padding:16px 18px;margin:-8px 0 22px;border:1px solid #DCE6F9;border-radius:12px;background:#F4F7FF;">${input.detailHtml}</div>` : ""}
                <a href="${safeCtaUrl}" style="display:inline-block;background:#2563EB;color:#FFFFFF;text-decoration:none;font-weight:700;font-size:15px;padding:13px 20px;border-radius:12px;">${safeCtaLabel}</a>
                <p style="margin:28px 0 0;font-size:12px;line-height:1.5;color:#94A3B8;">${safeReason}</p>
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
}
