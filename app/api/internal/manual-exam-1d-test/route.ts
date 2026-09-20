import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { sendSenderTemplate } from '@/lib/email/sender';
import { logError, logInfo } from '@/lib/observability';
import { createAdminClient } from '@/lib/supabase-admin';
import { isInternalQueueRequestAuthorized } from '@/lib/student-materials/job-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TARGET_EMAIL = 'olmosgonza69@gmail.com';
const TEST_KEY = 'manual_sender_exam_1d_test_20260920_v1';
const TEMP_AUTH_KEY = 'manual_sender_exam_1d_route_auth_20260920_v1';
const TEST_WINDOW_END = Date.parse('2026-09-20T20:00:00Z');

function secureEquals(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function isUniqueViolation(error: unknown) {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code?: string }).code === '23505'
  );
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

  const templateId = process.env.SENDER_TEMPLATE_EXAM_1D?.trim();
  if (!templateId) {
    return NextResponse.json(
      { success: false, message: 'Missing SENDER_TEMPLATE_EXAM_1D.' },
      { status: 500 }
    );
  }

  const admin = createAdminClient();
  const { data: usersData, error: usersError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (usersError) throw usersError;

  const targetUser = usersData.users.find(
    (user) => user.email?.trim().toLowerCase() === TARGET_EMAIL
  );

  if (!targetUser) {
    return NextResponse.json(
      { success: false, message: 'Authorized test recipient is not an Evaluo user.' },
      { status: 404 }
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any;
  const { data: reservation, error: reservationError } = await db
    .from('email_campaign_deliveries')
    .insert({
      campaign_key: TEST_KEY,
      user_id: targetUser.id,
      context: {
        test: 'sender_exam_1d_template',
        exam_date: '2026-09-24',
        days_left: 1,
      },
      status: 'sending',
    })
    .select('id')
    .single();

  if (reservationError) {
    if (isUniqueViolation(reservationError)) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: 'already_reserved',
      });
    }
    throw reservationError;
  }

  const materia = 'IPC — Introducción al Pensamiento Científico';
  const formattedExamDate = '24 de septiembre de 2026';
  const subject = `Mañana rendís ${materia}`;
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://evaluo.com.ar').replace(/\/$/, '');
  const calendarUrl = new URL('/calendario', baseUrl);
  calendarUrl.searchParams.set('utm_source', 'sender');
  calendarUrl.searchParams.set('utm_medium', 'email');
  calendarUrl.searchParams.set('utm_campaign', 'exam_reminder_1d');
  calendarUrl.searchParams.set('utm_content', 'calendar_reminder');

  try {
    const senderResult = await sendSenderTemplate({
      templateId,
      toEmail: TARGET_EMAIL,
      toName: 'Gonzalo',
      variables: {
        subject,
        firstname: 'Gonzalo',
        nombre: 'Gonzalo',
        materia,
        exam_date: formattedExamDate,
        fecha_del_examen: formattedExamDate,
        exam_date_iso: '2026-09-24',
        days_left: 1,
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
      .eq('id', reservation.id);

    if (markSentError) {
      logError('manualExam1dTest.markSent', markSentError, {
        deliveryId: reservation.id,
      });
    }

    logInfo('manualExam1dTest.sent', {
      recipient: TARGET_EMAIL,
      emailId: senderResult.emailId,
    });

    return NextResponse.json({
      success: true,
      emailId: senderResult.emailId,
    });
  } catch (error) {
    logError('manualExam1dTest.send', error, {
      recipient: TARGET_EMAIL,
      deliveryId: reservation.id,
    });
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Sender test failed.',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return handle(request);
}
