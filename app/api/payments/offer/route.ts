import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase-admin';

const FOUNDERS_LIMIT = 100;
const FOUNDERS_PRICE_ARS = 9990;
const REGULAR_PRICE_FALLBACK_ARS = 12990;

export async function GET() {
  try {
    const admin = createAdminClient() as unknown as SupabaseClient;
    const pendingCutoff = new Date(Date.now() - 60 * 60_000).toISOString();

    const [planResult, activatedResult, pendingResult] = await Promise.all([
      admin
        .from('subscription_plans')
        .select('price_ars')
        .eq('code', 'premium')
        .eq('is_active', true)
        .single(),
      admin
        .from('payment_promotion_claims')
        .select('id', { count: 'exact', head: true })
        .eq('promotion_code', 'founders_2026')
        .eq('status', 'activated'),
      admin
        .from('payment_promotion_claims')
        .select('id', { count: 'exact', head: true })
        .eq('promotion_code', 'founders_2026')
        .eq('status', 'pending')
        .gte('reserved_at', pendingCutoff),
    ]);

    if (planResult.error || activatedResult.error || pendingResult.error || !planResult.data) {
      throw planResult.error ?? activatedResult.error ?? pendingResult.error ?? new Error('plan_unavailable');
    }

    const regularPriceArs = Number(planResult.data.price_ars);
    const occupiedFounderSpots = (activatedResult.count ?? 0) + (pendingResult.count ?? 0);

    return NextResponse.json(
      {
        founderAvailable: occupiedFounderSpots < FOUNDERS_LIMIT,
        founderPriceArs: FOUNDERS_PRICE_ARS,
        regularPriceArs:
          Number.isFinite(regularPriceArs) && regularPriceArs > 0
            ? regularPriceArs
            : REGULAR_PRICE_FALLBACK_ARS,
      },
      {
        headers: {
          'Cache-Control': 'private, no-store',
        },
      }
    );
  } catch {
    return NextResponse.json(
      {
        founderAvailable: false,
        founderPriceArs: null,
        regularPriceArs: REGULAR_PRICE_FALLBACK_ARS,
      },
      {
        headers: {
          'Cache-Control': 'private, no-store',
        },
      }
    );
  }
}
