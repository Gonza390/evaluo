'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { TourCard } from '@/components/ui/tour-card';

export type GuidedTourTarget =
  | { type: 'ref'; ref: React.RefObject<HTMLElement | null> }
  | { type: 'selector'; selector: string; mobileSelector?: string };

export type GuidedTourStep = {
  title: string;
  description: string;
  target: GuidedTourTarget;
};

function getZoomFactor(): number {
  if (typeof document === 'undefined') {
    return 1;
  }
  const value = getComputedStyle(document.documentElement).zoom;
  const parsed = value ? parseFloat(value) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function getRingRadius(targetRadius: string, padding: number): string {
  const trimmed = targetRadius.trim();
  if (!trimmed || trimmed === '0px') {
    return `${Math.max(4, padding)}px`;
  }
  const match = trimmed.match(/^([\d.]+)px$/);
  if (match) {
    const value = parseFloat(match[1]);
    if (Number.isFinite(value)) {
      return `${Math.max(4, value + padding)}px`;
    }
  }
  return trimmed;
}

const RING_PADDING = 6;
const GAP = 16;
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function getScrollParent(element: HTMLElement): HTMLElement | null {
  let node = element.parentElement;
  while (node) {
    const { overflowY } = getComputedStyle(node);
    if (['auto', 'scroll', 'overlay'].includes(overflowY) && node.scrollHeight > node.clientHeight + 1) {
      return node;
    }
    node = node.parentElement;
  }
  return (document.scrollingElement as HTMLElement | null) ?? document.documentElement;
}

function getFocusableElements(container: HTMLElement | null) {
  if (!container) return [];
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter((element) => {
    const style = getComputedStyle(element);
    return style.visibility !== 'hidden' && style.display !== 'none' && element.getClientRects().length > 0;
  });
}

export function GuidedTour({
  open,
  stepIndex,
  steps,
  onNext,
  onPrevious,
  onClose,
  finalLabel = 'Entendido',
  ariaLabel = 'Guía interactiva',
}: {
  open: boolean;
  stepIndex: number;
  steps: GuidedTourStep[];
  onNext: () => void;
  onPrevious: () => void;
  onClose: () => void;
  finalLabel?: string;
  ariaLabel?: string;
}) {
  const [mounted, setMounted] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [targetRadius, setTargetRadius] = useState<string>('14px');
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [cardHeight, setCardHeight] = useState(300);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const stepsRef = useRef(steps);
  const scrollAdjustedRef = useRef(false);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
    stepsRef.current = steps;
  }, [steps]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;

      const card = cardRef.current;
      if (!card) return;

      const focusable = getFocusableElements(card);
      if (focusable.length === 0) {
        event.preventDefault();
        card.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeElement = document.activeElement as HTMLElement | null;

      if (!card.contains(activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
        return;
      }

      if (event.shiftKey && activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement | null;
      requestAnimationFrame(() => {
        const closeButton = cardRef.current?.querySelector<HTMLButtonElement>(
          'button[aria-label="Cerrar guía"]'
        );
        if (closeButton) {
          closeButton.focus();
        } else {
          cardRef.current?.focus();
        }
      });
    } else if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [open, stepIndex]);

  const resolveTargetElement = useCallback((): HTMLElement | null => {
    const target = stepsRef.current[stepIndex]?.target;
    if (!target) {
      return null;
    }
    if (target.type === 'ref') {
      return target.ref.current;
    }
    if (typeof window !== 'undefined' && window.innerWidth < 768 && target.mobileSelector) {
      return document.querySelector<HTMLElement>(target.mobileSelector);
    }
    return document.querySelector<HTMLElement>(target.selector);
  }, [stepIndex]);

  useEffect(() => {
    const updateViewport = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  useLayoutEffect(() => {
    if (cardRef.current) {
      setCardHeight(cardRef.current.offsetHeight || 300);
    }
  }, [stepIndex, open]);

  useEffect(() => {
    if (!open) {
      setTargetRect(null);
      scrollAdjustedRef.current = false;
      return;
    }
    let cancelled = false;
    let raf = 0;
    scrollAdjustedRef.current = false;
    const element = resolveTargetElement();
    const compute = () => {
      if (cancelled) {
        return;
      }
      const current = resolveTargetElement();
      if (!current) {
        return;
      }
      setTargetRect(current.getBoundingClientRect());
      setTargetRadius(getComputedStyle(current).borderRadius || '14px');
    };
    const applyScroll = () => {
      if (cancelled || !element) {
        return;
      }
      const rect = element.getBoundingClientRect();
      const vh = window.innerHeight;
      const scrollParent = getScrollParent(element);
      const isWindowScroll =
        !scrollParent || scrollParent === document.scrollingElement || scrollParent === document.documentElement;
      const currentScroll = isWindowScroll ? window.scrollY : scrollParent.scrollTop;
      const cardHeightEstimate = 320;
      const placeBelow = rect.bottom + cardHeightEstimate + GAP <= vh - 16;
      const desiredTop = placeBelow
        ? rect.top + currentScroll - vh * 0.16
        : rect.top + currentScroll - (vh * 0.88 - rect.height);
      const maxScroll = isWindowScroll
        ? Math.max(0, document.documentElement.scrollHeight - vh)
        : Math.max(0, scrollParent.scrollHeight - scrollParent.clientHeight);
      const targetY = Math.max(0, Math.min(desiredTop, maxScroll));
      if (Math.abs(targetY - currentScroll) > 1) {
        if (isWindowScroll) {
          window.scrollTo({ top: targetY, behavior: 'smooth' });
        } else {
          scrollParent.scrollTo({ top: targetY, behavior: 'smooth' });
        }
      }
    };
    raf = requestAnimationFrame(compute);
    const settleTimeout = window.setTimeout(compute, 650);
    const onScrollResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(compute);
    };
    window.addEventListener('scroll', onScrollResize, true);
    window.addEventListener('resize', onScrollResize);
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && element) {
      resizeObserver = new ResizeObserver(() => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(compute);
        applyScroll();
      });
      resizeObserver.observe(element);
    }
    return () => {
      cancelled = true;
      window.removeEventListener('scroll', onScrollResize, true);
      window.removeEventListener('resize', onScrollResize);
      resizeObserver?.disconnect();
      cancelAnimationFrame(raf);
      window.clearTimeout(settleTimeout);
    };
  }, [open, stepIndex, resolveTargetElement]);

  const step = steps[stepIndex];

  if (!mounted || !open || !step || !targetRect || viewport.width === 0) {
    return null;
  }

  const cardWidth = Math.min(360, Math.max(300, viewport.width - 32));
  const spaceBelow = viewport.height - targetRect.bottom - 16;
  const placeBelow = spaceBelow >= cardHeight + GAP;
  const top = placeBelow ? targetRect.bottom + GAP : Math.max(16, targetRect.top - GAP - cardHeight);
  const left = Math.min(
    Math.max(16, targetRect.left + targetRect.width / 2 - cardWidth / 2),
    Math.max(16, viewport.width - cardWidth - 16)
  );

  const hole = {
    top: Math.max(0, targetRect.top - RING_PADDING),
    left: Math.max(0, targetRect.left - RING_PADDING),
    right: Math.min(viewport.width, targetRect.right + RING_PADDING),
    bottom: Math.min(viewport.height, targetRect.bottom + RING_PADDING),
  };
  const clipPath = [
    `polygon(evenodd, 0px 0px, 0px ${viewport.height}px, ${viewport.width}px ${viewport.height}px, ${viewport.width}px 0px, 0px 0px,`,
    `${hole.left}px ${hole.top}px, ${hole.right}px ${hole.top}px, ${hole.right}px ${hole.bottom}px, ${hole.left}px ${hole.bottom}px, ${hole.left}px ${hole.top}px)`,
  ].join(' ');

  const zoom = getZoomFactor();
  const ringRadius = getRingRadius(targetRadius, RING_PADDING);

  const overlay = (
    <div
      aria-label={ariaLabel}
      role="dialog"
      aria-modal="true"
      aria-live="assertive"
      className="fixed inset-0 z-[90]"
    >
      <div
        data-tour-overlay
        className="absolute inset-0"
        style={{
          background: 'rgba(9,17,38,0.45)',
          clipPath,
        }}
      />
      <div
        data-tour-ring
        aria-hidden="true"
        className="pointer-events-none absolute"
        style={{
          left: hole.left / zoom,
          top: hole.top / zoom,
          width: (hole.right - hole.left) / zoom,
          height: (hole.bottom - hole.top) / zoom,
          borderRadius: ringRadius,
          boxShadow:
            'inset 0 0 0 2px rgba(255,255,255,0.95), 0 0 0 2px var(--brand), 0 0 0 6px color-mix(in oklch, var(--brand) 22%, transparent), 0 18px 45px rgba(9,17,38,0.28)',
        }}
      />
      <div
        data-tour-card
        ref={cardRef}
        tabIndex={-1}
        className="pointer-events-auto absolute outline-none"
        style={{ left: left / zoom, top: top / zoom, width: cardWidth / zoom }}
      >
        <div className="relative">
          {placeBelow ? (
            <div className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 rounded-[2px] border-t border-l border-border bg-card" />
          ) : (
            <div className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 rounded-[2px] border-b border-r border-border bg-card" />
          )}
          <TourCard
            title={step.title}
            description={step.description}
            stepIndex={stepIndex}
            totalSteps={steps.length}
            onNext={onNext}
            onPrevious={onPrevious}
            onClose={onClose}
            finalLabel={finalLabel}
          />
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}
