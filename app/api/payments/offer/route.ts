import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase-admin';
import {
  PREMIUM_MONTHLY_PRICE_ARS,
  PREMIUM_MONTHLY_REFERENCE_PRICE_ARS,
  PREMIUM_SEMESTER_LIMIT,
  PREMIUM_SEMESTER_PRICE_ARS,
  semesterEquivalentMonthlyPrice,
  semesterSavingsPercent,
} from '@/lib/payments/offers';

export async function GET() {
  try {
    const admin = createAdminClient() as unknown as SupabaseClient;
    const pendingCutoff = new Date(Date.now() - 30 * 60_000).toISOString();

    const [planResult, soldResult, reservedResult] = await Promise.all([
      admin
        .from('subscription_plans')
        .select('price_ars')
        .eq('code', 'premium')
        .eq('is_active', true)
        .single(),
      admin
        .from('payment_checkout_attempts')
        .select('id', { count: 'exact', head: true })
        .eq('amount_ars', PREMIUM_SEMESTER_PRICE_ARS)
        .eq('status', 'approved'),
      admin
        .from('payment_checkout_attempts')
        .select('id', { count: 'exact', head: true })
        .eq('amount_ars', PREMIUM_SEMESTER_PRICE_ARS)
        .in('status', ['created', 'pending'])
        .gte('updated_at', pendingCutoff),
    ]);

    if (planResult.error || soldResult.error || reservedResult.error || !planResult.data) {
      throw planResult.error ?? soldResult.error ?? reservedResult.error ?? new Error('plan_unavailable');
    }

    const configuredMonthlyPrice = Number(planResult.data.price_ars);
    const monthlyPriceArs =
      Number.isFinite(configuredMonthlyPrice) && configuredMonthlyPrice > 0
        ? configuredMonthlyPrice
        : PREMIUM_MONTHLY_PRICE_ARS;
    const semesterSold = soldResult.count ?? 0;
    const semesterReserved = reservedResult.count ?? 0;
    const semesterRemaining = Math.max(
      0,
      PREMIUM_SEMESTER_LIMIT - semesterSold - semesterReserved
    );

    return NextResponse.json(
      {
        monthlyPriceArs,
        monthlyReferencePriceArs: PREMIUM_MONTHLY_REFERENCE_PRICE_ARS,
        semesterPriceArs: PREMIUM_SEMESTER_PRICE_ARS,
        semesterEquivalentMonthlyArs: semesterEquivalentMonthlyPrice(),
        semesterSavingsPercent: semesterSavingsPercent(monthlyPriceArs),
        semesterLimit: PREMIUM_SEMESTER_LIMIT,
        semesterSold,
        semesterReserved,
        semesterRemaining,
        semesterAvailable: semesterRemaining > 0,
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
        monthlyPriceArs: PREMIUM_MONTHLY_PRICE_ARS,
        monthlyReferencePriceArs: PREMIUM_MONTHLY_REFERENCE_PRICE_ARS,
        semesterPriceArs: PREMIUM_SEMESTER_PRICE_ARS,
        semesterEquivalentMonthlyArs: semesterEquivalentMonthlyPrice(),
        semesterSavingsPercent: semesterSavingsPercent(),
        semesterLimit: PREMIUM_SEMESTER_LIMIT,
        semesterSold: 0,
        semesterReserved: 0,
        semesterRemaining: null,
        semesterAvailable: false,
      },
      {
        headers: {
          'Cache-Control': 'private, no-store',
        },
      }
    );
  }
}
