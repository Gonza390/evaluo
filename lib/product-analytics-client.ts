'use client';

import {
  getAnalyticsDeviceType,
  getAnalyticsSessionKey,
} from '@/lib/analytics-client';
import { getAttributionSnapshot } from '@/lib/attribution';

type ProductAnalyticsEventName =
  | 'acquisition_touch'
  | 'content_available'
  | 'content_empty'
  | 'study_content_opened'
  | 'meaningful_study_completed'
  | 'pdf_file_selected'
  | 'pdf_upload_completed'
  | 'pdf_nudge_viewed'
  | 'pdf_nudge_clicked'
  | 'pdf_limit_reached'
  | 'pdf_limit_upgrade_clicked'
  | 'reminder_clicked';

type ProductAnalyticsMetadata = Record<
  string,
  string | number | boolean | null | undefined
>;

export async function trackProductAnalyticsEvent(
  eventName: ProductAnalyticsEventName,
  metadata: ProductAnalyticsMetadata = {}
) {
  if (typeof window === 'undefined') return;

  const referrer = document.referrer?.trim() || null;

  try {
    await fetch('/api/analytics/product-track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_name: eventName,
        session_key: getAnalyticsSessionKey(),
        path: window.location.pathname,
        device_type: getAnalyticsDeviceType(),
        metadata: {
          attribution: getAttributionSnapshot(),
          referrer,
          landing_path: `${window.location.pathname}${window.location.search}`,
          ...metadata,
        },
      }),
      keepalive: true,
    });
  } catch {
    // Product analytics must never block the study experience.
  }
}
