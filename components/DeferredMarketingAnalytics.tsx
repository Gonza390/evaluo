'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const GoogleAnalytics = dynamic(
  () => import('@/components/GoogleAnalytics').then((module) => module.GoogleAnalytics),
  { ssr: false }
);
const ThirdPartyAnalytics = dynamic(
  () => import('@/components/ThirdPartyAnalytics').then((module) => module.ThirdPartyAnalytics),
  { ssr: false }
);

export function DeferredMarketingAnalytics({
  includeThirdParty = false,
}: {
  includeThirdParty?: boolean;
}) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (enabled || typeof window === 'undefined') {
      return;
    }

    const enable = () => setEnabled(true);
    const schedule = (): (() => void) => {
      if ('requestIdleCallback' in window) {
        const idleId = window.requestIdleCallback(() => enable(), { timeout: 2500 });
        return () => window.cancelIdleCallback(idleId);
      }

      const timeoutId = globalThis.setTimeout(enable, 1800);
      return () => {
        globalThis.clearTimeout(timeoutId);
      };
    };

    const cancelScheduled = schedule();
    const onFirstInteraction = () => enable();

    window.addEventListener('pointerdown', onFirstInteraction, { once: true, passive: true });
    window.addEventListener('keydown', onFirstInteraction, { once: true });
    window.addEventListener('scroll', onFirstInteraction, { once: true, passive: true });

    return () => {
      cancelScheduled();
      window.removeEventListener('pointerdown', onFirstInteraction);
      window.removeEventListener('keydown', onFirstInteraction);
      window.removeEventListener('scroll', onFirstInteraction);
    };
  }, [enabled]);

  if (!enabled) {
    return null;
  }

  return (
    <>
      <GoogleAnalytics />
      {includeThirdParty ? <ThirdPartyAnalytics /> : null}
    </>
  );
}
