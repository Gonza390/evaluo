import { NextResponse } from 'next/server';
import { isCreemModeEnabled } from '@/lib/payments/creem-international';
import { resolveCheckoutMarket } from '@/lib/payments/checkout-market';

export const runtime = 'nodejs';
export async function GET(request: Request) {
  const mode = process.env.VERCEL_ENV === 'production' ? 'live' : 'test';
  const country = request.headers.get('x-vercel-ip-country')?.trim().toUpperCase() || null;
  const market = resolveCheckoutMarket(country, process.env.VERCEL_ENV);
  return NextResponse.json({
    country, market,
    provider: market === 'unknown' ? null : market === 'international' ? 'creem' : 'mercadopago',
    mode,
    creemAvailable: mode === 'live' && isCreemModeEnabled('live'),
    previewTestAvailable: mode === 'test' && isCreemModeEnabled('test'),
    monthlyUsdCents: 999,
  }, { headers: { 'Cache-Control': 'private, no-store' } });
}
