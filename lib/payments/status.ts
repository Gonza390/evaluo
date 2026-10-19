const ACTIVE_SUBSCRIPTION_STATUSES = new Set(['active', 'approved', 'authorized', 'trialing']);
const FAILED_PAYMENT_STATUSES = new Set([
  'rejected',
  'cancelled',
  'canceled',
  'refunded',
  'charged_back',
]);

export function isPremiumSubscriptionStatus(status: string | null | undefined) {
  return ACTIVE_SUBSCRIPTION_STATUSES.has((status ?? '').toLowerCase());
}

export function hasPremiumSubscriptionAccess(
  status: string | null | undefined,
  expiresAt: string | null | undefined,
  now = Date.now()
) {
  const normalized = (status ?? '').toLowerCase();
  if (ACTIVE_SUBSCRIPTION_STATUSES.has(normalized)) {
    if (!expiresAt) return true;
    const expiration = new Date(expiresAt).getTime();
    return Number.isFinite(expiration) && expiration > now;
  }
  if (normalized !== 'canceled' || !expiresAt) return false;
  const expiration = new Date(expiresAt).getTime();
  return Number.isFinite(expiration) && expiration > now;
}

export function subscriptionStatusForPayment(status: string | null | undefined) {
  const normalized = (status ?? '').toLowerCase();
  if (normalized === 'approved') return 'active' as const;
  if (FAILED_PAYMENT_STATUSES.has(normalized)) return 'past_due' as const;
  return null;
}
