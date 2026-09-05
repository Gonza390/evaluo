'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, ChevronLeft, FileUp, X } from 'lucide-react';
import { trackMarketingEvent } from '@/lib/marketing-analytics';

const TOUR_SEEN_KEY = 'evaluo_demo_material_tour_seen_v1';
const SAFE_DESKTOP = 20;
const SAFE_MOBILE = 12;

const TOUR_STEPS = [
  {
    target: 'pdf-viewer',
    tab: 'Resumen',
    title: 'Este es el PDF original',
    body: 'Podés leerlo acá y volver a la fuente cuando quieras. Todo lo que Evaluo prepara parte de este documento.',
  },
  {
    target: 'active-panel',
    tab: 'Resumen',
    title: 'Empezá por el resumen',
    body: 'Evaluo organiza el material y destaca los puntos importantes para que puedas repasar sin releer todo desde cero.',
  },
  {
    target: 'active-panel',
    tab: 'Glosario',
    title: 'Revisá los conceptos clave',
    body: 'El glosario reúne términos y definiciones importantes detectados dentro del PDF para que no pierdas tiempo buscándolos.',
  },
  {
    target: 'active-panel',
    tab: 'Tarjetas',
    title: 'Memorizá con tarjetas',
    body: 'Convertí el contenido del documento en flashcards y comprobá qué conceptos ya recordás y cuáles necesitás repetir.',
  },
  {
    target: 'active-panel',
    tab: 'Examen',
    title: 'Ponete a prueba',
    body: 'Practicá con preguntas generadas a partir del mismo material y detectá qué temas necesitás reforzar antes del parcial.',
  },
  {
    target: null,
    tab: null,
    title: 'Ahora probalo con tu material',
    body: 'Este es sólo un ejemplo. Subí un PDF de tu materia y Evaluo puede prepararlo para que estudies, practiques y repases desde el mismo lugar.',
  },
] as const;

type Rect = {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
};

type Props = {
  enabled: boolean;
  force?: boolean;
  source?: string;
  uploadHref: string;
};

function clamp(value: number, min: number, max: number) {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}

function isVisible(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);
  return rect.width > 4 && rect.height > 4 && style.display !== 'none' && style.visibility !== 'hidden';
}

function findVisible<T extends HTMLElement>(selector: string) {
  return Array.from(document.querySelectorAll<T>(selector)).find(isVisible) ?? null;
}

function findButtonByText(text: string, selector = 'button') {
  return (
    Array.from(document.querySelectorAll<HTMLElement>(selector)).find(
      (element) => isVisible(element) && element.textContent?.trim().includes(text)
    ) ?? null
  );
}

function clickStudyTab(label: string) {
  findButtonByText(label, '[role="tab"]')?.click();
}

function ensurePdfVisible() {
  if (findVisible<HTMLElement>('[aria-label="Ocultar PDF"]')) return;
  findButtonByText('Mostrar PDF')?.click();
}

function hidePdf() {
  findVisible<HTMLButtonElement>('[aria-label="Ocultar PDF"]')?.click();
}

function findTourTarget(target: string) {
  if (target === 'pdf-viewer') {
    const hideButton = findVisible<HTMLButtonElement>('[aria-label="Ocultar PDF"]');
    if (hideButton?.parentElement && isVisible(hideButton.parentElement)) return hideButton.parentElement;

    const desktopViewer = findVisible<HTMLElement>('#study-viewer-panel');
    if (desktopViewer) return desktopViewer;
  }

  if (target === 'active-panel') {
    return findVisible<HTMLElement>('[role="tabpanel"][data-state="active"]');
  }

  return null;
}

export function DemoMaterialGuidedTourV2({
  enabled,
  force = false,
  source = 'demo_material',
  uploadHref,
}: Props) {
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [cardSize, setCardSize] = useState({ width: 360, height: 360 });
  const startedRef = useRef(false);
  const cardRef = useRef<HTMLElement>(null);
  const currentStep = TOUR_STEPS[stepIndex];

  const markSeen = useCallback(() => {
    try {
      window.localStorage.setItem(TOUR_SEEN_KEY, '1');
    } catch {
      // Best effort only.
    }
  }, []);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    let seen = false;
    try {
      seen = window.localStorage.getItem(TOUR_SEEN_KEY) === '1';
    } catch {
      seen = false;
    }

    if (!force && seen) return;
    setOpen(true);

    if (!startedRef.current) {
      startedRef.current = true;
      trackMarketingEvent('demo_material_tour_started', { source, forced: force });
    }
  }, [enabled, force, source]);

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        markSeen();
        setOpen(false);
        trackMarketingEvent('demo_material_tour_skipped', {
          source,
          step: stepIndex + 1,
          total_steps: TOUR_STEPS.length,
        });
      } else if (event.key === 'ArrowRight' && stepIndex < TOUR_STEPS.length - 1) {
        setStepIndex((current) => current + 1);
      } else if (event.key === 'ArrowLeft' && stepIndex > 0) {
        setStepIndex((current) => current - 1);
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [markSeen, open, source, stepIndex]);

  useEffect(() => {
    if (!open) return;

    let timer: number | undefined;
    if (currentStep.tab) {
      clickStudyTab(currentStep.tab);
      timer = window.setTimeout(() => {
        if (stepIndex === 0) ensurePdfVisible();
        else hidePdf();
      }, 60);
    }

    trackMarketingEvent('demo_material_tour_step_viewed', {
      source,
      step: stepIndex + 1,
      total_steps: TOUR_STEPS.length,
      target: currentStep.target ?? 'conversion',
    });

    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [currentStep.tab, currentStep.target, open, source, stepIndex]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    let timer: number | undefined;
    let attempts = 0;

    const measure = (shouldScroll: boolean) => {
      if (cancelled) return;

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      setViewport({ width: vw, height: vh });

      if (!currentStep.target) {
        setTargetRect(null);
        return;
      }

      const element = findTourTarget(currentStep.target);
      if (!element) {
        attempts += 1;
        if (attempts < 20) timer = window.setTimeout(() => measure(shouldScroll), 100);
        return;
      }

      if (shouldScroll) {
        const initial = element.getBoundingClientRect();
        if (initial.top < 80 || initial.bottom > vh - 80) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
          timer = window.setTimeout(() => measure(false), 380);
          return;
        }
      }

      const rect = element.getBoundingClientRect();
      const safe = vw < 768 ? SAFE_MOBILE : SAFE_DESKTOP;
      const padding = vw < 768 ? 4 : 6;
      const top = clamp(rect.top - padding, safe, Math.max(safe, vh - safe));
      const left = clamp(rect.left - padding, safe, Math.max(safe, vw - safe));
      const right = clamp(rect.right + padding, safe, Math.max(safe, vw - safe));
      const bottom = clamp(rect.bottom + padding, safe, Math.max(safe, vh - safe));

      setTargetRect({
        top,
        left,
        right: Math.max(left + 1, right),
        bottom: Math.max(top + 1, bottom),
        width: Math.max(1, right - left),
        height: Math.max(1, bottom - top),
      });
    };

    timer = window.setTimeout(() => measure(true), stepIndex === 0 ? 460 : 240);
    const update = () => measure(false);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [currentStep.target, open, stepIndex]);

  useEffect(() => {
    if (!open || !cardRef.current) return;
    const measureCard = () => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      setCardSize({ width: rect.width || 360, height: rect.height || 360 });
    };
    const frame = window.requestAnimationFrame(measureCard);
    window.addEventListener('resize', measureCard);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', measureCard);
    };
  }, [open, stepIndex]);

  const cardStyle = useMemo(() => {
    if (!targetRect || viewport.width < 768) return undefined;

    const safe = SAFE_DESKTOP;
    const width = Math.min(360, Math.max(280, viewport.width - safe * 2));
    const gap = 22;
    const roomRight = viewport.width - targetRect.right - safe;
    const roomLeft = targetRect.left - safe;
    const left =
      roomRight >= width + gap
        ? targetRect.right + gap
        : roomLeft >= width + gap
          ? targetRect.left - width - gap
          : clamp((viewport.width - width) / 2, safe, viewport.width - width - safe);

    const height = Math.min(cardSize.height, Math.max(1, viewport.height - safe * 2));
    const top = clamp(targetRect.top, safe, viewport.height - height - safe);
    return { left, top, width };
  }, [cardSize.height, targetRect, viewport.height, viewport.width]);

  const closeAsSkipped = () => {
    markSeen();
    setOpen(false);
    trackMarketingEvent('demo_material_tour_skipped', {
      source,
      step: stepIndex + 1,
      total_steps: TOUR_STEPS.length,
    });
  };

  const finishTour = () => {
    markSeen();
    setOpen(false);
    trackMarketingEvent('demo_material_tour_completed', {
      source,
      total_steps: TOUR_STEPS.length,
    });
  };

  if (!open) return null;
  const finalStep = stepIndex === TOUR_STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[120] overflow-hidden" aria-live="polite">
      {targetRect ? (
        <>
          <div className="absolute left-0 right-0 top-0 bg-slate-950/60" style={{ height: targetRect.top }} />
          <div className="absolute left-0 bg-slate-950/60" style={{ top: targetRect.top, width: targetRect.left, height: targetRect.height }} />
          <div className="absolute right-0 bg-slate-950/60" style={{ top: targetRect.top, left: targetRect.right, height: targetRect.height }} />
          <div className="absolute bottom-0 left-0 right-0 bg-slate-950/60" style={{ top: targetRect.bottom }} />
          <div
            className="pointer-events-none absolute rounded-[20px] border-2 border-indigo-300 shadow-[0_0_0_3px_rgba(255,255,255,0.55),0_14px_36px_rgba(15,23,42,0.18)]"
            style={{ top: targetRect.top, left: targetRect.left, width: targetRect.width, height: targetRect.height }}
          />
        </>
      ) : (
        <div className="absolute inset-0 bg-slate-950/60" />
      )}

      <section
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Recorrido de Evaluo, paso ${stepIndex + 1} de ${TOUR_STEPS.length}`}
        className={`fixed max-h-[calc(100svh-24px)] overflow-y-auto rounded-[24px] border border-slate-200 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.28)] ${
          targetRect && viewport.width >= 768
            ? ''
            : finalStep
              ? 'left-1/2 top-1/2 w-[calc(100%-24px)] max-w-[440px] -translate-x-1/2 -translate-y-1/2'
              : 'bottom-3 left-3 right-3'
        }`}
        style={targetRect && viewport.width >= 768 ? cardStyle : undefined}
      >
        <div className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-sm font-black text-indigo-600">{stepIndex + 1}</span>
              <span className="text-xs font-bold tracking-[0.1em] text-slate-400 uppercase">{stepIndex + 1} / {TOUR_STEPS.length}</span>
            </div>
            <button type="button" onClick={closeAsSkipped} className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Cerrar recorrido">
              <X className="h-4 w-4" />
            </button>
          </div>

          <h2 className="mt-5 text-[1.35rem] font-bold tracking-[-0.045em] text-slate-950 sm:text-[1.45rem]">{currentStep.title}</h2>
          <p className="mt-2 text-[14px] leading-6 text-slate-600">{currentStep.body}</p>

          {finalStep ? (
            <div className="mt-6 space-y-2.5">
              <Link
                href={uploadHref}
                onClick={() => {
                  markSeen();
                  trackMarketingEvent('demo_material_tour_upload_clicked', { source });
                }}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white shadow-[0_10px_24px_rgba(79,70,229,0.18)] transition hover:bg-indigo-700"
              >
                <FileUp className="h-4 w-4" />
                Subir mi PDF
              </Link>
              <button type="button" onClick={finishTour} className="flex h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50">Seguir viendo el ejemplo</button>
            </div>
          ) : (
            <div className="mt-6 flex items-center gap-2">
              {stepIndex > 0 ? (
                <button type="button" onClick={() => setStepIndex((current) => Math.max(0, current - 1))} className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
                  <ChevronLeft className="h-4 w-4" />
                  Atrás
                </button>
              ) : null}
              <button type="button" onClick={() => setStepIndex((current) => Math.min(TOUR_STEPS.length - 1, current + 1))} className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white transition hover:bg-indigo-700">
                Siguiente
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
