'use client';

import { useEffect } from 'react';
import { trackMarketingEvent } from '@/lib/marketing-analytics';
import type { AnalyticsEventName } from '@/lib/analytics-events';

type PageViewTrackerProps = {
  eventName: AnalyticsEventName;
  payload?: Record<string, string | number | boolean | null | undefined>;
};

export function MarketingPageViewTracker({ eventName, payload }: PageViewTrackerProps) {
  useEffect(() => {
    trackMarketingEvent(eventName, payload);
  }, [eventName, payload]);

  return null;
}
