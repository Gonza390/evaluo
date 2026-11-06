import { CREEM_TEST_PRODUCT_ID } from './creem';

type JsonRecord = Record<string, unknown>;
export type CreemPreviewEvent = {
  eventId: string;
  eventType: string;
  resourceId: string;
  accepted: boolean;
  reason: 'verified_test_event' | 'unsupported_event' | 'wrong_product' | 'invalid_payment' | 'not_test_mode';
};

const EVENT_ID = /^evt_[a-zA-Z0-9_-]{3,120}$/;
const RESOURCE_ID = /^(?:ch|sub|ref|disp)_[a-zA-Z0-9_-]{3,120}$/;
const TEST_EVENTS = new Set([
  'checkout.completed',
  'subscription.active',
  'subscription.paid',
  'subscription.canceled',
  'subscription.expired',
  'subscription.trialing',
  'subscription.paused',
  'subscription.update',
  'refund.created',
  'dispute.created',
]);
const SUBSCRIPTION_EVENTS = new Set([
  'subscription.active',
  'subscription.paid',
  'subscription.canceled',
  'subscription.expired',
  'subscription.trialing',
  'subscription.paused',
  'subscription.update',
]);

function record(value: unknown): JsonRecord | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as JsonRecord
    : null;
}

function productId(value: unknown) {
  if (typeof value === 'string') return value;
  return record(value)?.id;
}

/**
 * Returns null for malformed/untrusted payloads. These are sandbox receipts:
 * accepting a signed Creem TEST event does not grant Premium in the shared DB.
 */
export function parseCreemPreviewEvent(payload: unknown): CreemPreviewEvent | null {
  const envelope = record(payload);
  const event = envelope?.eventType;
  const id = envelope?.id;
  const object = record(envelope?.object);
  const resourceId = object?.id;
  if (
    typeof event !== 'string' || typeof id !== 'string' ||
    !EVENT_ID.test(id) || typeof resourceId !== 'string' ||
    !RESOURCE_ID.test(resourceId) || !object
  ) return null;

  const base = { eventId: id, eventType: event, resourceId };
  const ignored = (reason: CreemPreviewEvent['reason']): CreemPreviewEvent =>
    ({ ...base, accepted: false, reason });

  if (!TEST_EVENTS.has(event)) return ignored('unsupported_event');

  if (event === 'checkout.completed') {
    if (!resourceId.startsWith('ch_')) return null;
    if (object.mode !== 'test') return ignored('not_test_mode');
    const order = record(object.order);
    const subscription = record(object.subscription);
    if (productId(object.product) !== CREEM_TEST_PRODUCT_ID ||
        (order?.product && productId(order.product) !== CREEM_TEST_PRODUCT_ID)) {
      return ignored('wrong_product');
    }
    // A successful return URL is not proof of payment. Require a paid order.
    if (object.status !== 'completed' || order?.status !== 'paid' ||
        order?.currency !== 'USD' || order?.amount !== 999 ||
        typeof object.request_id !== 'string' ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(object.request_id) ||
        typeof subscription?.id !== 'string' || !subscription.id.startsWith('sub_')) {
      return ignored('invalid_payment');
    }
    return { ...base, accepted: true, reason: 'verified_test_event' };
  }

  if (SUBSCRIPTION_EVENTS.has(event)) {
    if (!resourceId.startsWith('sub_')) return null;
    // Subscription webhooks do not always carry mode, but are signed by a
    // separate Preview-only test webhook secret and scoped to the test product.
    if (object.mode && object.mode !== 'test') return ignored('not_test_mode');
    if (productId(object.product) !== CREEM_TEST_PRODUCT_ID) {
      return ignored('wrong_product');
    }
    // Subscription payment is confirmed by Creem, not a browser redirect.
    if (event === 'subscription.paid') {
      const end = object.current_period_end_date;
      if (object.status !== 'active' || typeof end !== 'string' ||
          !Number.isFinite(Date.parse(end)) || Date.parse(end) <= Date.now()) {
        return ignored('invalid_payment');
      }
    }
    return { ...base, accepted: true, reason: 'verified_test_event' };
  }

  // Refund/dispute event objects omit product IDs: log their signature-verified
  // receipt for future reconciliation; never modify entitlements in test mode.
  if (!resourceId.startsWith(event === 'refund.created' ? 'ref_' : 'disp_')) return null;
  return { ...base, accepted: true, reason: 'verified_test_event' };
}

export function canReclaimCreemPreviewEvent(
  status: string,
  receivedAt: string | null | undefined,
  now = Date.now(),
): boolean {
  if (status === 'failed') return true;
  if (status !== 'received' || !receivedAt) return false;
  const receivedTime = Date.parse(receivedAt);
  return Number.isFinite(receivedTime) && receivedTime < now - 5 * 60_000;
}
