'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Releer el estado mientras el alumno ve la pantalla de procesamiento. */
export function StudentMaterialProcessingRefresh() {
  const router = useRouter();

  useEffect(() => {
    const interval = window.setInterval(() => {
      router.refresh();
    }, 25_000);

    return () => window.clearInterval(interval);
  }, [router]);

  return null;
}
