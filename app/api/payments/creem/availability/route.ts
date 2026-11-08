import { NextResponse } from 'next/server';
import { isCreemModeEnabled } from '@/lib/payments/creem-international';
import { resolveCheckoutMarket } from '@/lib/payments/checkout-market';
import { isCreemSupportedLocation } from '@/lib/payments/creem-countries';

export const runtime = 'nodejs';
export async function GET(request: Request) {
  const mode = process.env.VERCEL_ENV === 'production' ? 'live' : 'test';
  const country = request.headers.get('x-vercel-ip-country')?.trim().toUpperCase() || null;
  const market = resolveCheckoutMarket(country, process.env.VERCEL_ENV);
  const region = request.headers.get('x-vercel-ip-country-region');
  // Creem no cobra en algunos países (sanciones): ahí se ofrece "Avisame".
  const countrySupported = isCreemSupportedLocation(country, region);
  return NextResponse.json({
    country, market,
    provider: market === 'unknown' ? null : market === 'international' ? 'creem' : 'mercadopago',
    mode,
    creemAvailable: mode === 'live' && isCreemModeEnabled('live') && countrySupported,
    countrySupported,
    previewTestAvailable: mode === 'test' && isCreemModeEnabled('test'),
    monthlyUsdCents: 999,
  }, { headers: { 'Cache-Control': 'private, no-store' } });
}
