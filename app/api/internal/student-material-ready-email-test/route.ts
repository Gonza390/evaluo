import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { sendSenderTransactional } from '@/lib/email/sender';
import { buildStudentMaterialReadyMessage } from '@/lib/email/student-material-ready';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TEST_TOKEN = 'evaluo-pdf-ready-test-20260929';
const TEST_USER_ID = '7148f1ef-22fd-4f69-8076-bd10e663895e';
const TEST_MATERIAL_ID = 'b8165194-ca17-4911-bba3-2dd493408de9';

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get('token') !== TEST_TOKEN) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any;

  const [materialResult, profileResult, userResult] = await Promise.all([
    db.from('student_materials').select('id,title,user_id').eq('id', TEST_MATERIAL_ID).eq('user_id', TEST_USER_ID).maybeSingle(),
    db.from('profiles').select('nombre').eq('id', TEST_USER_ID).maybeSingle(),
    admin.auth.admin.getUserById(TEST_USER_ID),
  ]);

  if (materialResult.error) throw materialResult.error;
  if (profileResult.error) throw profileResult.error;
  if (userResult.error) throw userResult.error;

  const material = materialResult.data as { id: string; title: string | null } | null;
  const user = userResult.data.user;

  if (!material || !user?.email || !user.email_confirmed_at) {
    return NextResponse.json({ success: false, message: 'Invalid test target.' }, { status: 400 });
  }

  const displayName =
    (profileResult.data as { nombre?: string | null } | null)?.nombre ||
    (typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : null) ||
    (typeof user.user_metadata?.name === 'string' ? user.user_metadata.name : null);

  const firstname = displayName?.trim().split(/\s+/)[0] || 'estudiante';

  const message = buildStudentMaterialReadyMessage({
    firstname,
    materialTitle: material.title,
    materialId: material.id,
  });

  const senderResult = await sendSenderTransactional({
    toEmail: user.email,
    toName: displayName,
    subject: message.subject,
    text: message.text,
    html: message.html,
  });

  return NextResponse.json({ success: true, emailId: senderResult.emailId, subject: message.subject });
}
