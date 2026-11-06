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
// Public landing, FAQ and pricing cards can mount together. Reuse one response
// per browser navigation so they never momentarily disagree about the country.
let marketRequest: Promise<CheckoutAvailability> | null = null;

function loadCheckoutMarket(): Promise<CheckoutAvailability> {
  if (marketRequest) return marketRequest;
  marketRequest = fetch('/api/payments/creem/availability', { cache: 'no-store' })
    .then(async response => response.ok ? await response.json() as unknown : null)
    .then(payload => {
      if (!payload || typeof payload !== 'object') return UNAVAILABLE;
      const value = payload as Record<string, unknown>;
      if (value.market !== 'argentina' && value.market !== 'international' && value.market !== 'unknown') {
        return UNAVAILABLE;
      }
      return {
        market: value.market,
        creemAvailable: value.creemAvailable === true,
        previewTestAvailable: value.previewTestAvailable === true,
        monthlyUsdCents: value.monthlyUsdCents === 999 ? 999 : UNAVAILABLE.monthlyUsdCents,
      };
    })
    .catch(() => UNAVAILABLE);
  return marketRequest;
}

export function useCheckoutMarket(): CheckoutAvailability | null {
  const [availability, setAvailability] = useState<CheckoutAvailability | null>(null);
  useEffect(() => {
    let active = true;
    void loadCheckoutMarket().then(value => { if (active) setAvailability(value); });
    return () => { active = false; };
  }, []);
  return availability;
}
