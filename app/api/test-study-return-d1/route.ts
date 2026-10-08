import { NextResponse } from 'next/server';
import { buildStudyReturnD1Message } from '@/lib/email/study-return-d1';
import { sendSenderTransactional } from '@/lib/email/sender';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PREVIEW_KEY = 'd1-preview-20261008-7f3c91e4';

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get('key') !== PREVIEW_KEY) {
    return NextResponse.json({ success: false }, { status: 404 });
  }

  const materialId = 'b8165194-ca17-4911-bba3-2dd493408de9';
  const returnUrl = new URL(`/materiales/${materialId}`, 'https://evaluo.com.ar');
  returnUrl.searchParams.set('tab', 'ejercicios');
  returnUrl.searchParams.set('utm_source', 'sender');
  returnUrl.searchParams.set('utm_medium', 'email');
  returnUrl.searchParams.set('utm_campaign', 'study_return_d1_v1');
  returnUrl.searchParams.set('utm_content', 'start_practice');

  const message = buildStudyReturnD1Message({
    firstname: 'Gonzalo',
    materialTitle: 'Resumen prueba',
    action: {
      kind: 'start_practice',
      title: 'Ya terminaste el resumen',
      description: 'Ahora comprobá qué entendiste con una práctica.',
      cta: 'Comprobar lo aprendido',
    },
    returnUrl: returnUrl.toString(),
  });

  const result = await sendSenderTransactional({
    toEmail: 'olmosgonza69@gmail.com',
    toName: 'Gonzalo',
    subject: `[PRUEBA] ${message.subject}`,
    text: message.text,
    html: message.html,
  });

  return NextResponse.json({ success: true, emailId: result.emailId });
}
