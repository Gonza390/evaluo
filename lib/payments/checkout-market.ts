/**
 * Every checkout and pricing screen uses the request country provided by Vercel.
 * Never derive currency from language, or default an unknown location to Argentina.
 * Si el país no se puede confirmar (sin cabecera o con un valor inválido), se ofrece
 * Premium internacional en USD: pesos y Mercado Pago quedan solo para AR verificado.
 * Production and Preview must show the same regional currency for the same country.
 */
export type CheckoutMarket = 'argentina' | 'international' | 'unknown';

export function resolveCheckoutMarket(
  country: string | null | undefined,
  _vercelEnvironment: string | null | undefined
): CheckoutMarket {
  const normalized = country?.trim().toUpperCase() ?? '';
  // Sin un país verificable (vacío, inválido o marcadores como XX/ZZ/EU/UN) → USD.
  return normalized === 'AR' ? 'argentina' : 'international';
}
