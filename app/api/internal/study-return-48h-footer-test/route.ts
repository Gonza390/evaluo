import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { sendSenderTransactional } from '@/lib/email/sender';
import { buildStudyReturn48hMessage } from '@/lib/email/study-return-48h';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TEST_TOKEN = 'evaluo48h-footer-test-20260929';
const TEST_USER_ID = '7148f1ef-22fd-4f69-8076-bd10e663895e';
const TEST_MATERIAL_ID = '9d9c8465-836c-471c-98ab-991d68b650f1';

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get('token') !== TEST_TOKEN) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any;

  const [materialResult, profileResult, errorsResult, userResult] = await Promise.all([
    db
      .from('student_materials')
      .select('id,title,user_id')
      .eq('id', TEST_MATERIAL_ID)
      .eq('user_id', TEST_USER_ID)
      .maybeSingle(),
    db.from('profiles').select('nombre').eq('id', TEST_USER_ID).maybeSingle(),
    db
      .from('study_errors')
      .select('id,topic')
      .eq('user_id', TEST_USER_ID)
      .eq('student_material_id', TEST_MATERIAL_ID)
      .eq('status', 'pending')
      .limit(200),
    admin.auth.admin.getUserById(TEST_USER_ID),
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

  const displayName =
    (profileResult.data as { nombre?: string | null } | null)?.nombre ||
    (typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : null) ||
    (typeof user.user_metadata?.name === 'string' ? user.user_metadata.name : null);
  const firstname = displayName?.trim().split(/\s+/)[0] || 'estudiante';

  const pendingTopics = new Set(
    ((errorsResult.data ?? []) as Array<{ id: string; topic: string | null }>).map((item) => {
      const topic = item.topic?.trim();
      return topic || item.id;
    })
  );
  const pendingCount = pendingTopics.size;

  const returnUrl = new URL(`/materiales/${TEST_MATERIAL_ID}`, 'https://evaluo.com.ar');
  returnUrl.searchParams.set('utm_source', 'sender');
  returnUrl.searchParams.set('utm_medium', 'email');
  returnUrl.searchParams.set('utm_campaign', 'study_return_48h_v1');
  returnUrl.searchParams.set('utm_content', pendingCount > 0 ? 'review_pending' : 'continue_studying');

  const message = buildStudyReturn48hMessage({
    firstname,
    materialTitle: material.title,
    pendingCount,
    returnUrl: returnUrl.toString(),
  });

  const senderResult = await sendSenderTransactional({
    toEmail: user.email,
    toName: displayName,
    subject: message.subject,
    text: message.text,
    html: message.html,
  });

  return NextResponse.json({
    success: true,
    pendingCount,
    emailId: senderResult.emailId,
  });
}
