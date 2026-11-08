'use client';

import { useRef, useState, type ReactNode } from 'react';
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
};

/**
 * Tarjeta con diapositivas de una en una: flechas + "1/3" + CTA.
 * En pantallas táctiles también se pasa deslizando. Con una sola diapositiva no muestra flechas.
 * Usos: "Descubrí" en la home; pensado también para Practicar y Mejorar mi plan.
 */
export function Diapositivas({ titulo, icono: Icono = Sparkles, slides, className = '', locale = 'es' }: Props) {
  const en = locale === 'en';
  const [index, setIndex] = useState(0);
  const touchStart = useRef<number | null>(null);
  const total = slides.length;
  if (total === 0) return null;
  const current = slides[Math.min(index, total - 1)];
  const go = (delta: number) => setIndex((value) => (value + delta + total) % total);

  return (
    <section
      aria-roledescription={en ? 'carousel' : 'carrusel'}
      aria-label={titulo}
      className={`rounded-[20px] border border-slate-200 bg-white p-5 ${className}`}
      onTouchStart={(event) => {
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
      <h2 className="flex items-center gap-2 text-subtitulo font-semibold tracking-titulo text-slate-950">
        <Icono className="size-[18px]" aria-hidden="true" />
        {titulo}
      </h2>

      <div aria-live="polite" aria-atomic="true" className="evaluo-enter" key={current.id}>
        <div className="mt-3.5 text-cuerpo font-semibold tracking-[-0.02em] text-slate-950">{current.title}</div>
        <div className="mt-1 min-h-[39px] text-ui leading-[1.5] text-slate-500">{current.description}</div>
        <div className="mt-4 flex h-[210px] items-center justify-center overflow-hidden rounded-[18px] bg-slate-100/80 px-[18px]">
          <div className="w-full rounded-[14px] border border-slate-200/70 bg-white px-4 py-3.5">{current.preview}</div>
        </div>
      </div>

      <div className="mt-3.5 flex items-center justify-between">
        {total > 1 ? (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label={en ? 'Previous slide' : 'Diapositiva anterior'}
              className="inline-flex size-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50"
            >
              <ChevronLeft className="size-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label={en ? 'Next slide' : 'Diapositiva siguiente'}
              className="inline-flex size-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50"
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
          className="text-ui font-semibold text-slate-950 underline underline-offset-4"
        >
          {current.cta.label}
        </Link>
      </div>
    </section>
  );
}
