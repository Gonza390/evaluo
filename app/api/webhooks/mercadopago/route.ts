import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase-admin';
import {
  findMercadoPagoAuthorizedPaymentByPaymentId,
  getMercadoPagoAuthorizedPayment,
  getMercadoPagoPayment,
  getMercadoPagoSubscription,
  type MercadoPagoAuthorizedPayment,
  type MercadoPagoPayment,
  verifyMercadoPagoWebhook,
} from '@/lib/payments/mercadopago';
import { PREMIUM_SEMESTER_MONTHS, PREMIUM_SEMESTER_PRICE_ARS } from '@/lib/payments/offers';
import { subscriptionStatusForPayment } from '@/lib/payments/status';
import { trackServerAnalyticsEvent } from '@/lib/server-analytics';

type WebhookBody = {
  id?: string | number;
  type?: string;
  action?: string;
  data?: { id?: string | number };
};

const ACTIVE_PROVIDER_STATUSES = new Set(['authorized']);
const ONE_TIME_FAILED_STATUSES = new Set([
  'rejected',
  'cancelled',
  'canceled',
  'refunded',
  'charged_back',
]);

function addCalendarMonths(value: string, months: number) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return new Date(Date.now() + 183 * 24 * 60 * 60_000).toISOString();
  }
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + months);
  const lastDay = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)
  ).getUTCDate();
  date.setUTCDate(Math.min(day, lastDay));
  return date.toISOString();
}

async function getPromotionCode(admin: SupabaseClient, claimId: string | null | undefined) {
  if (!claimId) return null;
  const { data, error } = await admin
    .from('payment_promotion_claims')
    .select('promotion_code')
    .eq('id', claimId)
    .maybeSingle();
  if (error) throw error;
  return data?.promotion_code ? String(data.promotion_code) : null;
}

async function updatePromotionClaim(
  admin: SupabaseClient,
  claimId: string | null | undefined,
  status: 'activated' | 'released',
  now: string
) {
  if (!claimId) return;
  const patch =
    status === 'activated'
      ? { status: 'activated', activated_at: now }
      : { status: 'released', released_at: now };
  const { error } = await admin
    .from('payment_promotion_claims')
    .update(patch)
    .eq('id', claimId)
    .eq('status', 'pending');
  if (error) throw error;
}

async function reconcileAuthorizedPayment(
  admin: SupabaseClient,
  invoice: MercadoPagoAuthorizedPayment
) {
  const { data: subscription, error: subscriptionError } = await admin
    .from('user_subscriptions')
    .select('id, user_id, amount_ars, promotion_code')
    .eq('payment_provider', 'mercadopago')
    .eq('provider_subscription_id', invoice.preapproval_id)
    .single();
  if (subscriptionError || !subscription) {
    throw new Error('Suscripcion de la factura no encontrada.');
  }

  const amount = Number(invoice.transaction_amount);
  if (invoice.currency_id !== 'ARS' || !Number.isFinite(amount) || amount <= 0) {
    throw new Error('Importe o moneda de la factura invalido.');
  }
  if (Number(subscription.amount_ars) !== amount) {
    throw new Error('Importe de factura no coincide con la suscripcion.');
  }

  const paymentId = invoice.payment?.id;
  const paymentStatus =
    invoice.payment?.status?.toLowerCase() || invoice.summarized?.toLowerCase();
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
        promotion_code: subscription.promotion_code ?? null,
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
      metadata: {
        provider: 'mercadopago',
        amount_ars: amount,
        offer_code: 'monthly',
        promotion: subscription.promotion_code ?? undefined,
      },
    });
  } else if (reconciledSubscriptionStatus === 'past_due') {
    const { error: updateError } = await admin
      .from('user_subscriptions')
      .update({ status: 'past_due', provider_updated_at: now, updated_at: now })
      .eq('id', subscription.id);
    if (updateError) throw updateError;
  }
}

async function reconcileOneTimePayment(admin: SupabaseClient, payment: MercadoPagoPayment) {
  const attemptId = payment.external_reference?.trim();
  if (!attemptId) return false;

  const { data: attempt, error: attemptError } = await admin
    .from('payment_checkout_attempts')
    .select(
      'id, user_id, plan_id, promotion_claim_id, referral_code_id, offer_code, base_amount_ars, discount_amount_ars, amount_ars, status'
    )
    .eq('id', attemptId)
    .maybeSingle();
  if (attemptError) throw attemptError;
  if (!attempt) return false;

  const amount = Number(payment.transaction_amount);
  if (
    payment.currency_id !== 'ARS' ||
    !Number.isFinite(amount) ||
    amount !== Number(attempt.amount_ars) ||
    attempt.offer_code !== 'semester' ||
    Number(attempt.base_amount_ars) !== PREMIUM_SEMESTER_PRICE_ARS
  ) {
    return false;
  }

  const paymentStatus = (payment.status ?? '').toLowerCase();
  if (!paymentStatus) return false;
  const now = new Date().toISOString();
  const paymentId = String(payment.id);
  const approvedAt = payment.date_approved ?? payment.date_created ?? now;
  const isApproved = paymentStatus === 'approved';
  const failed = ONE_TIME_FAILED_STATUSES.has(paymentStatus);
  const previousAttemptStatus = String(attempt.status ?? '').toLowerCase();
  const promotionCode = await getPromotionCode(admin, attempt.promotion_claim_id);

  let subscriptionId: string | null = null;
  if (isApproved) {
    subscriptionId = attempt.id;
    const expiresAt = addCalendarMonths(approvedAt, PREMIUM_SEMESTER_MONTHS);
    const { error: subscriptionError } = await admin.from('user_subscriptions').upsert(
      {
        id: attempt.id,
        user_id: attempt.user_id,
        plan_id: attempt.plan_id,
        status: 'active',
        started_at: approvedAt,
        expires_at: expiresAt,
        payment_provider: 'mercadopago',
        payment_reference: paymentId,
        provider_subscription_id: null,
        amount_ars: amount,
        next_payment_date: null,
        current_period_end: expiresAt,
        promotion_code: promotionCode ?? 'semester_2026',
        provider_updated_at: now,
        canceled_at: null,
        updated_at: now,
      },
      { onConflict: 'id' }
    );
    if (subscriptionError) throw subscriptionError;
  } else if (failed) {
    const { error: revokeError } = await admin
      .from('user_subscriptions')
      .update({
        status: 'canceled',
        expires_at: now,
        current_period_end: now,
        canceled_at: now,
        provider_updated_at: now,
        updated_at: now,
      })
      .eq('id', attempt.id)
      .eq('payment_reference', paymentId);
    if (revokeError) throw revokeError;
  }

  const { error: transactionError } = await admin.from('payment_transactions').upsert(
    {
      user_id: attempt.user_id,
      subscription_id: subscriptionId,
      provider: 'mercadopago',
      provider_payment_id: paymentId,
      provider_subscription_id: null,
      status: paymentStatus,
      amount_ars: amount,
      currency: payment.currency_id,
      paid_at: isApproved ? approvedAt : null,
      raw_summary: {
        checkout_attempt_id: attempt.id,
        offer_code: 'semester',
        base_amount_ars: Number(attempt.base_amount_ars),
        discount_amount_ars: Number(attempt.discount_amount_ars),
        referral_code_id: attempt.referral_code_id ?? null,
        promotion_code: promotionCode,
        status_detail: payment.status_detail ?? null,
      },
      updated_at: now,
    },
    { onConflict: 'provider,provider_payment_id' }
  );
  if (transactionError) throw transactionError;

  const { error: attemptUpdateError } = await admin
    .from('payment_checkout_attempts')
    .update({
      status: isApproved ? 'approved' : failed ? 'failed' : 'pending',
      updated_at: now,
    })
    .eq('id', attempt.id);
  if (attemptUpdateError) throw attemptUpdateError;

  if (isApproved) {
    await updatePromotionClaim(admin, attempt.promotion_claim_id, 'activated', now);
  } else if (failed) {
    await updatePromotionClaim(admin, attempt.promotion_claim_id, 'released', now);
  }

  if (isApproved && previousAttemptStatus !== 'approved') {
    await trackServerAnalyticsEvent({
      eventName: 'premium_subscription_activated',
      userId: attempt.user_id,
      path: '/api/webhooks/mercadopago',
      metadata: {
        provider: 'mercadopago',
        amount_ars: amount,
        base_amount_ars: Number(attempt.base_amount_ars),
        discount_amount_ars: Number(attempt.discount_amount_ars),
        offer_code: 'semester',
        billing_mode: 'fixed_term',
        access_months: PREMIUM_SEMESTER_MONTHS,
        promotion: promotionCode ?? undefined,
        referral_code_id: attempt.referral_code_id ?? undefined,
      },
    });
  }

  return true;
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
      if (invoice) {
        await reconcileAuthorizedPayment(admin, invoice);
      } else {
        const payment = await getMercadoPagoPayment(resourceId);
        const handled = await reconcileOneTimePayment(admin, payment);
        if (!handled) {
          await admin
            .from('payment_webhook_events')
            .update({ status: 'ignored', processed_at: now })
            .eq('id', eventRowId);
          return NextResponse.json({ ok: true, ignored: true });
        }
      }
    } else if (!eventType.includes('subscription') && !eventType.includes('preapproval')) {
      await admin
        .from('payment_webhook_events')
        .update({
          status: 'ignored',
          processed_at: now,
        })
        .eq('id', eventRowId);
      return NextResponse.json({ ok: true, ignored: true });
    } else {
      const providerSubscription = await getMercadoPagoSubscription(resourceId);
      const attemptId = providerSubscription.external_reference?.trim();
      if (!attemptId) throw new Error('Suscripcion sin external_reference.');

      const { data: attempt, error: attemptError } = await admin
        .from('payment_checkout_attempts')
        .select(
          'id, user_id, plan_id, promotion_claim_id, referral_code_id, offer_code, base_amount_ars, discount_amount_ars, amount_ars'
        )
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

      const promotionCode = await getPromotionCode(admin, attempt.promotion_claim_id);
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
          promotion_code: promotionCode,
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
            base_amount_ars: Number(attempt.base_amount_ars),
            discount_amount_ars: Number(attempt.discount_amount_ars),
            promotion: promotionCode ?? undefined,
            referral_code_id: attempt.referral_code_id ?? undefined,
            offer_code: attempt.offer_code,
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

      if (isActive) {
        await updatePromotionClaim(admin, attempt.promotion_claim_id, 'activated', now);
      } else if (internalStatus === 'canceled' || internalStatus === 'cancelled') {
        await updatePromotionClaim(admin, attempt.promotion_claim_id, 'released', now);
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
