'use client';

import { useCallback, useEffect, useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

const SHELL_ID = 'evaluo-simulator-shell';

type LegacyFullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

type LegacyFullscreenDocument = Document & {
  webkitExitFullscreen?: () => Promise<void> | void;
  webkitFullscreenElement?: Element | null;
};

function getFullscreenElement() {
  if (typeof document === 'undefined') return null;
  const legacyDocument = document as LegacyFullscreenDocument;
  return document.fullscreenElement ?? legacyDocument.webkitFullscreenElement ?? null;
}

function setShellImmersive(enabled: boolean) {
  if (typeof document === 'undefined') return;
  const shell = document.getElementById(SHELL_ID);
  if (!shell) return;

  shell.dataset.examImmersive = enabled ? 'true' : 'false';
  document.documentElement.classList.toggle('evaluo-exam-scroll-lock', enabled);
}

export function ExamFocusControls() {
  const [immersive, setImmersive] = useState(false);
  const [nativeFullscreen, setNativeFullscreen] = useState(false);

  const syncFullscreenState = useCallback(() => {
    const active = Boolean(getFullscreenElement());
    setNativeFullscreen(active);

    if (!active) {
      setImmersive(false);
      setShellImmersive(false);
    }
  }, []);

  useEffect(() => {
    setShellImmersive(false);

    document.addEventListener('fullscreenchange', syncFullscreenState);
    document.addEventListener('webkitfullscreenchange', syncFullscreenState as EventListener);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || !immersive || getFullscreenElement()) return;
      setImmersive(false);
      setShellImmersive(false);
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', syncFullscreenState);
      document.removeEventListener('webkitfullscreenchange', syncFullscreenState as EventListener);
      document.removeEventListener('keydown', handleKeyDown);
      setShellImmersive(false);
    };
  }, [immersive, syncFullscreenState]);

  const leaveImmersive = useCallback(async () => {
    const legacyDocument = document as LegacyFullscreenDocument;

    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (legacyDocument.webkitFullscreenElement && legacyDocument.webkitExitFullscreen) {
        await legacyDocument.webkitExitFullscreen();
      }
    } catch {
      // El fallback CSS sigue pudiendo cerrarse aunque el navegador rechace la API nativa.
    }

    setNativeFullscreen(false);
    setImmersive(false);
    setShellImmersive(false);
  }, []);

  const enterImmersive = useCallback(async () => {
    const shell = document.getElementById(SHELL_ID) as LegacyFullscreenElement | null;
    if (!shell) return;

    // Activamos primero el modo foco. En navegadores sin Fullscreen API (por ejemplo,
    // algunas versiones de Safari/iOS) esta capa fija funciona como fallback real.
    setImmersive(true);
    setShellImmersive(true);

    try {
      if (shell.requestFullscreen) {
        await shell.requestFullscreen({ navigationUI: 'hide' });
        setNativeFullscreen(true);
      } else if (shell.webkitRequestFullscreen) {
        await shell.webkitRequestFullscreen();
        setNativeFullscreen(true);
      }
    } catch {
      setNativeFullscreen(false);
    }
  }, []);

  const toggleImmersive = useCallback(() => {
    if (immersive) {
      void leaveImmersive();
      return;
    }

    void enterImmersive();
  }, [enterImmersive, immersive, leaveImmersive]);

  return (
    <button
      type="button"
      onClick={toggleImmersive}
      aria-pressed={immersive}
      aria-label={immersive ? 'Salir de pantalla completa' : 'Abrir modo examen en pantalla completa'}
      className="fixed top-[4.25rem] right-3 z-[120] inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3 text-xs font-semibold text-white shadow-[0_12px_30px_rgba(15,23,42,0.22)] transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:outline-none sm:right-4 lg:top-[5.75rem] lg:h-11 lg:px-4 lg:text-sm"
    >
      {immersive ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
      <span className="hidden sm:inline">
        {immersive
          ? nativeFullscreen
            ? 'Salir de pantalla completa'
            : 'Salir del modo examen'
          : 'Pantalla completa'}
      </span>
    </button>
  );
}
