import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase-admin';
import {
  findMercadoPagoAuthorizedPaymentByPaymentId,
  getMercadoPagoAuthorizedPayment,
  getMercadoPagoSubscription,
  type MercadoPagoAuthorizedPayment,
  verifyMercadoPagoWebhook,
} from '@/lib/payments/mercadopago';
import { subscriptionStatusForPayment } from '@/lib/payments/status';
import { trackServerAnalyticsEvent } from '@/lib/server-analytics';

type WebhookBody = {
  id?: string | number;
  type?: string;
  action?: string;
  data?: { id?: string | number };
};

const ACTIVE_PROVIDER_STATUSES = new Set(['authorized']);

async function reconcileAuthorizedPayment(
  admin: SupabaseClient,
  invoice: MercadoPagoAuthorizedPayment
) {
  const { data: subscription, error: subscriptionError } = await admin
    .from('user_subscriptions')
    .select('id, user_id, amount_ars')
    .eq('payment_provider', 'mercadopago')
    .eq('provider_subscription_id', invoice.preapproval_id)
    .single();
  if (subscriptionError || !subscription)
    throw new Error('Suscripcion de la factura no encontrada.');

  const amount = Number(invoice.transaction_amount);
  if (invoice.currency_id !== 'ARS' || !Number.isFinite(amount) || amount <= 0) {
    throw new Error('Importe o moneda de la factura invalido.');
  }
  if (Number(subscription.amount_ars) !== amount) {
    throw new Error('Importe de factura no coincide con la suscripcion.');
  }

  const paymentId = invoice.payment?.id;
  const paymentStatus = invoice.payment?.status?.toLowerCase() || invoice.summarized?.toLowerCase();
  if (!paymentId || !paymentStatus) return;

  const now = new Date().toISOString();
  const { error: transactionError } = await admin.from('payment_transactions').upsert(
    {
      user_id: subscription.user_id,
      subscription_id: subscription.id,
      provider: 'mercadopago',
      provider_payment_id: String(paymentId),
      provider_subscription_id: invoice.preapproval_id,
      status: paymentStatus,
      amount_ars: amount,
      currency: invoice.currency_id,
      paid_at: paymentStatus === 'approved' ? (invoice.debit_date ?? now) : null,
      raw_summary: {
        authorized_payment_id: String(invoice.id),
        status_detail: invoice.payment?.status_detail ?? null,
        retry_attempt: invoice.retry_attempt ?? null,
      },
      updated_at: now,
    },
    { onConflict: 'provider,provider_payment_id' }
  );
  if (transactionError) throw transactionError;

  const reconciledSubscriptionStatus = subscriptionStatusForPayment(paymentStatus);
  if (reconciledSubscriptionStatus === 'active') {
    const providerSubscription = await getMercadoPagoSubscription(invoice.preapproval_id);
    const { error: updateError } = await admin
      .from('user_subscriptions')
      .update({
        status: 'active',
        next_payment_date: providerSubscription.next_payment_date ?? null,
        current_period_end: providerSubscription.next_payment_date ?? null,
        provider_updated_at: providerSubscription.last_modified ?? now,
        updated_at: now,
      })
      .eq('id', subscription.id);
    if (updateError) throw updateError;
    await trackServerAnalyticsEvent({
      eventName: 'premium_subscription_activated',
      userId: subscription.user_id,
      path: '/api/webhooks/mercadopago',
      metadata: { provider: 'mercadopago', amount_ars: amount },
    });
  } else if (reconciledSubscriptionStatus === 'past_due') {
    const { error: updateError } = await admin
      .from('user_subscriptions')
      .update({ status: 'past_due', provider_updated_at: now, updated_at: now })
      .eq('id', subscription.id);
    if (updateError) throw updateError;
  }
}

export async function POST(request: Request) {
  let body: WebhookBody;
  try {
    body = (await request.json()) as WebhookBody;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const resourceId = String(body.data?.id ?? '').trim();
  const eventId = String(body.id ?? '').trim();
  const eventType = String(body.type ?? body.action ?? '').trim();
  if (!resourceId || !eventId || !eventType) {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }

  const isValid = verifyMercadoPagoWebhook({
    signature: request.headers.get('x-signature'),
    requestId: request.headers.get('x-request-id'),
    dataId: resourceId,
  });
  if (!isValid) return NextResponse.json({ error: 'invalid_signature' }, { status: 401 });

  const admin = createAdminClient() as unknown as SupabaseClient;
  const { data: inserted, error: eventError } = await admin
    .from('payment_webhook_events')
    .insert({
      provider_event_id: eventId,
      event_type: eventType,
      resource_id: resourceId,
    })
    .select('id')
    .maybeSingle();

  if (eventError) {
    if (eventError.code === '23505') return NextResponse.json({ ok: true, duplicate: true });
    return NextResponse.json({ error: 'event_not_recorded' }, { status: 500 });
  }

  const eventRowId = inserted?.id;
  try {
    const now = new Date().toISOString();
    if (eventType.includes('subscription_authorized_payment')) {
      const invoice = await getMercadoPagoAuthorizedPayment(resourceId);
      await reconcileAuthorizedPayment(admin, invoice);
    } else if (eventType === 'payment' || eventType.includes('payment.')) {
      const invoice = await findMercadoPagoAuthorizedPaymentByPaymentId(resourceId);
      if (!invoice) {
        await admin
          .from('payment_webhook_events')
          .update({ status: 'ignored', processed_at: new Date().toISOString() })
          .eq('id', eventRowId);
        return NextResponse.json({ ok: true, ignored: true });
      }
      await reconcileAuthorizedPayment(admin, invoice);
    } else if (!eventType.includes('subscription') && !eventType.includes('preapproval')) {
      await admin
        .from('payment_webhook_events')
        .update({
          status: 'ignored',
          processed_at: new Date().toISOString(),
        })
        .eq('id', eventRowId);
      return NextResponse.json({ ok: true, ignored: true });
    } else {
      const providerSubscription = await getMercadoPagoSubscription(resourceId);
      const attemptId = providerSubscription.external_reference?.trim();
      if (!attemptId) throw new Error('Suscripcion sin external_reference.');

      const { data: attempt, error: attemptError } = await admin
        .from('payment_checkout_attempts')
        .select('id, user_id, plan_id, promotion_claim_id, amount_ars')
        .eq('id', attemptId)
        .eq('provider_subscription_id', providerSubscription.id)
        .single();
      if (attemptError || !attempt) throw new Error('Intento de checkout no encontrado.');

      const providerAmount = Number(providerSubscription.auto_recurring?.transaction_amount);
      if (
        providerSubscription.auto_recurring?.currency_id !== 'ARS' ||
        !Number.isFinite(providerAmount) ||
        providerAmount !== Number(attempt.amount_ars)
      ) {
        throw new Error('Importe o moneda de la suscripcion no coincide.');
      }

      const isActive = ACTIVE_PROVIDER_STATUSES.has(providerSubscription.status.toLowerCase());
      const internalStatus = isActive ? 'active' : providerSubscription.status.toLowerCase();
      const { error: subscriptionError } = await admin.from('user_subscriptions').upsert(
        {
          user_id: attempt.user_id,
          plan_id: attempt.plan_id,
          status: internalStatus,
          payment_provider: 'mercadopago',
          payment_reference: providerSubscription.id,
          provider_subscription_id: providerSubscription.id,
          amount_ars: providerAmount,
          next_payment_date: providerSubscription.next_payment_date ?? null,
          current_period_end: providerSubscription.next_payment_date ?? null,
          promotion_code: attempt.promotion_claim_id ? 'founders_2026' : null,
          canceled_at: internalStatus === 'canceled' ? now : null,
          expires_at:
            internalStatus === 'canceled' ? (providerSubscription.next_payment_date ?? now) : null,
          provider_updated_at: providerSubscription.last_modified ?? now,
          updated_at: now,
        },
        { onConflict: 'payment_provider,provider_subscription_id' }
      );
      if (subscriptionError) throw subscriptionError;

      if (isActive) {
        await trackServerAnalyticsEvent({
          eventName: 'premium_subscription_activated',
          userId: attempt.user_id,
          path: '/api/webhooks/mercadopago',
          metadata: {
            provider: 'mercadopago',
            amount_ars: providerAmount,
            promotion: attempt.promotion_claim_id ? 'founders_2026' : null,
          },
        });
      }

      await admin
        .from('payment_checkout_attempts')
        .update({
          status: isActive ? 'approved' : 'pending',
          updated_at: now,
        })
        .eq('id', attempt.id);

      if (attempt.promotion_claim_id && isActive) {
        await admin
          .from('payment_promotion_claims')
          .update({
            status: 'activated',
            activated_at: now,
          })
          .eq('id', attempt.promotion_claim_id)
          .eq('status', 'pending');
      }
    }

    await admin
      .from('payment_webhook_events')
      .update({
        status: 'processed',
        processed_at: now,
      })
      .eq('id', eventRowId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    await admin
      .from('payment_webhook_events')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message.slice(0, 500) : 'unexpected_error',
        processed_at: new Date().toISOString(),
      })
      .eq('id', eventRowId);
    return NextResponse.json({ error: 'processing_failed' }, { status: 500 });
  }
}
