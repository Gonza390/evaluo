'use client';

import { useEffect } from 'react';
import { trackMarketingEvent } from '@/lib/marketing-analytics';

type PageViewTrackerProps = {
  eventName: string;
  payload?: Record<string, string | number | boolean | null | undefined>;
};

export function MarketingPageViewTracker({ eventName, payload }: PageViewTrackerProps) {
  useEffect(() => {
    trackMarketingEvent(eventName, payload);
  }, [eventName, payload]);

  return null;
}
