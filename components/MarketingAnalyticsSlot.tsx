'use client';

import dynamic from 'next/dynamic';

const GlobalAnalytics = dynamic(
  () => import('@/components/GlobalAnalytics').then((module) => module.GlobalAnalytics),
  { ssr: false }
);

export function MarketingAnalyticsSlot() {
  return <GlobalAnalytics />;
}
