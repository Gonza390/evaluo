'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, ChevronLeft, FileUp, Loader2, X } from 'lucide-react';
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

type SpotlightKind = 'pdf' | 'tab' | 'content';
type SpotlightRect = {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
  radius: number;
  kind: SpotlightKind;
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

function normalizedText(element: HTMLElement) {
  return (element.textContent ?? '').replace(/\s+/g, ' ').trim();
}

function findVisible<T extends HTMLElement>(selector: string) {
  return Array.from(document.querySelectorAll<T>(selector)).find(isVisible) ?? null;
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

function activateTab(label: string) {
  const tab = findStudyTab(label);
  if (!tab) return false;
  if (isTabActive(label)) return true;

  // Radix Tabs can be more reliable when the trigger receives focus first.
  // Blur immediately afterwards so the native focus ring never competes with the tour spotlight.
  tab.focus({ preventScroll: true });
  tab.click();
  window.setTimeout(() => tab.blur(), 0);
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
  if (!isPdfVisible()) findButtonByText('Mostrar PDF')?.click();
}

function hidePdf() {
  findHidePdfButton()?.click();
}

function findStudyRegion() {
  return findVisible<HTMLElement>('[role="region"][aria-label="Contenido de estudio"]');
}

function findActivePanel() {
  return findVisible<HTMLElement>('[role="tabpanel"][data-state="active"]');
}

function resetStudyPosition() {
  const region = findStudyRegion();
  if (region) region.scrollTop = 0;

  const panel = findActivePanel();
  const nestedRegion = panel?.closest<HTMLElement>('[role="region"]');
  if (nestedRegion) nestedRegion.scrollTop = 0;

  const tabList = findVisible<HTMLElement>('[role="tablist"]');
  if (tabList) {
    const rect = tabList.getBoundingClientRect();
    window.scrollTo({ top: Math.max(0, window.scrollY + rect.top - 28), behavior: 'auto' });
  }
}

function findPdfTarget() {
  const hideButton = findHidePdfButton();
  if (hideButton?.parentElement && isVisible(hideButton.parentElement)) return hideButton.parentElement;
  return findVisible<HTMLElement>('#study-viewer-panel');
}

function findAncestorCard(start: HTMLElement, stop: HTMLElement) {
  let current: HTMLElement | null = start;
  while (current && current !== stop) {
    const rect = current.getBoundingClientRect();
    if (isVisible(current) && rect.width >= 420 && rect.height >= 150) return current;
    current = current.parentElement;
  }
  return null;
}

function findPrimaryContentTarget(tab: string) {
  const panel = findActivePanel();
  if (!panel) return null;

  if (tab === 'Tarjetas') {
    const button = Array.from(panel.querySelectorAll<HTMLElement>('button')).find(
      (element) => isVisible(element) && normalizedText(element).includes('Generar flashcards')
    );
    if (button?.parentElement && isVisible(button.parentElement)) return button.parentElement;
  }

  if (tab === 'Examen') {
    const button = Array.from(panel.querySelectorAll<HTMLElement>('button')).find(
      (element) => isVisible(element) && normalizedText(element).includes('Comenzar examen')
    );
    if (button) return findAncestorCard(button, panel) ?? button.parentElement ?? panel;
  }

  if (tab === 'Glosario') {
    const firstArticle = Array.from(panel.querySelectorAll<HTMLElement>('article')).find(isVisible);
    if (firstArticle?.parentElement && isVisible(firstArticle.parentElement)) return firstArticle.parentElement;
  }

  return Array.from(panel.children).find(
    (child): child is HTMLElement => child instanceof HTMLElement && isVisible(child)
  ) ?? panel;
}

function rectFromElement(
  element: HTMLElement,
  kind: SpotlightKind,
  safe: number,
  viewportWidth: number,
  viewportHeight: number,
  padding: number,
  radius: number
): SpotlightRect {
  const raw = element.getBoundingClientRect();
  const top = clamp(raw.top - padding, safe, viewportHeight - safe - 1);
  const left = clamp(raw.left - padding, safe, viewportWidth - safe - 1);
  const right = clamp(raw.right + padding, left + 1, viewportWidth - safe);
  const bottom = clamp(raw.bottom + padding, top + 1, viewportHeight - safe);

  return {
    top,
    left,
    right,
    bottom,
    width: Math.max(1, right - left),
    height: Math.max(1, bottom - top),
    radius,
    kind,
  };
}

export function DemoMaterialGuidedTourV6({
  enabled,
  force = false,
  source = 'demo_material',
  uploadHref,
}: Props) {
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [activationFailed, setActivationFailed] = useState(false);
  const [prepareNonce, setPrepareNonce] = useState(0);
  const [spotlights, setSpotlights] = useState<SpotlightRect[]>([]);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [cardHeight, setCardHeight] = useState(290);
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
    setViewport({ width: window.innerWidth, height: window.innerHeight });
    setOpen(true);

    if (!startedRef.current) {
      startedRef.current = true;
      trackMarketingEvent('demo_material_tour_started', { source, forced: force });
    }
  }, [enabled, force, source]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setTransitioning(true);
    setActivationFailed(false);
    setSpotlights([]);

    void (async () => {
      if (!currentStep.tab) {
        if (!cancelled) setTransitioning(false);
        return;
      }

      let confirmed = false;
      for (let attempt = 0; attempt < 24 && !cancelled; attempt += 1) {
        activateTab(currentStep.tab);
        await wait(attempt < 8 ? 70 : 110);
        if (isTabActive(currentStep.tab)) {
          confirmed = true;
          break;
        }
      }

      if (cancelled) return;
      if (!confirmed) {
        setActivationFailed(true);
        setTransitioning(false);
        return;
      }

      if (stepIndex === 0) {
        for (let attempt = 0; attempt < 20 && !cancelled; attempt += 1) {
          showPdf();
          await wait(70);
          if (isPdfVisible()) break;
        }
      } else if (isPdfVisible()) {
        hidePdf();
        await wait(100);
      }

      if (cancelled) return;
      resetStudyPosition();
      await nextFrame();
      await nextFrame();
      await wait(80);

      if (!cancelled) setTransitioning(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [currentStep.tab, open, prepareNonce, stepIndex]);

  useEffect(() => {
    if (!open || transitioning || activationFailed) return;
    if (trackedStepRef.current === stepIndex) return;

    trackedStepRef.current = stepIndex;
    trackMarketingEvent('demo_material_tour_step_viewed', {
      source,
      step: stepIndex + 1,
      total_steps: TOUR_STEPS.length,
      target: currentStep.target ?? 'conversion',
    });
  }, [activationFailed, currentStep.target, open, source, stepIndex, transitioning]);

  useEffect(() => {
    if (!open || transitioning || activationFailed) return;

    let cancelled = false;
    let timer: number | undefined;

    const measure = () => {
      if (cancelled) return;

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const safe = vw < 768 ? SAFE_MOBILE : SAFE_DESKTOP;
      setViewport({ width: vw, height: vh });

      if (!currentStep.target) {
        setSpotlights([]);
        return;
      }

      if (currentStep.target === 'pdf') {
        const pdf = findPdfTarget();
        if (!pdf) {
          timer = window.setTimeout(measure, 100);
          return;
        }
        setSpotlights([rectFromElement(pdf, 'pdf', safe, vw, vh, 2, 24)]);
        return;
      }

      const tab = currentStep.tab ? findStudyTab(currentStep.tab) : null;
      const content = currentStep.tab ? findPrimaryContentTarget(currentStep.tab) : null;

      // Never hide the tour card just because a fine-grained content target is missing.
      if (!tab) {
        setSpotlights([]);
        return;
      }

      const nextSpotlights: SpotlightRect[] = [
        rectFromElement(tab, 'tab', safe, vw, vh, 2, 14),
      ];

      if (content) {
        let contentRect = rectFromElement(content, 'content', safe, vw, vh, 3, 20);
        const maxHeight =
          currentStep.tab === 'Tarjetas' ? 390 : currentStep.tab === 'Examen' ? 610 : 450;
        const bottom = Math.min(
          contentRect.bottom,
          contentRect.top + Math.min(maxHeight, vh - contentRect.top - safe)
        );
        contentRect = {
          ...contentRect,
          bottom,
          height: Math.max(1, bottom - contentRect.top),
        };
        nextSpotlights.push(contentRect);
      }

      setSpotlights(nextSpotlights);
    };

    timer = window.setTimeout(measure, currentStep.target === 'pdf' ? 160 : 90);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [activationFailed, currentStep.tab, currentStep.target, open, stepIndex, transitioning]);

  useEffect(() => {
    if (!open || !cardRef.current) return;
    const measure = () => {
      if (!cardRef.current) return;
      setCardHeight(cardRef.current.getBoundingClientRect().height || 290);
    };
    const frame = window.requestAnimationFrame(measure);
    window.addEventListener('resize', measure);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', measure);
    };
  }, [activationFailed, open, stepIndex, transitioning]);

  const primarySpotlight = spotlights.find((item) => item.kind === 'content') ?? spotlights[0];

  const cardStyle = useMemo(() => {
    if (viewport.width < 768) return undefined;

    const safe = SAFE_DESKTOP;
    const width = viewport.width >= 1024 ? 300 : Math.min(330, viewport.width - safe * 2);
    const height = Math.min(cardHeight, viewport.height - safe * 2);
    const top = primarySpotlight
      ? clamp(primarySpotlight.top + 8, safe, viewport.height - height - safe)
      : clamp((viewport.height - height) / 2, safe, viewport.height - height - safe);

    return {
      width,
      left: viewport.width - width - safe,
      top,
    };
  }, [cardHeight, primarySpotlight, viewport.height, viewport.width]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        markSeen();
        setOpen(false);
      } else if (event.key === 'ArrowRight' && !transitioning && !activationFailed && stepIndex < TOUR_STEPS.length - 1) {
        setStepIndex((current) => current + 1);
      } else if (event.key === 'ArrowLeft' && !transitioning && stepIndex > 0) {
        setStepIndex((current) => current - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activationFailed, markSeen, open, stepIndex, transitioning]);

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
    trackMarketingEvent('demo_material_tour_completed', { source, total_steps: TOUR_STEPS.length });
  };

  if (!open) return null;
  const finalStep = stepIndex === TOUR_STEPS.length - 1;
  const maskId = 'evaluo-demo-tour-mask-v6';

  return (
    <div className="fixed inset-0 z-[120] overflow-hidden" aria-live="polite">
      {!transitioning && !activationFailed && spotlights.length > 0 ? (
        <>
          <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
            <defs>
              <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%">
                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                {spotlights.map((spotlight, index) => (
                  <rect
                    key={`${spotlight.kind}-${index}`}
                    x={spotlight.left}
                    y={spotlight.top}
                    width={spotlight.width}
                    height={spotlight.height}
                    rx={spotlight.radius}
                    ry={spotlight.radius}
                    fill="black"
                  />
                ))}
              </mask>
            </defs>
            <rect x="0" y="0" width="100%" height="100%" fill="rgba(2,6,23,0.58)" mask={`url(#${maskId})`} />
          </svg>

          {spotlights.map((spotlight, index) => (
            <div
              key={`${spotlight.kind}-border-${index}`}
              className="pointer-events-none absolute border-2 border-indigo-300 shadow-[0_0_0_2px_rgba(255,255,255,0.46),0_12px_32px_rgba(15,23,42,0.14)]"
              style={{
                top: spotlight.top,
                left: spotlight.left,
                width: spotlight.width,
                height: spotlight.height,
                borderRadius: spotlight.radius,
              }}
            />
          ))}
        </>
      ) : (
        <div className="pointer-events-none absolute inset-0 bg-slate-950/60" />
      )}

      <section
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Recorrido de Evaluo, paso ${stepIndex + 1} de ${TOUR_STEPS.length}`}
        className={`fixed max-h-[calc(100svh-24px)] overflow-y-auto rounded-[22px] border border-slate-200 bg-white shadow-[0_24px_68px_rgba(15,23,42,0.25)] ${
          viewport.width >= 768
            ? ''
            : finalStep
              ? 'left-1/2 top-1/2 w-[calc(100%-24px)] max-w-[420px] -translate-x-1/2 -translate-y-1/2'
              : 'bottom-3 left-3 right-3'
        }`}
        style={viewport.width >= 768 ? cardStyle : undefined}
      >
        <div className="p-4.5 sm:p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-sm font-black text-indigo-600">
                {stepIndex + 1}
              </span>
              <span className="text-xs font-bold tracking-[0.1em] text-slate-400 uppercase">
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

          <h2 className="mt-4 text-[1.25rem] font-bold tracking-[-0.04em] text-slate-950 sm:text-[1.35rem]">
            {currentStep.title}
          </h2>
          <p className="mt-2 text-[13.5px] leading-5.5 text-slate-600">{currentStep.body}</p>

          {transitioning ? (
            <div className="mt-5 flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-100 text-sm font-semibold text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Abriendo {currentStep.tab ?? 'el siguiente paso'}…
            </div>
          ) : activationFailed ? (
            <button
              type="button"
              onClick={() => setPrepareNonce((current) => current + 1)}
              className="mt-5 flex h-10 w-full items-center justify-center rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white transition hover:bg-indigo-700"
            >
              Reintentar este paso
            </button>
          ) : finalStep ? (
            <div className="mt-5 space-y-2.5">
              <Link
                href={uploadHref}
                onClick={() => {
                  markSeen();
                  trackMarketingEvent('demo_material_tour_upload_clicked', { source });
                }}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white shadow-[0_10px_24px_rgba(79,70,229,0.18)] transition hover:bg-indigo-700"
              >
                <FileUp className="h-4 w-4" />
                Subir mi PDF
              </Link>
              <button
                type="button"
                onClick={finishTour}
                className="flex h-10 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
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
                  className="inline-flex h-10 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
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
    </div>
  );
}
