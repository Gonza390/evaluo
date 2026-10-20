'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  BrainCircuit,
  ChartNoAxesColumnIncreasing,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export type RecommendedStudyStep = 'summary' | 'practice' | 'errors';

const steps = {
  summary: {
    label: 'Entender',
    title: 'Entendé tus apuntes',
    description: 'Tu PDF se organiza en capítulos para empezar a estudiar.',
    icon: BookOpenText,
  },
  practice: {
    label: 'Practicar',
    title: 'Comprobá cuánto sabés',
    description: 'Practicá con preguntas creadas a partir de tu PDF.',
    icon: BrainCircuit,
  },
  errors: {
    label: 'Progreso',
    title: 'Dejá de estudiar a ciegas',
    description: 'Después de practicar, Evaluo te ayuda a identificar qué temas necesitás reforzar.',
    icon: ChartNoAxesColumnIncreasing,
  },
} as const;

const order: RecommendedStudyStep[] = ['summary', 'practice', 'errors'];

// Tres pantallas reales. El contexto permanece visible: sin recortes de texto
// ni una evaluación obligatoria para recorrer la plataforma.
const studyPanelSelector = '[data-onboarding-study-panel]';

type Spotlight = {
  top: number;
  left: number;
  width: number;
  height: number;
  cardTop: number;
  cardLeft: number;
};

function findStudyPanel(): HTMLElement | null {
  const candidates = Array.from(document.querySelectorAll<HTMLElement>(studyPanelSelector));
  // Hay versiones desktop/móvil montadas simultáneamente; elegir la realmente visible.
  return candidates
    .filter((node) => {
      const rect = node.getBoundingClientRect();
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        getComputedStyle(node).visibility !== 'hidden' &&
        rect.bottom > 0 &&
        rect.top < window.innerHeight
      );
    })
    .sort((a, b) => {
      const visibleArea = (node: HTMLElement) => {
        const rect = node.getBoundingClientRect();
        const viewportBottom = window.innerHeight;
        return (
          Math.max(0, Math.min(rect.right, window.innerWidth) - Math.max(0, rect.left)) *
          Math.max(0, Math.min(rect.bottom, viewportBottom) - Math.max(0, rect.top))
        );
      };
      return visibleArea(b) - visibleArea(a);
    })[0] ?? null;
}

function getSpotlight(node: HTMLElement, cardHeight: number, cardWidth: number): Spotlight {
  // Barra de pestañas y contenido se ven juntos: resumen, práctica o progreso.
  const shellRect = node.getBoundingClientRect();
  const rect = shellRect;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const inset = 7;

  // No iluminar contenido debajo de la barra fija de navegación móvil.
  const nav = document.querySelector<HTMLElement>('[data-pdf-mobile-navigation]');
  const navTop =
    nav && nav.getBoundingClientRect().height > 0
      ? nav.getBoundingClientRect().top - inset
      : viewportHeight - inset;
  const left = Math.max(inset, rect.left - inset);
  const top = Math.max(inset, rect.top - inset);
  const right = Math.min(viewportWidth - inset, rect.right + inset);
  const bottom = Math.max(top, Math.min(viewportHeight - inset, navTop, rect.bottom + inset));

  // El detalle tiene más ancho, pero sigue centrado sin invadir el borde derecho.
  cardWidth = Math.min(cardWidth, viewportWidth - 24);
  // La tarjeta se mantiene centrada sobre el panel, no sobre un párrafo aislado.
  const cardLeft = Math.max(
    12,
    Math.min(viewportWidth - cardWidth - 12, left + (right - left - cardWidth) / 2)
  );
  // Explicación centrada sobre el panel, sin tapar las herramientas.
  const cardTop = Math.max(12, shellRect.top - cardHeight - 12);

  return {
    top,
    left,
    width: Math.max(0, right - left),
    height: Math.max(0, bottom - top),
    cardTop,
    cardLeft,
  };
}

/**
 * Recorrido de menos de 20 segundos: tres conceptos que explican Evaluo.
 * La pantalla real se ve completa durante todo el tutorial.
 * El portal evita que los contenedores con overflow recorten el spotlight.
 */
export function RecommendedStudyGuide({
  step,
  transitioning = false,
  onProgressDetailChange,
  onNext,
  onBack,
  onExit,
}: {
  step: RecommendedStudyStep;
  transitioning?: boolean;
  onProgressDetailChange?: (show: boolean) => void;
  onNext: () => void;
  onBack?: () => void;
  onExit: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [spotlight, setSpotlight] = useState<Spotlight | null>(null);
  // Un clic extra dentro de Progreso; nunca aparece un cuarto paso.
  const [progressExplained, setProgressExplained] = useState(false);
  const cardRef = useRef<HTMLElement | null>(null);
  const current = steps[step];
  const Icon = current.icon;
  const number = order.indexOf(step) + 1;
  const showingProgressDetail = step === 'errors' && progressExplained;
  const title = showingProgressDetail ? 'Cada práctica te ayuda a mejorar' : current.title;
  const description = showingProgressDetail
    ? 'Mirá en tus temas qué dominás y qué conviene reforzar.'
    : current.description;
  const handleNext = () => {
    if (step === 'errors' && !progressExplained) {
      setProgressExplained(true);
      onProgressDetailChange?.(true);
      return;
    }
    onNext();
  };
  const handleBack = () => {
    if (showingProgressDetail) {
      setProgressExplained(false);
      onProgressDetailChange?.(false);
      return;
    }
    onBack?.();
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    let frame = 0;
    let retries = 0;
    let observer: ResizeObserver | null = null;
    let observed: HTMLElement | null = null;
    let cardObserver: ResizeObserver | null = null;

    const update = () => {
      const node = findStudyPanel();
      if (!node) {
        if (retries++ < 45) frame = window.requestAnimationFrame(update);
        return;
      }

      if (observed !== node) {
        observer?.disconnect();
        observer = new ResizeObserver(() => {
          window.cancelAnimationFrame(frame);
          frame = window.requestAnimationFrame(update);
        });
        observer.observe(node);
        observed = node;
      }

      const next = getSpotlight(
        node,
        cardRef.current?.getBoundingClientRect().height ?? 214,
        cardRef.current?.getBoundingClientRect().width ?? 320
      );
      setSpotlight((previous) =>
        previous &&
        Object.keys(next).every(
          (key) =>
            previous[key as keyof Spotlight] === next[key as keyof Spotlight]
        )
          ? previous
          : next
      );
    };

    const scheduleUpdate = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(update);
    };

    scheduleUpdate();
    if (cardRef.current) {
      cardObserver = new ResizeObserver(scheduleUpdate);
      cardObserver.observe(cardRef.current);
    }
    window.addEventListener('resize', scheduleUpdate);
    document.addEventListener('scroll', scheduleUpdate, true);
    return () => {
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
      cardObserver?.disconnect();
      window.removeEventListener('resize', scheduleUpdate);
      document.removeEventListener('scroll', scheduleUpdate, true);
    };
  }, [mounted, step]);

  useEffect(() => {
    if (!mounted) return;
    cardRef.current?.focus({ preventScroll: true });
  }, [mounted, step]);

  useEffect(() => {
    if (!mounted) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onExit();
        return;
      }
      if (event.key !== 'Tab' || !cardRef.current) return;
      const buttons = Array.from(cardRef.current.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
      if (buttons.length === 0) return;
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (!cardRef.current.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mounted, onExit]);

  if (!mounted) return null;

  // Luz suave: la plataforma sigue siendo legible mientras enseñamos cada área.
  const overlayClass =
    'pointer-events-auto fixed z-[80] bg-slate-950/12 backdrop-blur-[1px] ' +
    'transition-[top,left,width,height,opacity] duration-[300ms] ' +
    'ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none';
  const cornerClass =
    'pointer-events-auto fixed z-[80] backdrop-blur-[1px] ' +
    'transition-[top,left,width,height,opacity] duration-[300ms] ' +
    'ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none';
  const cornerRadius = spotlight ? Math.min(28, spotlight.width / 2, spotlight.height / 2) : 28;
  const cornerShade = 'rgba(2,6,23,0.12)';

  return createPortal(
    <>
      {spotlight ? (
        <>
          <div aria-hidden="true" className={overlayClass} style={{ top: 0, left: 0, right: 0, height: spotlight.top }} />
          <div aria-hidden="true" className={overlayClass} style={{ top: spotlight.top + spotlight.height, left: 0, right: 0, bottom: 0 }} />
          <div aria-hidden="true" className={overlayClass} style={{ top: spotlight.top, left: 0, width: spotlight.left, height: spotlight.height }} />
          <div aria-hidden="true" className={overlayClass} style={{ top: spotlight.top, left: spotlight.left + spotlight.width, right: 0, height: spotlight.height }} />
          {/*
            Las cuatro esquinas cierran el recorte rectangular con arcos reales:
            fondo y desenfoque también respetan el radio del foco iluminado.
          */}
          <div aria-hidden="true" className={cornerClass} style={{
            top: spotlight.top,
            left: spotlight.left,
            width: cornerRadius,
            height: cornerRadius,
            background: `radial-gradient(circle at 100% 100%, transparent ${cornerRadius - 1}px, ${cornerShade} ${cornerRadius}px)`,
          }} />
          <div aria-hidden="true" className={cornerClass} style={{
            top: spotlight.top,
            left: spotlight.left + spotlight.width - cornerRadius,
            width: cornerRadius,
            height: cornerRadius,
            background: `radial-gradient(circle at 0% 100%, transparent ${cornerRadius - 1}px, ${cornerShade} ${cornerRadius}px)`,
          }} />
          <div aria-hidden="true" className={cornerClass} style={{
            top: spotlight.top + spotlight.height - cornerRadius,
            left: spotlight.left,
            width: cornerRadius,
            height: cornerRadius,
            background: `radial-gradient(circle at 100% 0%, transparent ${cornerRadius - 1}px, ${cornerShade} ${cornerRadius}px)`,
          }} />
          <div aria-hidden="true" className={cornerClass} style={{
            top: spotlight.top + spotlight.height - cornerRadius,
            left: spotlight.left + spotlight.width - cornerRadius,
            width: cornerRadius,
            height: cornerRadius,
            background: `radial-gradient(circle at 0% 0%, transparent ${cornerRadius - 1}px, ${cornerShade} ${cornerRadius}px)`,
          }} />
          <div
            aria-hidden="true"
            className="pointer-events-none fixed z-[81] rounded-[28px] border border-primary/25 shadow-[0_0_0_3px_rgba(37,99,235,0.045)] transition-[top,left,width,height,opacity] duration-[250ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
            style={{ top: spotlight.top, left: spotlight.left, width: spotlight.width, height: spotlight.height }}
          />
        </>
      ) : (
        <div aria-hidden="true" className="pointer-events-auto fixed inset-0 z-[80] bg-slate-950/12 backdrop-blur-[1px]" />
      )}

      <section
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-label="Guía rápida del primer PDF"
        tabIndex={-1}
        data-first-pdf-guide
        aria-busy={transitioning}
        className={`bg-card border-border fixed z-[90] max-h-[calc(100dvh-24px)] w-[calc(100vw-24px)] overflow-y-auto overscroll-contain rounded-[24px] border p-3.5 shadow-[0_12px_30px_rgba(15,23,42,0.12)] outline-none transition-[top,left,opacity] duration-[250ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none sm:p-4 ${showingProgressDetail ? 'max-w-[360px]' : 'max-w-[320px]'}`}
        style={
          spotlight
            ? { top: spotlight.cardTop, left: spotlight.cardLeft, opacity: 1 }
            : { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0 }
        }
      >
        <div className="flex items-start gap-3">
          <span className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-xl" aria-hidden="true">
            <Icon className="size-4" />
          </span>
          <div key={step + (showingProgressDetail ? '-detail' : '-intro')} data-guide-copy aria-live="polite" className="min-w-0 flex-1">
            <p className="text-primary text-[11px] font-semibold tracking-wide uppercase">
              {number} de 3 · {current.label}
            </p>
            <h2 className="text-foreground mt-0.5 text-[15px] font-semibold leading-5 tracking-tight">
              {title}
            </h2>
            <p className="text-muted-foreground mt-1 text-[12px] leading-5">
              {description}
            </p>
          </div>
          <button
            type="button"
            onClick={onExit}
            aria-label="Saltar guía e ir a estudiar"
            title="Saltar guía"
            className="text-muted-foreground hover:bg-muted focus-visible:outline-ring -mr-1 -mt-1 flex size-9 shrink-0 items-center justify-center rounded-full focus-visible:outline-2"
          >
            <X className="size-4" />
          </button>
        </div>

        {showingProgressDetail && (
          <p data-guide-progress-detail className="text-muted-foreground mt-2 text-[11px] leading-4">
            Mirá los temas de tu PDF en el panel de abajo. Los estados de colores son un ejemplo,
            no son resultados reales.
          </p>
        )}

        <div className={`border-border/70 mt-2.5 border-t pt-2.5 ${step === 'errors'
          ? 'flex flex-col items-stretch gap-2'
          : 'flex items-center justify-between gap-2'}`}>
          <div className="flex items-center gap-1.5" role="img" aria-label={'Paso ' + number + ' de 3'}>
            {order.map((item, index) => (
              <span
                key={item}
                className={
                  'h-1 rounded-full transition-[width,background-color] duration-200 motion-reduce:transition-none ' +
                  (index + 1 === number
                    ? 'bg-primary w-7'
                    : index + 1 < number
                      ? 'bg-primary/40 w-3'
                      : 'bg-primary/15 w-3')
                }
              />
            ))}
          </div>
          <div className={`flex min-w-0 items-center gap-1.5 ${step === 'errors' ? 'justify-between' : ''}`}>
            {onBack ? (
              <Button type="button" variant="ghost" size="sm" onClick={handleBack} disabled={transitioning} className="min-h-9 gap-1 rounded-full px-3">
                <ArrowLeft className="size-3.5" /> Atrás
              </Button>
            ) : null}
            <Button type="button" size="sm" onClick={handleNext} disabled={transitioning} className="min-h-9 min-w-0 gap-1.5 whitespace-normal rounded-full px-3 text-[12px] leading-4 sm:whitespace-nowrap sm:px-4">
              {step === 'errors'
                ? showingProgressDetail ? 'Empezar a estudiar' : 'Ver cómo funciona'
                : 'Siguiente'} <ArrowRight className="size-3.5" />
            </Button>
          </div>
        </div>
      </section>
    </>,
    document.body
  );
}
