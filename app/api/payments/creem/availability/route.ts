import { NextResponse } from 'next/server';
import { isCreemModeEnabled } from '@/lib/payments/creem-international';

export const runtime = 'nodejs';
export async function GET(request: Request) {
  const mode = process.env.VERCEL_ENV === 'production' ? 'live' : 'test';
  const country = request.headers.get('x-vercel-ip-country')?.trim().toUpperCase() || null;
  const international = mode === 'live' && country !== null && country !== 'AR' && /^[A-Z]{2}$/.test(country);
  return NextResponse.json({
    country, market: international ? 'international' : 'argentina',
    provider: international ? 'creem' : 'mercadopago',
    mode,
    creemAvailable: isCreemModeEnabled(mode),
    previewTestAvailable: mode === 'test' && isCreemModeEnabled('test'),
    monthlyUsdCents: 999,
  }, { headers: { 'Cache-Control': 'private, no-store' } });
}
