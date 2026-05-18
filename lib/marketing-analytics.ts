'use client';

type MarketingPayload = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

export function trackMarketingEvent(event: string, payload: MarketingPayload = {}) {
  if (typeof window === 'undefined') return;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event,
    app_name: 'Evaluo',
    ...payload,
  });
}

export function trackSimulatorMarketingEvent(
  event: 'simulator_started' | 'simulator_finished',
  payload: MarketingPayload = {}
) {
  trackMarketingEvent(event, payload);
}
