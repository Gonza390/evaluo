'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Sparkles, type LucideIcon } from 'lucide-react';

export type Diapositiva = {
  id: string;
  title: string;
  description: string;
  /** Contenido libre de la vista previa (se muestra en un recuadro de alto fijo). */
  preview: ReactNode;
  cta: { label: string; href: string; onClick?: () => void };
};

type Props = {
  titulo: string;
  icono?: LucideIcon;
  slides: Diapositiva[];
  className?: string;
  locale?: 'es' | 'en';
  /** Milisegundos entre diapositivas; 0 desactiva el avance automático. */
  intervalo?: number;
};

/**
 * Tarjeta con diapositivas de una en una: flechas + "1/3" + CTA.
 * En pantallas táctiles también se pasa deslizando. Con una sola diapositiva no muestra flechas.
 * Usos: "Descubrí" en la home; pensado también para Practicar y Mejorar mi plan.
 */
export function Diapositivas({ titulo, icono: Icono = Sparkles, slides, className = '', locale = 'es', intervalo = 6000 }: Props) {
  const en = locale === 'en';
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  // Cambia en cada avance manual para reiniciar el temporizador.
  const [manualTick, setManualTick] = useState(0);
  const touchStart = useRef<number | null>(null);
  const total = slides.length;

  // Avance automático: se pausa con el mouse encima, con el foco adentro, al tocar,
  // con la pestaña oculta y con "reducir movimiento".
  useEffect(() => {
    if (total < 2 || intervalo <= 0 || paused) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') setIndex((value) => (value + 1) % total);
    }, intervalo);
    return () => window.clearInterval(id);
  }, [total, intervalo, paused, manualTick]);

  if (total === 0) return null;
  const current = slides[Math.min(index, total - 1)];
  const go = (delta: number) => {
    setIndex((value) => (value + delta + total) % total);
    setManualTick((value) => value + 1);
  };

  return (
    <section
      aria-roledescription={en ? 'carousel' : 'carrusel'}
      aria-label={titulo}
      className={`rounded-2xl border border-slate-200 bg-white p-4 ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false);
      }}
      onTouchStart={(event) => {
        setPaused(true);
        touchStart.current = event.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        const start = touchStart.current;
        touchStart.current = null;
        const end = event.changedTouches[0]?.clientX;
        if (start === null || end === undefined || total < 2) return;
        if (Math.abs(end - start) > 40) go(end < start ? 1 : -1);
      }}
    >
      <h2 className="flex items-center gap-2 text-ui font-semibold tracking-[-0.01em] text-slate-950">
        <Icono className="size-4" aria-hidden="true" />
        {titulo}
      </h2>

      <div aria-live="polite" aria-atomic="true" className="evaluo-enter" key={current.id}>
        <div className="mt-3 text-ui font-semibold text-slate-950">{current.title}</div>
        <div className="mt-0.5 min-h-[36px] text-chico leading-normal text-slate-500">{current.description}</div>
        <div className="mt-3 flex h-[168px] items-center justify-center overflow-hidden rounded-[14px] bg-slate-100/80 px-3.5">
          <div className="w-full rounded-xl border border-slate-200/70 bg-white px-3.5 py-3">{current.preview}</div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        {total > 1 ? (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label={en ? 'Previous slide' : 'Diapositiva anterior'}
              className="inline-flex size-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50"
            >
              <ChevronLeft className="size-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label={en ? 'Next slide' : 'Diapositiva siguiente'}
              className="inline-flex size-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50"
            >
              <ChevronRight className="size-3.5" aria-hidden="true" />
            </button>
            <span className="ml-1 text-chico text-slate-500">
              {index + 1}/{total}
            </span>
          </div>
        ) : (
          <span />
        )}
        <Link
          href={current.cta.href}
          onClick={current.cta.onClick}
          className="text-chico font-semibold text-slate-950 underline underline-offset-4"
        >
          {current.cta.label}
        </Link>
      </div>
    </section>
  );
}
