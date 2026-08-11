'use client';

import Script from 'next/script';

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;
const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID;

export function ThirdPartyAnalytics() {
  return (
    <>
      {GTM_ID ? (
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
