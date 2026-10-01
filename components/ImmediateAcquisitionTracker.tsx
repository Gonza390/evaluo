'use client';

import { useEffect } from 'react';
import {
  getAnalyticsDeviceType,
  getAnalyticsPageType,
  getAnalyticsSessionKey,
} from '@/lib/analytics-client';
import {
  captureAttributionFromLocation,
  detectAcquisitionSource,
  getAttributionSnapshot,
} from '@/lib/attribution';

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

    const referrer = document.referrer?.trim() || null;
    const sessionSource = detectAcquisitionSource(window.location.search, referrer);

    captureAttributionFromLocation(
      window.location.search,
      window.location.pathname,
      referrer
    );

    const attribution = getAttributionSnapshot();
    const landingPath = `${window.location.pathname}${window.location.search}`;

    const clearPendingAcquisition = () => {
      try {
        window.sessionStorage.removeItem(acquisitionKey);
      } catch {
        // Sin storage, el tracker diferido puede volver a intentar igualmente.
      }
    };

    void fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_name: 'acquisition_touch',
        session_key: sessionKey,
        path: window.location.pathname,
        device_type: getAnalyticsDeviceType(),
        metadata: {
          source: sessionSource,
          session_source: sessionSource,
          attribution,
          referrer,
          landing_path: landingPath,
          entry_page_type: getAnalyticsPageType(window.location.pathname),
          page_type: getAnalyticsPageType(window.location.pathname),
        },
      }),
      keepalive: true,
    })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as
          | { ok?: boolean }
          | null;

        if (!response.ok || payload?.ok === false) {
          clearPendingAcquisition();
        }
      })
      .catch(clearPendingAcquisition);
  }, []);

  return null;
}
