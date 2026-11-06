import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase-admin';
import { verifyCreemWebhookSignature } from '@/lib/payments/creem';
import { asObject, reconcileCreemBillingEvent } from '@/lib/payments/creem-reconcile';
import { isCreemModeEnabled } from '@/lib/payments/creem-international';
import { canReclaimCreemPreviewEvent } from '@/lib/payments/creem-events';

export const runtime = 'nodejs';
const PROVIDER = 'creem';
const MAX_BYTES = 65536;
const acceptedTypes = new Set([
  'checkout.completed','subscription.active','subscription.paid',
  'subscription.canceled','subscription.expired','subscription.trialing',
  'subscription.scheduled_cancel','subscription.past_due',
  'subscription.paused','subscription.update','refund.created','dispute.created',
]);

function reply(data: Record<string, unknown>, status = 200) {
  return NextResponse.json(data,{ status, headers:{ 'Cache-Control':'no-store' } });
}

/** Separate LIVE endpoint, secret and credentials; test events cannot activate Premium. */
export async function POST(request: Request) {
  if (!isCreemModeEnabled('live')) return reply({error:'creem_live_disabled'},503);
  const secret = process.env.CREEM_LIVE_WEBHOOK_SECRET?.trim();
  if (!secret) return reply({error:'creem_live_webhook_not_configured'},503);
  const length = Number(request.headers.get('content-length'));
  if (Number.isFinite(length) && length > MAX_BYTES) return reply({error:'payload_too_large'},413);
  let raw = '';
  try { raw = await request.text(); } catch { return reply({error:'bad_body'},400); }
  if (Buffer.byteLength(raw,'utf8') > MAX_BYTES) return reply({error:'payload_too_large'},413);
  if (!verifyCreemWebhookSignature(raw,request.headers.get('creem-signature'),secret)) {
    return reply({error:'invalid_signature'},401);
  }
  let payload: unknown;
  try { payload = JSON.parse(raw); } catch { return reply({error:'invalid_json'},400); }
  const envelope = asObject(payload);
  const object = asObject(envelope?.object);
  if (!envelope || !object || typeof envelope.id !== 'string' ||
      !/^evt_[a-zA-Z0-9_-]{3,120}$/.test(envelope.id) ||
      typeof envelope.eventType !== 'string' || !acceptedTypes.has(envelope.eventType) ||
      typeof object.id !== 'string' || !/^(?:ch|sub|ref|disp)_[a-zA-Z0-9_-]{3,120}$/.test(object.id)) {
    return reply({error:'invalid_event'},422);
  }
  // A test payload sent to the live endpoint must fail even with an otherwise
  // valid structure. Signing secrets are NEVER shared between environments.
  if (object.mode === 'test') return reply({error:'wrong_environment'},422);
  const admin = createAdminClient() as unknown as SupabaseClient;
  const now = new Date().toISOString();
  let rowId: string | null = null;
  const inserted = await admin.from('payment_webhook_events').insert({
    provider:PROVIDER,provider_event_id:envelope.id,
    event_type:envelope.eventType,resource_id:object.id,status:'received',received_at:now,
  }).select('id').single();
  if (!inserted.error) rowId = inserted.data.id;
  else if (inserted.error.code === '23505') {
    const old = await admin.from('payment_webhook_events')
      .select('id,status,received_at').eq('provider',PROVIDER).eq('provider_event_id',envelope.id).maybeSingle();
    if (old.error || !old.data) return reply({error:'event_lookup_failed'},503);
    if (!canReclaimCreemPreviewEvent(old.data.status,old.data.received_at)) return reply({ok:true,duplicate:true});
    let claim = admin.from('payment_webhook_events').update({
      status:'received',received_at:now,processed_at:null,error_message:null,
    }).eq('id',old.data.id).eq('provider',PROVIDER).eq('status',old.data.status);
    if (old.data.status === 'received') {
      claim = claim.lt('received_at',new Date(Date.now()-5*60_000).toISOString());
    }
    const reclaimed = await claim.select('id').maybeSingle();
    if (reclaimed.error) return reply({error:'reclaim_failed'},503);
    if (!reclaimed.data) return reply({ok:true,duplicate:true});
    rowId = reclaimed.data.id;
  } else return reply({error:'event_storage_failed'},503);

  try {
    const status = await reconcileCreemBillingEvent(admin,'live',payload);
    const saved = await admin.from('payment_webhook_events')
      .update({status,processed_at:new Date().toISOString(),error_message:null}).eq('id',rowId);
    if (saved.error) throw new Error('creem_event_finalize_failed');
    return reply({ok:true,status});
  } catch {
    await admin.from('payment_webhook_events').update({
      status:'failed',error_message:'creem_live_reconciliation_failed',
      processed_at:new Date().toISOString(),
    }).eq('id',rowId);
    return reply({error:'reconciliation_failed'},503);
  }
}
