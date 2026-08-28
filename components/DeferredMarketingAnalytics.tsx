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

function scheduleAfterLoad(callback: () => void, delayMs: number) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const schedule = () => {
    timeoutId = globalThis.setTimeout(callback, delayMs);
  };

  if (document.readyState === 'complete') {
    schedule();
  } else {
    window.addEventListener('load', schedule, { once: true });
  }

  return () => {
    window.removeEventListener('load', schedule);
    if (timeoutId !== null) globalThis.clearTimeout(timeoutId);
  };
}

export function DeferredMarketingAnalytics({
  includeThirdParty = false,
}: {
  includeThirdParty?: boolean;
}) {
  const [coreEnabled, setCoreEnabled] = useState(false);
  const [thirdPartyEnabled, setThirdPartyEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const enableCore = () => setCoreEnabled(true);
    const enableThirdParty = () => {
      setCoreEnabled(true);
      if (includeThirdParty) setThirdPartyEnabled(true);
    };

    // Preserve acquisition analytics without competing with the initial render.
    const cancelCoreFallback = scheduleAfterLoad(enableCore, 3500);
    // Clarity/GTM are lower priority and stay out of the critical rendering window.
    const cancelThirdPartyFallback = includeThirdParty
      ? scheduleAfterLoad(() => setThirdPartyEnabled(true), 10_000)
      : () => undefined;

    const onFirstInteraction = () => enableThirdParty();
    window.addEventListener('pointerdown', onFirstInteraction, { once: true, passive: true });
    window.addEventListener('keydown', onFirstInteraction, { once: true });

    return () => {
      cancelCoreFallback();
      cancelThirdPartyFallback();
      window.removeEventListener('pointerdown', onFirstInteraction);
      window.removeEventListener('keydown', onFirstInteraction);
    };
  }, [includeThirdParty]);

  if (!coreEnabled && !thirdPartyEnabled) return null;

  return (
    <>
      {coreEnabled ? <GoogleAnalytics /> : null}
      {includeThirdParty && thirdPartyEnabled ? <ThirdPartyAnalytics /> : null}
    </>
  );
}
