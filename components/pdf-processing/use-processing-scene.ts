'use client';

import { useEffect, useState } from 'react';
import { processingScenes } from './pdf-processing-journey';

const READING_TIME_MS = 6500;

/** El reloj explica el producto; la finalización depende siempre del estado real del PDF. */
export function useProcessingScene(complete: boolean) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (complete) return;
    const startedAt = performance.now();
    const timer = window.setInterval(() => setElapsed(performance.now() - startedAt), 250);
    return () => window.clearInterval(timer);
  }, [complete]);
  return {
    scene: Math.min(processingScenes.length - 1, Math.floor(elapsed / READING_TIME_MS)),
    waitingForProcessing: !complete && elapsed >= READING_TIME_MS * processingScenes.length,
  };
}
