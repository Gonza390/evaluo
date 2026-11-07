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

export function loadCheckoutMarket(): Promise<CheckoutAvailability> {
  if (marketRequest !== null) return marketRequest;
  const request = (async (): Promise<CheckoutAvailability> => {
    try {
      const response = await fetch('/api/payments/creem/availability', { cache: 'no-store' });
      if (!response.ok) return UNAVAILABLE;
      const raw: unknown = await response.json();
      if (!raw || typeof raw !== 'object') return UNAVAILABLE;
      const payload = raw as Record<string, unknown>;
      const { market } = payload;
      if (market !== 'argentina' && market !== 'international' && market !== 'unknown') {
        return UNAVAILABLE;
      }
      return {
        market,
        creemAvailable: payload.creemAvailable === true,
        previewTestAvailable: payload.previewTestAvailable === true,
        monthlyUsdCents: payload.monthlyUsdCents === 999 ? 999 : UNAVAILABLE.monthlyUsdCents,
      };
    } catch {
      return UNAVAILABLE;
    }
  })();
  marketRequest = request;
  return request;
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
