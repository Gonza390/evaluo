'use client';

import { getAnalyticsPageType, trackClientAnalyticsEvent } from '@/lib/analytics-client';
import { getAttributionSnapshot } from '@/lib/attribution';

type MarketingPayload = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

export function trackMarketingEvent(event: string, payload: MarketingPayload = {}) {
  if (typeof window === 'undefined') return;

  const attribution = getAttributionSnapshot();
  const pathname = window.location.pathname;
  const pageType = getAnalyticsPageType(pathname);
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event,
    app_name: 'Evaluo',
    page_type: pageType,
    ...attribution,
    ...payload,
  });

  void trackClientAnalyticsEvent({
    eventName: event,
    path: pathname,
    metadata: {
      page_type: pageType,
      ...payload,
    },
  });
}

export function trackSimulatorMarketingEvent(
  event: 'simulator_started' | 'simulator_finished',
  payload: MarketingPayload = {}
) {
  trackMarketingEvent(event, payload);
}
