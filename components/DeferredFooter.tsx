'use client';

import dynamic from 'next/dynamic';
import { useDeferredClientMount } from '@/components/performance/use-deferred-client-mount';

function FooterPlaceholder() {
  return (
    <div
      className="mt-8 min-h-[162px] border-t border-slate-200 bg-white sm:min-h-[84px]"
      aria-hidden="true"
    />
  );
}

const FooterLazy = dynamic(
  () => import('@/components/footer').then((module) => module.Footer),
  {
    ssr: false,
    loading: FooterPlaceholder,
  }
);

export function DeferredFooter() {
  const ready = useDeferredClientMount(4500, 5500);

  if (!ready) {
    return <FooterPlaceholder />;
  }

  return <FooterLazy />;
}
