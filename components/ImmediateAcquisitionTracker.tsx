'use client';

import { useEffect } from 'react';
import {
  getAnalyticsDeviceType,
  getAnalyticsPageType,
  getAnalyticsSessionKey,
} from '@/lib/analytics-client';
import { captureAttributionFromLocation, getAttributionSnapshot } from '@/lib/attribution';

export function ImmediateAcquisitionTracker() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let sessionKey: string;
    try {
      sessionKey = getAnalyticsSessionKey();
    } catch {
      return;
    }

    const acquisitionKey = `evaluo_acquisition_touch:${sessionKey}`;
    try {
      if (window.sessionStorage.getItem(acquisitionKey)) return;
      window.sessionStorage.setItem(acquisitionKey, '1');
    } catch {
      // Si sessionStorage no está disponible, igual intentamos registrar la entrada.
    }

    captureAttributionFromLocation(
      window.location.search,
      window.location.pathname,
      document.referrer || null
    );

    const attribution = getAttributionSnapshot();
    const referrer = document.referrer?.trim() || null;
    const landingPath = `${window.location.pathname}${window.location.search}`;

    void fetch('/api/analytics/product-track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_name: 'acquisition_touch',
        session_key: sessionKey,
        path: window.location.pathname,
        device_type: getAnalyticsDeviceType(),
        metadata: {
          attribution,
          referrer,
          landing_path: landingPath,
          entry_page_type: getAnalyticsPageType(window.location.pathname),
        },
      }),
      keepalive: true,
    }).catch(() => undefined);
  }, []);

  return null;
}
