'use client';

import { useEffect } from 'react';
import { trackMarketingEvent } from '@/lib/marketing-analytics';

const HOME_VIEWED_KEY = 'evaluo:home_viewed';

export function HomeFunnelTracker() {
  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(HOME_VIEWED_KEY) === '1') return;
      window.sessionStorage.setItem(HOME_VIEWED_KEY, '1');
    } catch {
      // Si sessionStorage no está disponible, registramos igualmente la vista.
    }

    trackMarketingEvent('home_viewed');
  }, []);

  return null;
}
