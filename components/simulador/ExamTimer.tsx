'use client';

import { useEffect, useRef, useState } from 'react';

/** Formats a number of seconds into HH:MM:SS. */
export function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

interface ExamTimerProps {
  /** Total exam duration in seconds (passed through for interface completeness). */
  durationSeconds: number;
  /** The starting time-left value used to initialise the internal countdown. */
  initialTimeLeft: number;
  /** When true the interval ticks every second; when false the timer is paused. */
  running: boolean;
  /** Called every second with the new timeLeft so the parent can keep a copy. */
  onTick: (timeLeft: number) => void;
  /** Called once when the countdown reaches zero. */
  onExpire: () => void;
}

/**
 * Self-contained countdown timer.
 *
 * - Owns its own `timeLeft` state (initialised from `initialTimeLeft`).
 * - Runs a `setInterval` while `running` is true.
 * - Reports every tick to the parent via `onTick` so the parent can maintain a
 *   display / persistence copy without owning the interval.
 * - Calls `onExpire` exactly once when the countdown hits zero.
 * - To reset the timer the parent should change the React `key` on this
 *   component, which remounts it with a fresh `initialTimeLeft`.
 */
export function ExamTimer({
  durationSeconds,
  initialTimeLeft,
  running,
  onTick,
  onExpire,
}: ExamTimerProps) {
  const [timeLeft, setTimeLeft] = useState(initialTimeLeft);
  const onTickRef = useRef(onTick);
  const onExpireRef = useRef(onExpire);
  const timeLeftRef = useRef(timeLeft);

  useEffect(() => {
    onTickRef.current = onTick;
  }, [onTick]);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  useEffect(() => {
    if (!running) return;

    const timer = setInterval(() => {
      const next = timeLeftRef.current - 1;

      if (next <= 0) {
        setTimeLeft(0);
        onTickRef.current(0);
        onExpireRef.current();
        return;
      }

      setTimeLeft(next);
      onTickRef.current(next);
    }, 1000);

    return () => clearInterval(timer);
  }, [running]);

  // Suppress unused-prop lint — durationSeconds is part of the public interface.
  void durationSeconds;

  return null;
}
