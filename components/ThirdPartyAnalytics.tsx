'use client';

import Script from 'next/script';

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID;

export function ThirdPartyAnalytics() {
  // When direct GA is configured, do not also load GTM by default. This prevents
  // duplicate GA initialization unless the project explicitly moves analytics to GTM.
  const shouldLoadGtm = Boolean(GTM_ID && !GA_MEASUREMENT_ID);

  return (
    <>
      {shouldLoadGtm && GTM_ID ? (
        <Script
          src={`/analytics/gtm-loader.js?id=${encodeURIComponent(GTM_ID)}`}
          strategy="lazyOnload"
        />
      ) : null}

      {CLARITY_ID ? (
        <Script
          src={`/analytics/clarity-loader.js?id=${encodeURIComponent(CLARITY_ID)}`}
          strategy="lazyOnload"
        />
      ) : null}
    </>
  );
}
