'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';

const HomeLiveStudyDemo = dynamic(
  () => import('@/components/marketing/home-live-study-demo').then((module) => module.HomeLiveStudyDemo),
  { ssr: false }
);

function DemoPlaceholder() {
  return (
    <div
      className="min-h-[430px] overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_24px_64px_rgba(15,23,42,0.08)]"
      aria-hidden="true"
    >
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-6">
        <div className="h-4 w-28 rounded-full bg-slate-100" />
        <div className="hidden h-3 w-36 rounded-full bg-slate-100 sm:block" />
      </div>
      <div className="grid grid-cols-4 gap-3 border-b border-slate-200 bg-slate-50/50 px-4 py-3">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-3 rounded-full bg-slate-100" />
        ))}
      </div>
      <div className="px-5 py-7 sm:px-7">
        <div className="h-3 w-32 rounded-full bg-indigo-50" />
        <div className="mt-4 h-7 w-2/3 rounded-full bg-slate-100" />
        <div className="mt-3 h-4 w-full max-w-lg rounded-full bg-slate-100" />
        <div className="mt-8 space-y-4 border-t border-slate-100 pt-5">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="grid grid-cols-[28px_minmax(0,1fr)] gap-3">
              <div className="h-3 rounded-full bg-indigo-50" />
              <div className="space-y-2">
                <div className="h-3 w-32 rounded-full bg-slate-100" />
                <div className="h-3 w-full max-w-md rounded-full bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DeferredHomeLiveStudyDemo() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (enabled) return;

    const node = rootRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setEnabled(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setEnabled(true);
          observer.disconnect();
        }
      },
      { rootMargin: '500px 0px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled]);

  return <div ref={rootRef}>{enabled ? <HomeLiveStudyDemo /> : <DemoPlaceholder />}</div>;
}
