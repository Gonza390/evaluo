'use client';

import { useEffect, useState } from 'react';

type IdleWindow = Window & {
  requestIdleCallback?: (
    callback: () => void,
    options?: { timeout?: number }
  ) => number;
  cancelIdleCallback?: (handle: number) => void;
};

/**
 * Deja que el HTML crítico pinte antes de montar UI secundaria con bastante JS.
 * El delay es corto en equipos rápidos y el timeout evita que la UI quede esperando.
 */
export function useDeferredClientMount(delayMs = 350, idleTimeoutMs = 1000) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let idleHandle: number | null = null;
    const browser = window as IdleWindow;

    const timer = window.setTimeout(() => {
      if (browser.requestIdleCallback) {
        idleHandle = browser.requestIdleCallback(() => setReady(true), {
          timeout: idleTimeoutMs,
        });
        return;
      }

      setReady(true);
    }, delayMs);

    return () => {
      window.clearTimeout(timer);
      if (idleHandle !== null) {
        browser.cancelIdleCallback?.(idleHandle);
      }
    };
  }, [delayMs, idleTimeoutMs]);

  return ready;
}
