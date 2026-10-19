'use client';

import { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { DeferredMarketingAnalytics } from './DeferredMarketingAnalytics';

function GlobalAnalyticsInner() {
  const pathname = usePathname();
  const isMarketingRoute = pathname === '/' || pathname === '/login';

  return (
    <>
      <DeferredMarketingAnalytics includeThirdParty={isMarketingRoute} />
    </>
  );
}

export function GlobalAnalytics() {
  return (
    <Suspense fallback={null}>
      <GlobalAnalyticsInner />
    </Suspense>
  );
}
