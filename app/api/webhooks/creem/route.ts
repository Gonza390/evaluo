import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase-admin';
import { verifyCreemWebhookSignature } from '@/lib/payments/creem';
import { canReclaimCreemPreviewEvent, parseCreemPreviewEvent } from '@/lib/payments/creem-events';

export const runtime = 'nodejs';

const MAX_WEBHOOK_BYTES = 64 * 1024;
const PROVIDER = 'creem_test';

function json(payload: Record<string, unknown>, status = 200) {
  return NextResponse.json(payload, { status, headers: { 'Cache-Control': 'no-store' } });
}

/**
 * Test-only receiver. Preview deployments share a Supabase project with
 * production: Creem test events MUST NEVER mutate user_subscriptions.
 * Future live billing requires its own signed endpoint, product and secret.
 */
export async function POST(request: Request) {
  if (process.env.VERCEL_ENV === 'production') {
    return json({ error: 'creem_test_webhook_preview_only' }, 503);
  }

  const secret = process.env.CREEM_WEBHOOK_SECRET?.trim();
  if (!secret || !process.env.CREEM_API_KEY?.trim().startsWith('creem_test_')) {
    return json({ error: 'creem_test_webhook_not_configured' }, 503);
  }

  const declaredSize = Number(request.headers.get('content-length'));
  if (Number.isFinite(declaredSize) && declaredSize > MAX_WEBHOOK_BYTES) {
    return json({ error: 'payload_too_large' }, 413);
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return json({ error: 'invalid_body' }, 400);
  }
  if (Buffer.byteLength(rawBody, 'utf8') > MAX_WEBHOOK_BYTES) {
    return json({ error: 'payload_too_large' }, 413);
  }

  if (!verifyCreemWebhookSignature(rawBody, request.headers.get('creem-signature'), secret)) {
    return json({ error: 'invalid_signature' }, 401);
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  const event = parseCreemPreviewEvent(payload);
  if (!event) return json({ error: 'invalid_event' }, 422);

  // All receipt changes are protected by a unique (provider, event ID) index.
  // A conditional retry claim avoids replaying concurrent webhook deliveries.
  const admin = createAdminClient() as unknown as SupabaseClient;
  const now = new Date().toISOString();
  let eventRowId: string | null = null;
  const { data: inserted, error: insertionError } = await admin
    .from('payment_webhook_events')
    .insert({
      provider: PROVIDER,
      provider_event_id: event.eventId,
      event_type: event.eventType,
      resource_id: event.resourceId,
      status: 'received',
      received_at: now,
    })
    .select('id')
    .single();

  if (!insertionError) {
    eventRowId = String(inserted.id);
  } else if (insertionError.code === '23505') {
    const { data: old, error: lookupError } = await admin
      .from('payment_webhook_events')
      .select('id,status,received_at')
      .eq('provider', PROVIDER)
      .eq('provider_event_id', event.eventId)
      .maybeSingle();
    if (lookupError || !old) return json({ error: 'event_lookup_failed' }, 503);
    if (!canReclaimCreemPreviewEvent(old.status, old.received_at)) {
      return json({ ok: true, duplicate: true });
    }
    let claim = admin
      .from('payment_webhook_events')
      .update({
        status: 'received',
        received_at: now,
        processed_at: null,
        error_message: null,
      })
      .eq('id', old.id)
      .eq('provider', PROVIDER)
      .eq('status', old.status);
    if (old.status === 'received') {
      claim = claim.lt('received_at', new Date(Date.now() - 5 * 60_000).toISOString());
    }
    const { data: reclaimed, error: claimError } = await claim.select('id').maybeSingle();
    if (claimError) return json({ error: 'event_retry_failed' }, 503);
    if (!reclaimed) return json({ ok: true, duplicate: true });
    eventRowId = String(reclaimed.id);
  } else {
    return json({ error: 'event_not_recorded' }, 503);
  }

  try {
    // An accepted event means its test-mode signature and structure are valid;
    // it is NOT evidence of production payment. Do not unlock Premium here.
    const finalStatus = event.accepted ? 'processed' : 'ignored';
    const { error } = await admin
      .from('payment_webhook_events')
      .update({ status: finalStatus, processed_at: new Date().toISOString() })
      .eq('id', eventRowId);
    if (error) throw error;
    return json({ ok: true, mode: 'test', accepted: event.accepted });
  } catch {
    await admin
      .from('payment_webhook_events')
      .update({
        status: 'failed',
        error_message: 'creem_test_receipt_processing_failed',
        processed_at: new Date().toISOString(),
      })
      .eq('id', eventRowId);
    return json({ error: 'processing_failed' }, 500);
  }
}
