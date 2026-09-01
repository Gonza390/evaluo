'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { FileUp, Sparkles, X } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase-client';
import { trackMarketingEvent } from '@/lib/marketing-analytics';
import { trackProductAnalyticsEvent } from '@/lib/product-analytics-client';

const UUID_AT_END = /([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i;
const MATERIA_NUDGE_SESSION_KEY = 'evaluo:pdf-materia-nudge-shown-v1';
const MATERIA_IDLE_DELAY_MS = 8_000;

function getMateriaIdFromPath(pathname: string) {
  if (!pathname.startsWith('/explorar/materia/')) return null;
  const segment = pathname.split('/').filter(Boolean).at(-1) ?? '';
  return segment.match(UUID_AT_END)?.[1] ?? null;
}

export function ContextualPdfNudge() {
  const pathname = usePathname();
  const idleTimerRef = useRef<number | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [materiaNudgeVisible, setMateriaNudgeVisible] = useState(false);
  const [hasUploadedMaterial, setHasUploadedMaterial] = useState<boolean | null>(null);

  const isDashboard = pathname === '/dashboard';
  const materiaId = useMemo(() => getMateriaIdFromPath(pathname), [pathname]);
  const isMateria = Boolean(materiaId);

  useEffect(() => {
    setDismissed(false);
    setMateriaNudgeVisible(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMateria || !materiaId || dismissed || materiaNudgeVisible) return undefined;

    try {
      if (window.sessionStorage.getItem(MATERIA_NUDGE_SESSION_KEY) === '1') {
        return undefined;
      }
    } catch {
      // If storage is unavailable, the idle timer still works for this page view.
    }

    const clearIdleTimer = () => {
      if (idleTimerRef.current !== null) {
        window.clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
    };

    const showNudge = () => {
      idleTimerRef.current = null;
      if (document.visibilityState !== 'visible' || !document.hasFocus()) {
        return;
      }

      try {
        window.sessionStorage.setItem(MATERIA_NUDGE_SESSION_KEY, '1');
      } catch {
        // Non-critical: the nudge can still be shown.
      }
      setMateriaNudgeVisible(true);
      void trackProductAnalyticsEvent('pdf_nudge_viewed', {
        materia_id: materiaId,
        idle_seconds: 8,
      });
    };

    const restartIdleTimer = () => {
      clearIdleTimer();
      if (document.visibilityState !== 'visible' || !document.hasFocus()) {
        return;
      }
      idleTimerRef.current = window.setTimeout(showNudge, MATERIA_IDLE_DELAY_MS);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') {
        clearIdleTimer();
        return;
      }
      restartIdleTimer();
    };

    const interactionEvents: Array<keyof WindowEventMap> = [
      'pointerdown',
      'pointermove',
      'keydown',
      'scroll',
      'wheel',
      'touchstart',
      'touchmove',
    ];

    restartIdleTimer();
    interactionEvents.forEach((eventName) => {
      window.addEventListener(eventName, restartIdleTimer, { passive: true });
    });
    window.addEventListener('focus', restartIdleTimer);
    window.addEventListener('blur', clearIdleTimer);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearIdleTimer();
      interactionEvents.forEach((eventName) => {
        window.removeEventListener(eventName, restartIdleTimer);
      });
      window.removeEventListener('focus', restartIdleTimer);
      window.removeEventListener('blur', clearIdleTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [dismissed, isMateria, materiaId, materiaNudgeVisible]);

  useEffect(() => {
    if (!isDashboard) {
      setHasUploadedMaterial(null);
      return;
    }

    let active = true;

    async function checkUploads() {
      try {
        const supabase = getSupabaseBrowserClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!active) return;
        if (!user) {
          setHasUploadedMaterial(true);
          return;
        }

        const { count, error } = await supabase
          .from('student_materials')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id);

        if (!active) return;
        if (error) {
          setHasUploadedMaterial(true);
          return;
        }
        setHasUploadedMaterial((count ?? 0) > 0);
      } catch {
        if (active) setHasUploadedMaterial(true);
      }
    }

    void checkUploads();
    return () => {
      active = false;
    };
  }, [isDashboard]);

  if (dismissed || (!isDashboard && !isMateria)) return null;
  if (isDashboard && hasUploadedMaterial !== false) return null;
  if (isMateria && !materiaNudgeVisible) return null;

  const href =
    isMateria && materiaId
      ? `/dashboard/materiales/subir?materiaId=${encodeURIComponent(materiaId)}&source=materia`
      : '/dashboard/materiales/subir?source=dashboard';

  const onCtaClick = () => {
    trackMarketingEvent('cta_click', {
      location: isMateria ? 'materia_pdf_activation' : 'dashboard_pdf_activation',
      cta_name: isMateria ? 'subir_mi_pdf' : 'subir_mi_primer_pdf',
      destination: href,
      materia_id: materiaId ?? undefined,
    });

    if (isMateria) {
      void trackProductAnalyticsEvent('pdf_nudge_clicked', {
        materia_id: materiaId,
        destination: href,
        idle_seconds: 8,
      });
    }
  };

  return (
    <>
      {isMateria ? (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-slate-950/25 backdrop-blur-[3px]"
        />
      ) : null}

      <aside
        role={isMateria ? 'dialog' : undefined}
        aria-modal={isMateria ? true : undefined}
        aria-label="Preparar material propio"
        className={`fixed max-w-md border bg-white shadow-[0_24px_80px_rgba(15,23,42,0.28)] ${
          isMateria
            ? 'top-1/2 left-1/2 z-50 w-[calc(100%-1.5rem)] -translate-x-1/2 -translate-y-1/2 rounded-[26px] border-white/80 p-5 sm:w-[440px] sm:p-6'
            : 'inset-x-3 bottom-3 z-40 mx-auto rounded-2xl border-indigo-100 bg-white/95 p-4 backdrop-blur sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-[390px]'
        }`}
      >
        <button
          type="button"
          aria-label="Cerrar sugerencia"
          onClick={() => setDismissed(true)}
          className="absolute top-3 right-3 inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="h-4 w-4" />
        </button>

        {isMateria ? (
          <>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5 text-[11px] font-bold tracking-[0.02em] text-indigo-700">
              <Sparkles className="h-3.5 w-3.5" />
              Estudiá con tu propio material
            </div>

            <div className="mt-4 flex items-start gap-3.5 pr-8">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-[0_10px_25px_rgba(79,70,229,0.24)]">
                <FileUp className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h2 className="text-[20px] font-bold leading-6 tracking-[-0.035em] text-slate-950 sm:text-[22px]">
                  Convertí tu PDF en una guía para el parcial
                </h2>
                <p className="mt-2 text-[13px] leading-5.5 text-slate-600">
                  Evaluo toma el apunte que ya usás y lo transforma en herramientas listas para estudiar, todo en un mismo lugar.
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              {['Resumen claro', 'Conceptos clave', 'Flashcards', 'Ejercicios'].map((benefit) => (
                <div
                  key={benefit}
                  className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-center text-[12px] font-semibold text-slate-700"
                >
                  {benefit}
                </div>
              ))}
            </div>

            <Link
              href={href}
              onClick={onCtaClick}
              className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white shadow-[0_10px_24px_rgba(79,70,229,0.22)] transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              Crear mi guía de estudio
            </Link>
            <p className="mt-2.5 text-center text-[11px] leading-4 text-slate-400">
              Usá el PDF que ya tenés para estudiar esta materia.
            </p>
          </>
        ) : (
          <>
            <div className="flex items-start gap-3 pr-8">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                <FileUp className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h2 className="text-[15px] font-bold tracking-[-0.02em] text-slate-950">
                  Estudiá con tus propios apuntes
                </h2>
                <p className="mt-1.5 text-[12px] leading-5 text-slate-600">
                  Subí el PDF que estás usando para el parcial y Evaluo lo transforma en herramientas de estudio.
                </p>
              </div>
            </div>

            <Link
              href={href}
              onClick={onCtaClick}
              className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              Subir mi primer PDF
            </Link>
          </>
        )}
      </aside>
    </>
  );
}
