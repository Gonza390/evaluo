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
    target: 'pdf' as const,
    tab: 'Resumen',
    title: 'Este es el PDF original',
    body: 'Podés leerlo acá y volver a la fuente cuando quieras. Todo lo que Evaluo prepara parte de este documento.',
  },
  {
    target: 'content' as const,
    tab: 'Resumen',
    title: 'Empezá por el resumen',
    body: 'Evaluo organiza el material y destaca los puntos importantes para que puedas repasar sin releer todo desde cero.',
  },
  {
    target: 'content' as const,
    tab: 'Glosario',
    title: 'Revisá los conceptos clave',
    body: 'El glosario reúne términos y definiciones importantes detectados dentro del PDF para que no pierdas tiempo buscándolos.',
  },
  {
    target: 'content' as const,
    tab: 'Tarjetas',
    title: 'Memorizá con tarjetas',
    body: 'Convertí el contenido del documento en flashcards y comprobá qué conceptos ya recordás y cuáles necesitás repetir.',
  },
  {
    target: 'content' as const,
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

type SpotlightRect = {
  top: number;
  left: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
  radius: number;
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

function wait(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
}

function nextFrame() {
  return new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
}

function isVisible(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);
  return (
    rect.width > 4 &&
    rect.height > 4 &&
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0'
  );
}

function findVisible<T extends HTMLElement>(selector: string) {
  return Array.from(document.querySelectorAll<T>(selector)).find(isVisible) ?? null;
}

function normalizedText(element: HTMLElement) {
  return (element.textContent ?? '').replace(/\s+/g, ' ').trim();
}

function findStudyTab(label: string) {
  return (
    Array.from(document.querySelectorAll<HTMLElement>('[role="tab"]')).find(
      (element) => isVisible(element) && normalizedText(element).startsWith(label)
    ) ?? null
  );
}

function isTabActive(label: string) {
  const tab = findStudyTab(label);
  return Boolean(
    tab &&
      (tab.getAttribute('aria-selected') === 'true' || tab.getAttribute('data-state') === 'active')
  );
}

function clickTab(label: string) {
  const tab = findStudyTab(label);
  if (!tab) return false;
  if (!isTabActive(label)) {
    tab.focus({ preventScroll: true });
    tab.click();
  }
  return true;
}

function findButtonByText(text: string) {
  return (
    Array.from(document.querySelectorAll<HTMLElement>('button')).find(
      (element) => isVisible(element) && normalizedText(element).includes(text)
    ) ?? null
  );
}

function findHidePdfButton() {
  return findVisible<HTMLButtonElement>('[aria-label="Ocultar PDF"]');
}

function isPdfVisible() {
  return Boolean(findHidePdfButton());
}

function showPdf() {
  if (isPdfVisible()) return;
  findButtonByText('Mostrar PDF')?.click();
}

function hidePdf() {
  findHidePdfButton()?.click();
}

function resetStudyPosition() {
  const studyRegion = findVisible<HTMLElement>(
    '[role="region"][aria-label="Contenido de estudio"]'
  );
  if (studyRegion) studyRegion.scrollTop = 0;

  const activePanel = findVisible<HTMLElement>('[role="tabpanel"][data-state="active"]');
  const nestedScroller = activePanel?.closest<HTMLElement>('[role="region"]');
  if (nestedScroller) nestedScroller.scrollTop = 0;

  const tabList = findVisible<HTMLElement>('[role="tablist"]');
  if (tabList) {
    const rect = tabList.getBoundingClientRect();
    const targetTop = Math.max(0, window.scrollY + rect.top - 28);
    window.scrollTo({ top: targetTop, behavior: 'auto' });
  }
}

function findPdfTarget() {
  const hideButton = findHidePdfButton();
  if (hideButton?.parentElement && isVisible(hideButton.parentElement)) {
    return hideButton.parentElement;
  }

  return findVisible<HTMLElement>('#study-viewer-panel');
}

function findContentTarget() {
  return findVisible<HTMLElement>('[role="tabpanel"][data-state="active"]');
}

export function DemoMaterialGuidedTourV3({
  enabled,
  force = false,
  source = 'demo_material',
  uploadHref,
}: Props) {
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [stepReady, setStepReady] = useState(false);
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [cardSize, setCardSize] = useState({ width: 320, height: 300 });
  const startedRef = useRef(false);
  const trackedStepRef = useRef<number | null>(null);
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

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        markSeen();
        setOpen(false);
        trackMarketingEvent('demo_material_tour_skipped', {
          source,
          step: stepIndex + 1,
          total_steps: TOUR_STEPS.length,
        });
        return;
      }

      if (event.key === 'ArrowRight' && stepReady && stepIndex < TOUR_STEPS.length - 1) {
        setStepIndex((current) => current + 1);
      }

      if (event.key === 'ArrowLeft' && stepReady && stepIndex > 0) {
        setStepIndex((current) => current - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [markSeen, open, source, stepIndex, stepReady]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setStepReady(false);
    setSpotlight(null);

    void (async () => {
      if (!currentStep.tab) {
        if (!cancelled) setStepReady(true);
        return;
      }

      let tabConfirmed = false;
      for (let attempt = 0; attempt < 32 && !cancelled; attempt += 1) {
        clickTab(currentStep.tab);
        await wait(attempt < 8 ? 80 : 120);
        if (isTabActive(currentStep.tab)) {
          tabConfirmed = true;
          break;
        }
      }
      if (cancelled || !tabConfirmed) return;

      if (stepIndex === 0) {
        for (let attempt = 0; attempt < 24 && !cancelled; attempt += 1) {
          showPdf();
          await wait(80);
          if (isPdfVisible()) break;
        }
      } else {
        for (let attempt = 0; attempt < 24 && !cancelled; attempt += 1) {
          if (!isPdfVisible()) break;
          hidePdf();
          await wait(80);
        }
      }
      if (cancelled) return;

      resetStudyPosition();
      await nextFrame();
      await nextFrame();
      await wait(80);

      if (!isTabActive(currentStep.tab)) return;
      if (stepIndex === 0 && !isPdfVisible()) return;
      if (stepIndex > 0 && isPdfVisible()) return;

      setStepReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [currentStep.tab, open, stepIndex]);

  useEffect(() => {
    if (!open || !stepReady) return;

    if (trackedStepRef.current !== stepIndex) {
      trackedStepRef.current = stepIndex;
      trackMarketingEvent('demo_material_tour_step_viewed', {
        source,
        step: stepIndex + 1,
        total_steps: TOUR_STEPS.length,
        target: currentStep.target ?? 'conversion',
      });
    }
  }, [currentStep.target, open, source, stepIndex, stepReady]);

  useEffect(() => {
    if (!open || !stepReady) return;

    let cancelled = false;
    let timer: number | undefined;

    const measure = () => {
      if (cancelled) return;

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      setViewport({ width: vw, height: vh });

      if (!currentStep.target) {
        setSpotlight(null);
        return;
      }

      const element = currentStep.target === 'pdf' ? findPdfTarget() : findContentTarget();
      if (!element) {
        timer = window.setTimeout(measure, 100);
        return;
      }

      const raw = element.getBoundingClientRect();
      const safe = vw < 768 ? SAFE_MOBILE : SAFE_DESKTOP;
      const padding = currentStep.target === 'pdf' ? 2 : 4;
      let top = clamp(raw.top - padding, safe, vh - safe - 1);
      let left = clamp(raw.left - padding, safe, vw - safe - 1);
      let right = clamp(raw.right + padding, left + 1, vw - safe);
      let bottom = clamp(raw.bottom + padding, top + 1, vh - safe);

      if (currentStep.target === 'content' && vw >= 1024) {
        const reservedCard = 320 + 28 + safe;
        const maxRight = Math.max(left + 420, vw - reservedCard);
        right = Math.min(right, maxRight);
        const maxHeight = Math.min(500, Math.max(260, vh - top - safe));
        bottom = Math.min(bottom, top + maxHeight);
      } else if (currentStep.target === 'content') {
        bottom = Math.min(bottom, top + Math.min(430, vh - top - safe));
      }

      setSpotlight({
        top,
        left,
        right,
        bottom,
        width: Math.max(1, right - left),
        height: Math.max(1, bottom - top),
        radius: currentStep.target === 'pdf' ? 24 : 20,
      });
    };

    timer = window.setTimeout(measure, currentStep.target === 'pdf' ? 180 : 100);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [currentStep.target, open, stepIndex, stepReady]);

  useEffect(() => {
    if (!open || !cardRef.current) return;

    const measure = () => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      setCardSize({ width: rect.width || 320, height: rect.height || 300 });
    };

    const frame = window.requestAnimationFrame(measure);
    window.addEventListener('resize', measure);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', measure);
    };
  }, [open, stepIndex, stepReady]);

  const cardStyle = useMemo(() => {
    if (!spotlight || viewport.width < 768) return undefined;

    const safe = SAFE_DESKTOP;
    const width = viewport.width >= 1024 ? 320 : Math.min(340, viewport.width - safe * 2);
    const height = Math.min(cardSize.height, viewport.height - safe * 2);

    if (currentStep.target === 'content' && viewport.width >= 1024) {
      return {
        width,
        left: viewport.width - width - safe,
        top: clamp(spotlight.top + 8, safe, viewport.height - height - safe),
      };
    }

    const gap = 22;
    const roomLeft = spotlight.left - safe;
    const roomRight = viewport.width - spotlight.right - safe;
    const left =
      roomLeft >= width + gap
        ? spotlight.left - width - gap
        : roomRight >= width + gap
          ? spotlight.right + gap
          : clamp((viewport.width - width) / 2, safe, viewport.width - width - safe);

    return {
      width,
      left,
      top: clamp(spotlight.top + 6, safe, viewport.height - height - safe),
    };
  }, [cardSize.height, currentStep.target, spotlight, viewport.height, viewport.width]);

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
      {stepReady && spotlight ? (
        <div
          className="pointer-events-none absolute border-2 border-indigo-300"
          style={{
            top: spotlight.top,
            left: spotlight.left,
            width: spotlight.width,
            height: spotlight.height,
            borderRadius: spotlight.radius,
            boxShadow:
              '0 0 0 9999px rgba(15,23,42,0.60), 0 0 0 3px rgba(255,255,255,0.56), 0 14px 36px rgba(15,23,42,0.18)',
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-slate-950/60" />
      )}

      {stepReady ? (
        <section
          ref={cardRef}
          role="dialog"
          aria-modal="true"
          aria-label={`Recorrido de Evaluo, paso ${stepIndex + 1} de ${TOUR_STEPS.length}`}
          className={`fixed max-h-[calc(100svh-24px)] overflow-y-auto rounded-[22px] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.24)] ${
            spotlight && viewport.width >= 768
              ? ''
              : finalStep
                ? 'left-1/2 top-1/2 w-[calc(100%-24px)] max-w-[420px] -translate-x-1/2 -translate-y-1/2'
                : 'bottom-3 left-3 right-3'
          }`}
          style={spotlight && viewport.width >= 768 ? cardStyle : undefined}
        >
          <div className="p-4.5 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-sm font-black text-indigo-600">
                  {stepIndex + 1}
                </span>
                <span className="text-[11px] font-bold tracking-[0.1em] text-slate-400 uppercase">
                  {stepIndex + 1} / {TOUR_STEPS.length}
                </span>
              </div>
              <button
                type="button"
                onClick={closeAsSkipped}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Cerrar recorrido"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <h2 className="mt-4 text-[1.2rem] font-bold leading-6 tracking-[-0.04em] text-slate-950">
              {currentStep.title}
            </h2>
            <p className="mt-2 text-[13px] leading-[1.55] text-slate-600">{currentStep.body}</p>

            {finalStep ? (
              <div className="mt-5 space-y-2">
                <Link
                  href={uploadHref}
                  onClick={() => {
                    markSeen();
                    trackMarketingEvent('demo_material_tour_upload_clicked', { source });
                  }}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white transition hover:bg-indigo-700"
                >
                  <FileUp className="h-4 w-4" />
                  Subir mi PDF
                </Link>
                <button
                  type="button"
                  onClick={finishTour}
                  className="flex h-10 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Seguir viendo el ejemplo
                </button>
              </div>
            ) : (
              <div className="mt-5 flex items-center gap-2">
                {stepIndex > 0 ? (
                  <button
                    type="button"
                    onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
                    className="inline-flex h-10 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Atrás
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setStepIndex((current) => Math.min(TOUR_STEPS.length - 1, current + 1))}
                  className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white transition hover:bg-indigo-700"
                >
                  Siguiente
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
