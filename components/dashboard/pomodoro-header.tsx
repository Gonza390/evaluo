'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { CheckCircle2, Clock3, Pause, Play, RotateCcw, X } from 'lucide-react';
import {
  INITIAL_POMODORO,
  beginPomodoro,
  finishedPomodoro,
  formatPomodoroTime,
  isPomodoroComplete,
  pausePomodoro,
  remainingPomodoroSeconds,
  restorePomodoro,
  type PomodoroState,
} from '@/lib/pomodoro-timer';

function readSavedTimer(key: string, now: number): PomodoroState {
  try {
    return restorePomodoro(window.localStorage.getItem(key), now);
  } catch {
    return INITIAL_POMODORO;
  }
}

/** Small non-modal 25-minute timer in Evaluo's persistent app header. */
export function PomodoroHeader({ userId }: { userId: string }) {
  const key = `evaluo_pomodoro_25_${userId}`;
  const popupId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [timer, setTimer] = useState<PomodoroState>(INITIAL_POMODORO);
  const [now, setNow] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState(false);

  // A deadline (not a decrementing counter) prevents drift when the tab is hidden.
  useEffect(() => {
    const current = Date.now();
    const saved = readSavedTimer(key, current);
    setTimer(saved);
    setNow(current);
    setHydrated(true);
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(timer));
    } catch { /* The timer keeps working even if browser storage is disabled. */ }
  }, [timer, key, hydrated]);

  useEffect(() => {
    if (!hydrated || timer.phase !== 'running') return;
    const tick = () => setNow(Date.now());
    tick();
    const interval = window.setInterval(tick, 500);
    document.addEventListener('visibilitychange', tick);
    window.addEventListener('focus', tick);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', tick);
      window.removeEventListener('focus', tick);
    };
  }, [hydrated, timer.phase]);

  useEffect(() => {
    if (!hydrated || !isPomodoroComplete(timer, now)) return;
    setTimer(finishedPomodoro());
    setNotice(true);
  }, [hydrated, now, timer]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(false), 8000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onEscape);
    };
  }, [open]);

  const seconds = remainingPomodoroSeconds(timer, now);
  const time = formatPomodoroTime(seconds);
  const running = timer.phase === 'running';
  const paused = timer.phase === 'paused';
  const finished = timer.phase === 'finished';

  function update(next: PomodoroState) {
    setTimer(next);
    setNow(Date.now());
    setNotice(false);
    try { window.localStorage.setItem(key, JSON.stringify(next)); } catch { /* Optional persistence. */ }
  }

  function handlePrimary() {
    const instant = Date.now();
    update(running ? pausePomodoro(timer, instant) : beginPomodoro(timer, instant));
  }

  return (
    <div data-pomodoro-header className="relative shrink-0" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen(value => !value)}
        aria-label={running || paused ? `Temporizador de estudio: ${time} restantes` : finished ? 'Temporizador: sesión completada' : 'Abrir temporizador de estudio de 25 minutos'}
        aria-expanded={open}
        aria-controls={popupId}
        className={`inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-2 text-[12px] font-semibold tabular-nums transition-colors hover:bg-[#EEF2FF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB] ${running || paused || open ? 'bg-[#EEF2FF] text-[#2563EB]' : finished ? 'text-[#16774f]' : 'text-[#42506A]'}`}
      >
        {finished ? <CheckCircle2 className="size-[19px]" aria-hidden="true" /> : <Clock3 className="size-[19px]" aria-hidden="true" />}
        {running || paused ? <span aria-hidden="true" className="min-w-[39px] text-right">{time}</span> : null}
        {finished ? <span className="hidden sm:inline">Listo</span> : null}
      </button>

      {open ? (
        <div
          id={popupId}
          role="dialog"
          aria-label="Temporizador de estudio"
          data-pomodoro-panel
          className="absolute right-[-112px] top-[calc(100%+8px)] z-50 w-[min(292px,calc(100vw-24px))] rounded-[18px] border border-[#E7EBF4] bg-white p-4 text-[#0F1B3D] shadow-[0_16px_48px_rgba(15,27,61,.14)] md:right-0"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-[14px] font-semibold">Tiempo de estudio</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar temporizador"
              className="flex size-8 shrink-0 items-center justify-center rounded-lg text-[#7F8AA3] hover:bg-[#F5F7FB] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]"
            >
              <X className="size-4" aria-hidden="true"/>
            </button>
          </div>

          <div className="py-5 text-center">
            <p className="text-[40px] font-semibold leading-none tracking-[-.045em] tabular-nums">{time}</p>
            <p className="mt-2 text-[12px] text-[#7F8AA3]">
              {finished ? '¡Completaste tus 25 minutos!' : 'Sesión de concentración'}
            </p>
          </div>

          <button
            type="button"
            onClick={handlePrimary}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[#1D4ED8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]"
          >
            {running ? <Pause className="size-4" aria-hidden="true"/> : <Play className="size-4" aria-hidden="true"/>}
            {running ? 'Pausar' : paused ? 'Reanudar' : finished ? 'Comenzar de nuevo' : 'Comenzar'}
          </button>

          {timer.phase !== 'idle' ? (
            <button
              type="button"
              onClick={() => update(INITIAL_POMODORO)}
              className="mt-2 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl text-[12px] font-medium text-[#66758D] transition-colors hover:bg-[#F5F7FB] hover:text-[#2563EB] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]"
            >
              <RotateCcw className="size-3.5" aria-hidden="true" /> Reiniciar
            </button>
          ) : null}
        </div>
      ) : null}

      {notice && !open ? (
        <div role="status" aria-live="polite" data-pomodoro-complete className="fixed right-3 top-[60px] z-[60] flex max-w-[calc(100vw-24px)] items-center gap-2 rounded-xl border border-[#D3EEDD] bg-white px-3 py-3 text-[12px] font-semibold text-[#16774f] shadow-[0_8px_32px_rgba(15,27,61,.12)] sm:right-6">
          <CheckCircle2 className="size-4 shrink-0" aria-hidden="true"/> ¡Completaste tus 25 minutos!
          <button type="button" aria-label="Cerrar aviso" onClick={() => setNotice(false)} className="ml-1 rounded p-1 hover:bg-[#F5F7FB]">
            <X className="size-3.5" aria-hidden="true"/>
          </button>
        </div>
      ) : null}
    </div>
  );
}
