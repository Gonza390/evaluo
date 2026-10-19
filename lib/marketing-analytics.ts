'use client';

import { getAnalyticsPageType, trackClientAnalyticsEvent } from '@/lib/analytics-client';
import { getAttributionSnapshot } from '@/lib/attribution';
import { isAllowedAnalyticsEventName } from '@/lib/analytics-events';

type MarketingPayload = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

export function trackMarketingEvent(
  event: string,
  payload: MarketingPayload = {},
  userId?: string | null
) {
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

  if (!isAllowedAnalyticsEventName(event)) {
    return;
  }

  void trackClientAnalyticsEvent({
    eventName: event,
    path: pathname,
    userId: userId ?? null,
    metadata: {
      page_type: pageType,
      ...payload,
    },
  }).catch(() => undefined);
}

export function trackSimulatorMarketingEvent(
  event: 'simulator_started' | 'simulator_finished',
  payload: MarketingPayload = {}
) {
  trackMarketingEvent(event, payload);
}
