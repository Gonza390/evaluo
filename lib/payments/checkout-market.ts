/**
 * Every checkout and pricing screen uses the request country provided by Vercel.
 * Never derive currency from language, or default an unknown location to Argentina.
 * Production and Preview must show the same regional currency for the same country.
 */
export type CheckoutMarket = 'argentina' | 'international' | 'unknown';

export function resolveCheckoutMarket(
  country: string | null | undefined,
  _vercelEnvironment: string | null | undefined
): CheckoutMarket {
  const normalized = country?.trim().toUpperCase() ?? '';
  if (!/^[A-Z]{2}$/.test(normalized)) return 'unknown';
  return normalized === 'AR' ? 'argentina' : 'international';
}
