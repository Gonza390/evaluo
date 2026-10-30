'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Refresh processing only while visible; check promptly after the student returns. */
export function StudentMaterialProcessingRefresh() {
  const router = useRouter();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let lastRefresh = Date.now();
    const refresh = () => {
      if (document.visibilityState !== 'visible') return;
      lastRefresh = Date.now();
      router.refresh();
    };
    const schedule = () => {
      if (timer) window.clearTimeout(timer);
      if (document.visibilityState !== 'visible') return;
      timer = window.setTimeout(() => {
        refresh();
        schedule();
      }, 12_000);
    };
    const onReturn = () => {
      if (document.visibilityState !== 'visible') {
        if (timer) window.clearTimeout(timer);
        timer = null;
        return;
      }
      if (Date.now() - lastRefresh >= 3_000) refresh();
      schedule();
    };
    document.addEventListener('visibilitychange', onReturn);
    window.addEventListener('focus', onReturn);
    schedule();
    return () => {
      if (timer) window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onReturn);
      window.removeEventListener('focus', onReturn);
    };
  }, [router]);

  return null;
}
