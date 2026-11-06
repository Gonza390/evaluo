/**
 * Production checkouts require a verifiable Vercel country.
 * Never treat missing geo headers or request failures as "Argentina".
 * Preview keeps the existing Mercado Pago layout and separately exposes Creem test mode.
 */
export type CheckoutMarket = 'argentina' | 'international' | 'unknown';

export function resolveCheckoutMarket(
  country: string | null | undefined,
  vercelEnvironment: string | null | undefined
): CheckoutMarket {
  if (vercelEnvironment !== 'production') return 'argentina';
  const normalized = country?.trim().toUpperCase() ?? '';
  if (!/^[A-Z]{2}$/.test(normalized)) return 'unknown';
  return normalized === 'AR' ? 'argentina' : 'international';
}
