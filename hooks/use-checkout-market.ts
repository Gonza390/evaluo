'use client';

import { useEffect, useState } from 'react';

export type CheckoutMarket = 'argentina' | 'international' | 'unknown';
export type CheckoutAvailability = {
  market: CheckoutMarket;
  creemAvailable: boolean;
  previewTestAvailable: boolean;
  monthlyUsdCents: number;
};

const UNAVAILABLE: CheckoutAvailability = {
  market: 'unknown',
  creemAvailable: false,
  previewTestAvailable: false,
  monthlyUsdCents: 999,
};

/**
 * The API resolves country server-side using Vercel's request geolocation.
 * Never infer billing currency from language, browser timezone or IP client data.
 * While region is loading, consumers must not render an ARS or USD offer.
 */
export function useCheckoutMarket(): CheckoutAvailability | null {
  const [availability, setAvailability] = useState<CheckoutAvailability | null>(null);

  useEffect(() => {
    let active = true;
    void fetch('/api/payments/creem/availability', { cache: 'no-store' })
      .then(async response => response.ok ? await response.json() as unknown : null)
      .then(payload => {
        if (!active) return;
        if (!payload || typeof payload !== 'object') {
          setAvailability(UNAVAILABLE);
          return;
        }
        const value = payload as Record<string, unknown>;
        if (value.market !== 'argentina' && value.market !== 'international' && value.market !== 'unknown') {
          setAvailability(UNAVAILABLE);
          return;
        }
        setAvailability({
          market: value.market,
          creemAvailable: value.creemAvailable === true,
          previewTestAvailable: value.previewTestAvailable === true,
          monthlyUsdCents: value.monthlyUsdCents === 999 ? 999 : UNAVAILABLE.monthlyUsdCents,
        });
      })
      .catch(() => { if (active) setAvailability(UNAVAILABLE); });
    return () => { active = false; };
  }, []);

  return availability;
}
