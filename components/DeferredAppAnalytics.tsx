'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const GoogleAnalytics = dynamic(
  () => import('@/components/GoogleAnalytics').then((module) => module.GoogleAnalytics),
  { ssr: false }
);
const AnalyticsTracker = dynamic(() => import('@/components/AnalyticsTracker'), { ssr: false });

function scheduleAnalyticsStart(start: () => void) {
  let started = false;
  let timeoutId: ReturnType<typeof globalThis.setTimeout> | null = null;

  const run = () => {
    if (started) return;
    started = true;
    start();
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      run();
    }
  };

  if ('requestIdleCallback' in window) {
    const idleCallback = (window as Window & {
      requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
    }).requestIdleCallback;

    idleCallback?.(() => run(), { timeout: 2500 });
  } else {
    timeoutId = globalThis.setTimeout(run, 1800);
  }

  window.addEventListener('pointerdown', run, { once: true, passive: true });
  window.addEventListener('keydown', run, { once: true });
  window.addEventListener('scroll', run, { once: true, passive: true });
  document.addEventListener('visibilitychange', handleVisibilityChange);

  return () => {
    if (timeoutId) {
      globalThis.clearTimeout(timeoutId);
    }

    window.removeEventListener('pointerdown', run);
    window.removeEventListener('keydown', run);
    window.removeEventListener('scroll', run);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}

export function DeferredAppAnalytics() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (enabled || typeof window === 'undefined') {
      return;
    }

    return scheduleAnalyticsStart(() => setEnabled(true));
  }, [enabled]);

  if (!enabled) {
    return null;
  }

  return (
    <>
      <GoogleAnalytics />
      <AnalyticsTracker />
    </>
  );
}
