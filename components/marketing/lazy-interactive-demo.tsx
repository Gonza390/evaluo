'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';

const InteractiveDemo = dynamic(
  () => import('./interactive-demo').then((module) => module.InteractiveDemo),
  {
    ssr: false,
    loading: () => (
      <div className="surface-panel min-h-[420px] animate-pulse bg-white/80" aria-hidden="true" />
    ),
  }
);

export function LazyInteractiveDemo() {
  const [shouldRender, setShouldRender] = useState(false);
  const markerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (shouldRender || typeof window === 'undefined') {
      return;
    }

    const node = markerRef.current;
    if (!node) {
      setShouldRender(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((entry) => entry.isIntersecting);
        if (!visible) return;
        setShouldRender(true);
        observer.disconnect();
      },
      {
        rootMargin: '320px 0px',
      }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [shouldRender]);

  return (
    <div ref={markerRef}>
      {shouldRender ? (
        <InteractiveDemo />
      ) : (
        <div className="surface-panel min-h-[420px] animate-pulse bg-white/80" aria-hidden="true" />
      )}
    </div>
  );
}
