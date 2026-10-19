/**
 * Future checkout routing policy. Not wired into /api/payments/checkout.
 *
 * Critical: routing never activates Paddle on its own. An approved account,
 * a deliberate feature flag, and a separately verified checkout + webhook
 * integration are all required before this policy can be used in production.
 */
export type PaymentProvider = 'mercadopago' | 'paddle';

export type PaymentRouteDecision = {
  provider: PaymentProvider | null;
  reason: 'argentina_local' | 'paddle_ready' | 'international_disabled' | 'invalid_country';
};

export function resolvePaymentProvider(input: {
  buyerCountry: unknown;
  paddleAccountApproved?: boolean;
  internationalCheckoutEnabled?: boolean;
}): PaymentRouteDecision {
  const country = typeof input.buyerCountry === 'string'
    ? input.buyerCountry.trim().toUpperCase()
    : '';

  if (!/^[A-Z]{2}$/.test(country)) {
    return { provider: null, reason: 'invalid_country' };
  }

  if (country === 'AR') {
    return { provider: 'mercadopago', reason: 'argentina_local' };
  }

  if (input.paddleAccountApproved === true && input.internationalCheckoutEnabled === true) {
    return { provider: 'paddle', reason: 'paddle_ready' };
  }

  // Fail closed until Paddle explicitly approves Evaluo's business model
  // and the full payment lifecycle has passed sandbox tests.
  return { provider: null, reason: 'international_disabled' };
}
