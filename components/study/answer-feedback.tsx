'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Bookmark, Check, FileText, X } from 'lucide-react';
import { useOptionalAppLocale } from '@/components/i18n/app-locale-provider';
import { cn } from '@/lib/utils';

/**
 * Corrección de una respuesta con una sola explicación (diseño "opción B").
 * Se usa en todos los lugares donde explicamos una respuesta del apunte:
 * práctica, casos y práctica mixta. No genera texto nuevo: muestra la
 * explicación que ya viene con la pregunta.
 */
export function AnswerFeedback({
  correct,
  chosen,
  explanation,
  page,
  pdfHref,
  savedToErrors = false,
  actions,
  className,
}: {
  correct: boolean;
  /** Lo que eligió el estudiante (solo se muestra si se equivocó). */
  chosen?: string | null;
  explanation?: string | null;
  /** Texto de la fuente: "Página 6", "Páginas 6–7" o el título de la sección. */
  page?: string | null;
  pdfHref?: string | null;
  /** Mostrar "La guardamos en Mis errores" solo si el error se guarda de verdad. */
  savedToErrors?: boolean;
  actions?: ReactNode;
  className?: string;
}) {
  const english = useOptionalAppLocale() === 'en';
  const text = explanation?.trim() ?? '';
  const chosenText = chosen?.trim() ?? '';

  return (
    <div className={className}>
      <section
        data-answer-feedback={correct ? 'correct' : 'wrong'}
        aria-live="polite"
        className={cn(
          'rounded-2xl px-4 py-4 sm:px-6 sm:py-5',
          correct ? 'bg-emerald-50/70' : 'bg-muted/70'
        )}
      >
        {correct ? (
          <p className="text-ui inline-flex items-center gap-2 font-semibold text-emerald-700">
            <Check className="size-4" aria-hidden="true" />
            {english ? 'Correct!' : '¡Bien!'}
          </p>
        ) : (
          <p className="text-ui text-destructive inline-flex items-start gap-2 font-semibold">
            <X className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span className="break-words">
              {chosenText
                ? english
                  ? `It wasn't “${chosenText}”`
                  : `No era «${chosenText}»`
                : english
                  ? 'Not quite'
                  : 'No era esa'}
            </span>
          </p>
        )}
        {!correct && text ? (
          <p className="text-foreground/80 text-cuerpo mt-2 max-w-[75ch] leading-7 break-words whitespace-pre-line">
            {text}
          </p>
        ) : null}
        {(page || actions) && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            {page && !correct ? (
              <div className="text-chico text-foreground/80 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="inline-flex items-center gap-2">
                  <FileText className="text-primary size-4" aria-hidden="true" />
                  {english ? `${page} of your notes` : `${page} de tu apunte`}
                </span>
                {pdfHref ? (
                  <Link
                    href={pdfHref}
                    className="text-primary inline-flex min-h-10 items-center font-semibold hover:underline"
                  >
                    {english ? 'View in my PDF →' : 'Ver en mi PDF →'}
                  </Link>
                ) : null}
              </div>
            ) : (
              <span />
            )}
            {actions ? <div className="ml-auto flex items-center gap-2">{actions}</div> : null}
          </div>
        )}
      </section>
      {!correct && savedToErrors ? (
        <p className="text-chico text-muted-foreground mt-3 flex items-center justify-center gap-2">
          <Bookmark className="size-3.5" aria-hidden="true" />
          {english
            ? 'We saved it in My mistakes to review later.'
            : 'La guardamos en Mis errores para repasarla después.'}
        </p>
      ) : null}
    </div>
  );
}

/** Estilo de una opción ya corregida: la elegida en rojo, la correcta en verde. */
export function answeredOptionClass(state: 'correct' | 'wrong' | 'other') {
  if (state === 'correct') return 'border-emerald-500 bg-emerald-50 text-foreground';
  if (state === 'wrong') return 'border-destructive bg-destructive/5 text-foreground';
  return 'border-border bg-card text-muted-foreground';
}
