'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, ChevronLeft, Info, X } from 'lucide-react';

type Rect = {
  left: number;
  top: number;
  width: number;
  height: number;
  viewportWidth: number;
  viewportHeight: number;
  radius: number;
};
function visibleTarget(selector: string) {
  return Array.from(document.querySelectorAll<HTMLElement>(selector)).find(
    (node) => node.getClientRects().length > 0
  );
}

/** Desenfoque alrededor del componente real; el área destacada sigue siendo interactiva. */
export function PdfTourSpotlight({
  selector,
  title,
  description,
  progress,
  nextLabel = 'Siguiente',
  onNext,
  onBack,
  onSkipToPractice,
  onExit,
  compactDescription,
  showCompactDescription = false,
  ariaLabel = 'Guía del material de ejemplo',
  footerLabel = 'PDF de muestra',
}: {
  selector: string;
  title: string;
  description: string;
  progress: string;
  nextLabel?: string;
  onNext: () => void;
  onBack?: () => void;
  onSkipToPractice?: () => void;
  onExit: () => void;
  compactDescription?: string;
  showCompactDescription?: boolean;
  ariaLabel?: string;
  footerLabel?: string;
}) {
  const card = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const outline = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<Rect | null>(null);
  const [alignLeft, setAlignLeft] = useState(false);
  const [compact, setCompact] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setExpanded(false);
    const documentOverflow = document.documentElement.style.overflowY;
    // Durante la guía se desplaza la sección, sin perder el destacado por scroll de página.
    document.documentElement.style.overflowY = 'hidden';
    let frame = 0;
    let target: HTMLElement | undefined;
    let needsAlignment = true;
    let interacted = false;
    let restoreTarget: (() => void) | undefined;
    const releaseTarget = () => {
      restoreTarget?.();
      restoreTarget = undefined;
    };
    const rememberTarget = (node: HTMLElement) => {
      node.scrollTo({ top: 0 });
      const saved = {
        maxHeight: node.style.maxHeight,
        height: node.style.height,
        overflowY: node.style.overflowY,
        variable: node.style.getPropertyValue('--demo-visible-height'),
      };
      restoreTarget = () => {
        node.style.maxHeight = saved.maxHeight;
        node.style.height = saved.height;
        node.style.overflowY = saved.overflowY;
        if (saved.variable) node.style.setProperty('--demo-visible-height', saved.variable);
        else node.style.removeProperty('--demo-visible-height');
      };
      node
        .querySelector<HTMLElement>('[role="tab"][data-state="active"]')
        ?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
    };
    const update = () => {
      const found = visibleTarget(selector);
      setCompact(window.innerWidth < 1100 || window.innerHeight < 650);
      if (found !== target) {
        if (target) resize.unobserve(target);
        releaseTarget();
        target = found;
        needsAlignment = true;
        if (target) {
          rememberTarget(target);
          resize.observe(target);
        }
        target
          ?.querySelector<HTMLElement>('[aria-label="Contenido de estudio"]')
          ?.scrollTo({ top: 0 });
      }
      if (!target || !card.current) {
        setRect(null);
        return;
      }
      const guide = card.current.getBoundingClientRect();
      const available = Math.max(100, guide.top - 32);
      target.style.maxHeight = `${available}px`;
      const focusKind = target.dataset.demoFocus;
      if (focusKind === 'study') target.style.height = `${available}px`;
      target.style.overflowY = focusKind === 'study' || focusKind === 'pdf' ? 'hidden' : 'auto';
      target.style.setProperty('--demo-visible-height', `${Math.max(80, available - 16)}px`);
      if (needsAlignment || !interacted) {
        const before = target.getBoundingClientRect();
        if (Math.abs(before.top - 16) > 3) {
          target.scrollIntoView({ block: 'start', behavior: 'instant' });
          window.scrollBy({ top: -16, behavior: 'instant' });
        }
        needsAlignment = false;
      }
      const box = target.getBoundingClientRect();
      setAlignLeft(box.left > window.innerWidth / 2);
      const left = Math.max(8, box.left - 5);
      const top = Math.max(8, box.top - 5);
      const right = Math.min(window.innerWidth - 8, box.right + 5);
      const bottom = Math.min(guide.top - 12, box.bottom + 5);
      const next = {
        left,
        top,
        width: Math.max(0, right - left),
        height: Math.max(0, bottom - top),
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        radius: Math.min(
          Number.parseFloat(
            outline.current ? getComputedStyle(outline.current).borderTopLeftRadius : '12'
          ) || 12,
          Math.max(0, right - left) / 2,
          Math.max(0, bottom - top) / 2
        ),
      };
      setRect((old) =>
        old && Object.keys(next).every((key) => old[key as keyof Rect] === next[key as keyof Rect])
          ? old
          : next
      );
    };
    const requestUpdate = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    const observer = new MutationObserver(requestUpdate);
    observer.observe(document.body, { childList: true, subtree: true });
    const resize = new ResizeObserver(requestUpdate);
    if (card.current) resize.observe(card.current);
    resize.observe(document.body);
    heading.current?.focus({ preventScroll: true });
    const resized = () => {
      needsAlignment = true;
      requestUpdate();
    };
    const interaction = () => {
      interacted = true;
    };
    const fullscreen = () => {
      if (document.fullscreenElement) onExit();
    };
    window.addEventListener('resize', resized);
    window.addEventListener('scroll', requestUpdate, true);
    window.addEventListener('animationend', requestUpdate, true);
    window.addEventListener('transitionend', requestUpdate, true);
    window.addEventListener('wheel', interaction, { passive: true });
    window.addEventListener('touchstart', interaction, { passive: true });
    document.addEventListener('fullscreenchange', fullscreen);
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopImmediatePropagation();
        onExit();
      }
      if (event.key !== 'Tab') return;
      const nodes = [target, card.current].flatMap((container) =>
        container
          ? Array.from(
              container.querySelectorAll<HTMLElement>(
                'button:not([disabled]), a[href], input:not([disabled]), [tabindex="0"], [role="tab"][tabindex="-1"]'
              )
            )
          : []
      );
      const focusable = nodes.filter((node) => {
        const b = node.getBoundingClientRect();
        return (
          b.width > 0 &&
          b.height > 0 &&
          !(node.getAttribute('role') === 'tab' && node.tabIndex < 0) &&
          !node.closest('[inert], [aria-hidden="true"]') &&
          (card.current?.contains(node) || (target?.contains(node) && node.offsetParent !== null))
        );
      });
      if (!focusable.length) return;
      const index = focusable.indexOf(document.activeElement as HTMLElement);
      const next = event.shiftKey
        ? index <= 0
          ? focusable.length - 1
          : index - 1
        : (index + 1) % focusable.length;
      event.preventDefault();
      interacted = true;
      focusable[next]?.focus();
    };
    document.addEventListener('keydown', keyboard, true);
    requestUpdate();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      resize.disconnect();
      releaseTarget();
      document.documentElement.style.overflowY = documentOverflow;
      window.removeEventListener('resize', resized);
      window.removeEventListener('scroll', requestUpdate, true);
      window.removeEventListener('animationend', requestUpdate, true);
      window.removeEventListener('transitionend', requestUpdate, true);
      window.removeEventListener('wheel', interaction);
      window.removeEventListener('touchstart', interaction);
      document.removeEventListener('fullscreenchange', fullscreen);
      document.removeEventListener('keydown', keyboard, true);
    };
  }, [selector, title, onExit]);

  // Un único recorte evita uniones entre paneles y comparte la curva del borde real.
  // clip-path también deja pasar los clics dentro del área destacada.
  const clipPath = (() => {
    if (!rect || rect.height <= 0 || rect.width <= 0) return undefined;
    const { left: x, top: y, width, height, radius: r } = rect;
    const right = x + width;
    const bottom = y + height;
    return `path(evenodd, "M 0 0 H ${rect.viewportWidth} V ${rect.viewportHeight} H 0 Z
      M ${x + r} ${y} H ${right - r} A ${r} ${r} 0 0 1 ${right} ${y + r}
      V ${bottom - r} A ${r} ${r} 0 0 1 ${right - r} ${bottom}
      H ${x + r} A ${r} ${r} 0 0 1 ${x} ${bottom - r}
      V ${y + r} A ${r} ${r} 0 0 1 ${x + r} ${y} Z")`.replace(/\s+/g, ' ');
  })();

  return (
    <>
      <div
        data-demo-spotlight-blur
        aria-hidden="true"
        className="bg-foreground/20 fixed inset-0 z-[80] backdrop-blur-[4px]"
        style={{ clipPath }}
      />
      {rect && rect.height > 0 && (
        <div
          ref={outline}
          data-demo-spotlight-outline
          aria-hidden="true"
          className="border-primary pointer-events-none fixed z-[81] rounded-xl border-2 shadow-lg"
          style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }}
        />
      )}
      <div
        ref={card}
        role="region"
        aria-label={ariaLabel}
        className={`border-border bg-background text-foreground fixed right-3 bottom-[max(12px,env(safe-area-inset-bottom))] left-3 z-[90] flex max-h-[48dvh] flex-col rounded-2xl border shadow-2xl ${alignLeft ? 'sm:right-auto sm:w-[400px]' : 'sm:left-auto sm:w-[400px]'} [@media(max-height:480px)]:right-3 [@media(max-height:480px)]:left-3 [@media(max-height:480px)]:w-auto`}
      >
        <div
          className={`flex shrink-0 items-center justify-between gap-1 px-4 sm:gap-2 ${compact ? 'pt-1' : 'pt-2'}`}
        >
          {onBack && onSkipToPractice && (
            <button
              type="button"
              onClick={onBack}
              aria-label="Volver al paso anterior"
              className="hover:bg-muted flex size-8 shrink-0 items-center justify-center rounded-lg"
            >
              <ChevronLeft size={18} />
            </button>
          )}
          <span className="text-primary text-xs font-semibold whitespace-nowrap">{progress}</span>
          {compact && (
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              aria-label={
                expanded ? 'Ocultar indicaciones completas' : 'Ver indicaciones completas'
              }
              aria-expanded={expanded}
              className="hover:bg-muted ml-auto flex min-h-8 items-center justify-center gap-1 rounded-lg px-2 text-xs"
            >
              <Info size={16} />
              <span className="min-[360px]:hidden">Ayuda</span>
              <span className="hidden min-[360px]:inline">Cómo usarlo</span>
            </button>
          )}
          <button
            onClick={onExit}
            aria-label="Salir de la guía"
            className={`hover:bg-muted focus-visible:outline-ring flex shrink-0 items-center justify-center rounded-lg focus-visible:outline-2 ${compact ? 'size-8' : 'size-10'}`}
          >
            <X size={18} />
          </button>
        </div>
        <div className="min-h-0 overflow-y-auto px-4 pb-3">
          <h2
            ref={heading}
            tabIndex={-1}
            aria-description={compact && !expanded ? compactDescription : undefined}
            className={`${compact ? 'text-base' : 'text-lg'} leading-snug font-semibold outline-none`}
          >
            {title}
          </h2>
          {(!compact || expanded || showCompactDescription) && (
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed [@media(max-height:480px)]:mt-1 [@media(max-height:480px)]:text-xs">
              {compact && !expanded ? (compactDescription ?? description) : description}
            </p>
          )}
        </div>
        <div className="border-border flex shrink-0 items-center justify-between gap-2 border-t px-4 py-2">
          {onSkipToPractice ? (
            <Button
              variant="ghost"
              size="sm"
              className="min-h-11 px-2 text-xs"
              onClick={onSkipToPractice}
            >
              Ir a práctica
            </Button>
          ) : onBack ? (
            <Button variant="ghost" size="sm" className="min-h-11" onClick={onBack}>
              Atrás
            </Button>
          ) : (
            <span className="text-muted-foreground hidden text-xs min-[360px]:block">
              {footerLabel}
            </span>
          )}
          <Button
            size="sm"
            className="ml-auto min-h-11 max-w-full min-w-0 shrink text-center whitespace-normal"
            onClick={onNext}
          >
            {nextLabel}
            <ArrowRight size={16} />
          </Button>
        </div>
      </div>
    </>
  );
}
