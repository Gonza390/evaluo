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

/** El acceso pago real es la fuente de verdad; status='active' puede estar vencido. */
export function premiumPurchaseDisplayState(data: {
  plan?: 'free' | 'premium' | string | null;
  status?: string | null;
}): 'active' | 'attention' | 'inactive' {
  if (data.plan === 'premium') return 'active';
  if (['past_due', 'paused'].includes((data.status ?? '').toLowerCase())) return 'attention';
  return 'inactive';
}

/** Nunca mostrar compra aprobada por un status de pago con acceso vencido. */
export function premiumPaymentResultState(data: {
  plan?: 'free' | 'premium' | string | null;
  status?: string | null;
  checkoutStatus?: string | null;
}): 'processing' | 'approved' | 'failed' | 'attention' {
  if (data.plan === 'premium') return 'approved';
  const attempt = (data.checkoutStatus ?? '').toLowerCase();
  if (['failed', 'expired', 'rejected'].includes(attempt)) return 'failed';
  const status = (data.status ?? '').toLowerCase();
  if (['past_due', 'paused'].includes(status)) return 'attention';
  if (['failed', 'rejected', 'cancelled', 'canceled', 'expired', 'refunded', 'charged_back'].includes(status))
    return 'failed';
  return 'processing';
}
