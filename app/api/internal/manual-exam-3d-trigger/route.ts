import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TARGET_PATH = '/api/internal/manual-exam-3d-test';
const TRIGGER_KEY = 'manual_sender_exam_3d_trigger_auth_20260920_v1';

function secureEquals(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export async function GET(request: Request) {
  const suppliedToken = new URL(request.url).searchParams.get('token')?.trim() || '';
  if (!suppliedToken) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  // This delivery row is a temporary one-shot auth record, not an email delivery.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any;

  const { data: authRow, error: authError } = await db
    .from('email_campaign_deliveries')
    .select('id,status,context')
    .eq('campaign_key', TRIGGER_KEY)
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
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
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
  if (!claimed) {
    return NextResponse.json(
      { success: false, message: 'Trigger already consumed.' },
      { status: 409 }
    );
  }

  const secret =
    process.env.INTERNAL_QUEUE_SECRET?.trim() || process.env.CRON_SECRET?.trim();

  if (!secret) {
    return NextResponse.json(
      { success: false, message: 'Missing internal queue secret.' },
      { status: 500 }
    );
  }

  const targetUrl = new URL(TARGET_PATH, request.url);
  targetUrl.search = '';

  const response = await fetch(targetUrl, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${secret}`,
      Accept: 'application/json',
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(20_000),
  });

  const body = await response.text();
  return new Response(body, {
    status: response.status,
    headers: {
      'Content-Type': response.headers.get('content-type') || 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}
