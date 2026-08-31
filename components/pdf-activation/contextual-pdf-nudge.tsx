'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { FileUp, X } from 'lucide-react';
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
      idleTimerRef.current = window.setTimeout(showNudge, MATERIA_IDLE_DELAY_MS);
    };

    const interactionEvents: Array<keyof WindowEventMap> = [
      'pointerdown',
      'keydown',
      'scroll',
      'touchstart',
      'touchmove',
    ];

    restartIdleTimer();
    interactionEvents.forEach((eventName) => {
      window.addEventListener(eventName, restartIdleTimer, { passive: true });
    });

    return () => {
      clearIdleTimer();
      interactionEvents.forEach((eventName) => {
        window.removeEventListener(eventName, restartIdleTimer);
      });
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
    <aside
      aria-label="Preparar material propio"
      className="fixed inset-x-3 bottom-3 z-40 mx-auto max-w-md rounded-2xl border border-indigo-100 bg-white/95 p-4 shadow-[0_18px_55px_rgba(15,23,42,0.18)] backdrop-blur sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-[390px]"
    >
      <button
        type="button"
        aria-label="Cerrar sugerencia"
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3 pr-8">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
          <FileUp className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-[15px] font-bold tracking-[-0.02em] text-slate-950">
            {isMateria ? '¿Tenés el PDF de esta materia?' : 'Estudiá con tus propios apuntes'}
          </h2>
          <p className="mt-1.5 text-[12px] leading-5 text-slate-600">
            {isMateria
              ? 'Subilo y Evaluo lo convierte en resumen, glosario, flashcards y ejercicios para estudiar.'
              : 'Subí el PDF que estás usando para el parcial y Evaluo lo transforma en herramientas de estudio.'}
          </p>
        </div>
      </div>

      <Link
        href={href}
        onClick={onCtaClick}
        className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
      >
        {isMateria ? 'Subir mi PDF' : 'Subir mi primer PDF'}
      </Link>
    </aside>
  );
}
