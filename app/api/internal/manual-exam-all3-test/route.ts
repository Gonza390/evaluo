import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { sendSenderTemplate } from '@/lib/email/sender';
import { logError, logInfo } from '@/lib/observability';
import { createAdminClient } from '@/lib/supabase-admin';
import { isInternalQueueRequestAuthorized } from '@/lib/student-materials/job-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TARGET_EMAIL = 'olmosgonza69@gmail.com';
const TARGET_USER_ID = '7148f1ef-22fd-4f69-8076-bd10e663895e';
const TEMP_AUTH_KEY = 'manual_sender_exam_all3_auth_20260920_v1';
const TEST_WINDOW_END = Date.parse('2026-09-20T21:00:00Z');

const TESTS = [
  {
    days: 7,
    templateEnv: 'SENDER_TEMPLATE_EXAM_7D',
    campaignKey: 'manual_sender_exam_7d_test_20260920_v2',
    subject: 'Tu examen de IPC — Introducción al Pensamiento Científico es en una semana',
  },
  {
    days: 3,
    templateEnv: 'SENDER_TEMPLATE_EXAM_3D',
    campaignKey: 'manual_sender_exam_3d_test_20260920_v2',
    subject: 'Te quedan 3 días para tu examen de IPC — Introducción al Pensamiento Científico',
  },
  {
    days: 1,
    templateEnv: 'SENDER_TEMPLATE_EXAM_1D',
    campaignKey: 'manual_sender_exam_1d_test_20260920_v2',
    subject: 'Mañana rendís IPC — Introducción al Pensamiento Científico',
  },
] as const;

function secureEquals(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

async function consumeTemporaryRouteToken(request: Request) {
  const suppliedToken = new URL(request.url).searchParams.get('token')?.trim() || '';
  if (!suppliedToken) return false;

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any;

  const { data: authRow, error: authError } = await db
    .from('email_campaign_deliveries')
    .select('id,status,context')
    .eq('campaign_key', TEMP_AUTH_KEY)
    .eq('status', 'sending')
    .limit(1)
    .maybeSingle();

  if (authError) throw authError;

  const expectedToken =
    authRow &&
    typeof authRow.context === 'object' &&
    authRow.context &&
    typeof authRow.context.token === 'string'
      ? authRow.context.token
      : '';

  if (!authRow || !expectedToken || !secureEquals(suppliedToken, expectedToken)) {
    return false;
  }

  const { data: claimed, error: claimError } = await db
    .from('email_campaign_deliveries')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', authRow.id)
    .eq('status', 'sending')
    .select('id')
    .maybeSingle();

  if (claimError) throw claimError;
  return Boolean(claimed);
}

async function handle(request: Request) {
  const internalAuthorized = isInternalQueueRequestAuthorized(request);
  if (!internalAuthorized) {
    const temporaryAuthorized = await consumeTemporaryRouteToken(request);
    if (!temporaryAuthorized) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
  }

  if (Date.now() >= TEST_WINDOW_END) {
    return NextResponse.json(
      { success: false, message: 'Outside authorized test window.' },
      { status: 410 }
    );
  }

  const templates = Object.fromEntries(
    TESTS.map((test) => [test.days, process.env[test.templateEnv]?.trim() || null])
  ) as Record<number, string | null>;

  const missingTemplates = TESTS.filter((test) => !templates[test.days]).map(
    (test) => test.templateEnv
  );

  if (missingTemplates.length > 0) {
    return NextResponse.json(
      {
        success: false,
        message: 'Missing Sender template configuration.',
        missingTemplates,
      },
      { status: 500 }
    );
  }

  const admin = createAdminClient();
  const { data: userData, error: userError } = await admin.auth.admin.getUserById(TARGET_USER_ID);

  if (userError) throw userError;
  if (userData.user.email?.trim().toLowerCase() !== TARGET_EMAIL) {
    return NextResponse.json(
      { success: false, message: 'Authorized test recipient mismatch.' },
      { status: 409 }
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any;

  const { data: reservations, error: reservationError } = await db
    .from('email_campaign_deliveries')
    .insert(
      TESTS.map((test) => ({
        campaign_key: test.campaignKey,
        user_id: TARGET_USER_ID,
        context: {
          test: `sender_exam_${test.days}d_template`,
          exam_date: '2026-09-24',
          days_left: test.days,
        },
        status: 'sending',
      }))
    )
    .select('id,campaign_key');

  if (reservationError) throw reservationError;

  const reservationByKey = new Map(
    (reservations ?? []).map((row: { id: string; campaign_key: string }) => [
      row.campaign_key,
      row.id,
    ])
  );

  const materia = 'IPC — Introducción al Pensamiento Científico';
  const formattedExamDate = '24 de septiembre de 2026';
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://evaluo.com.ar').replace(/\/$/, '');
  const results: Array<{
    days: number;
    success: boolean;
    emailId?: string | null;
    error?: string;
  }> = [];

  for (const test of TESTS) {
    const calendarUrl = new URL('/calendario', baseUrl);
    calendarUrl.searchParams.set('utm_source', 'sender');
    calendarUrl.searchParams.set('utm_medium', 'email');
    calendarUrl.searchParams.set('utm_campaign', `exam_reminder_${test.days}d`);
    calendarUrl.searchParams.set('utm_content', 'calendar_reminder');

    const reservationId = reservationByKey.get(test.campaignKey);
    if (!reservationId) {
      results.push({
        days: test.days,
        success: false,
        error: 'Missing idempotency reservation.',
      });
      continue;
    }

    try {
      const senderResult = await sendSenderTemplate({
        templateId: templates[test.days] as string,
        toEmail: TARGET_EMAIL,
        toName: 'Gonzalo',
        variables: {
          subject: test.subject,
          firstname: 'Gonzalo',
          nombre: 'Gonzalo',
          materia,
          exam_date: formattedExamDate,
          fecha_del_examen: formattedExamDate,
          exam_date_iso: '2026-09-24',
          days_left: test.days,
          material_title: materia,
          titulo_del_material: materia,
          material_url: calendarUrl.toString(),
          destination_url: calendarUrl.toString(),
          calendar_url: calendarUrl.toString(),
          reminder_source: 'calendar',
          has_material: false,
        },
      });

      const { error: markSentError } = await db
        .from('email_campaign_deliveries')
        .update({
          status: 'sent',
          sender_email_id: senderResult.emailId,
          sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', reservationId);

      if (markSentError) {
        logError('manualExamAll3Test.markSent', markSentError, {
          days: test.days,
          deliveryId: reservationId,
        });
      }

      logInfo('manualExamAll3Test.sent', {
        days: test.days,
        recipient: TARGET_EMAIL,
        emailId: senderResult.emailId,
      });

      results.push({
        days: test.days,
        success: true,
        emailId: senderResult.emailId,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sender test failed.';
      logError('manualExamAll3Test.send', error, {
        days: test.days,
        recipient: TARGET_EMAIL,
        deliveryId: reservationId,
      });
      results.push({
        days: test.days,
        success: false,
        error: message,
      });
    }
  }

  const success = results.every((result) => result.success);
  return NextResponse.json(
    { success, results },
    { status: success ? 200 : 500 }
  );
}

export async function GET(request: Request) {
  return handle(request);
}
