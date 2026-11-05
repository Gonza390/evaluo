'use client';

import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import './practice-motion.css';
import { ArrowLeft, LockKeyhole, X } from 'lucide-react';
import type { PremiumGateReason } from '@/lib/premium-flow';

export type FreePracticeLimitKind = Extract<PremiumGateReason,
  'multiple_choice' | 'true_false' | 'matching_round' | 'case' | 'flashcard' | 'simulator'>;

const modes: Record<FreePracticeLimitKind, { label: string; noun: string; preview: string }> = {
  multiple_choice: { label: 'Opción múltiple', noun: 'preguntas de opción múltiple', preview: 'PREGUNTA 1' },
  true_false: { label: 'Verdadero o falso', noun: 'ejercicios de verdadero o falso', preview: 'PREGUNTA 1' },
  matching_round: { label: 'Unir conceptos', noun: 'rondas de unir conceptos', preview: 'RONDA 1' },
  case: { label: 'Casos prácticos', noun: 'casos prácticos', preview: 'CASO 1' },
  flashcard: { label: 'Flashcards', noun: 'flashcards', preview: 'TARJETA 1' },
  simulator: { label: 'Simulacro', noun: 'simulacros de examen', preview: 'SIMULACRO' },
};

type Props = {
  kind: FreePracticeLimitKind;
  premiumHref: string;
  backHref: string;
  backLabel?: string;
  materialTitle?: string;
  topicLabel?: string;
  /** For limits reached while studying within a tab, go back without losing the page. */
  onBack?: () => void;
};

/** Exact centered composition of the supplied "Práctica lista · base" HTML.
 * Only message, contextual labels and destinations vary per exhausted Free quota.
 * Must be shown only after a verified denial, never for AI/content/network errors.
 */
export function FreePracticeLimitScreen({
  kind, premiumHref, backHref, backLabel = 'Volver', materialTitle, topicLabel, onBack,
}: Props) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const transitionTimer = useRef<number | null>(null);
  useEffect(() => {
    setMounted(true);
    return () => {
      if (transitionTimer.current !== null) window.clearTimeout(transitionTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [mounted]);

  const mode = modes[kind];
  const place = topicLabel || materialTitle || 'Tu material';

  // Reuse the 280ms entrance / 200ms departure from the practice flow.
  const transitionOut = (navigate: () => void) => {
    if (leaving) return;
    setLeaving(true);
    transitionTimer.current = window.setTimeout(navigate, 200);
  };
  const onLinkClick = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey ||
      event.ctrlKey || event.shiftKey || event.altKey ||
      event.currentTarget.target === '_blank') return;
    event.preventDefault();
    transitionOut(() => router.push(href));
  };
  const backControl = (className: string, children: ReactNode, ariaLabel?: string) =>
    onBack
      ? <button type="button" onClick={() => transitionOut(onBack)} disabled={leaving}
          className={className} aria-label={ariaLabel}>{children}</button>
      : <Link href={backHref} onClick={event => onLinkClick(event, backHref)}
          className={className} aria-label={ariaLabel} aria-disabled={leaving}>{children}</Link>;

  if (!mounted) return null;

  return createPortal(
    <div data-free-practice-limit role="dialog" aria-modal="true" aria-labelledby="free-practice-limit-title"
      className="fixed inset-0 z-[200] h-dvh w-full overflow-y-auto bg-white font-sans text-[#0f1623]">
      <div data-free-practice-limit-transition className={`flex min-h-full w-full flex-col ${leaving ? 'practice-screen-leave' : 'practice-screen-enter'}`}>
      <header className="flex min-h-[72px] shrink-0 items-center justify-between gap-3 border-b border-[#e8ecf2] px-4 py-3 sm:px-10 sm:py-[14px]">
        <div className="flex shrink-0 items-center gap-2.5">
          <Image src="/evaluo-logo-icono.svg" alt="" width={28} height={28} className="size-7"/>
          <span className="text-[18px] font-bold tracking-[-.01em]">Evaluo</span>
        </div>
        <span className="min-w-0 max-w-[42vw] truncate text-center text-[12px] font-semibold text-[#344054] sm:text-[15px]">
          Práctica · {place}
        </span>
        {backControl(
          'flex size-11 shrink-0 items-center justify-center rounded-full border border-[#e8ecf2] bg-white transition-colors hover:bg-[#f7faff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b63e5]',
          <X className="size-[18px] text-[#344054]" aria-hidden="true"/>, 'Cerrar y ' + backLabel.toLowerCase(),
        )}
      </header>

      <main className="flex min-h-0 w-full flex-1 flex-col items-center justify-center px-4 py-6 sm:px-6 sm:py-8">
        <section className="flex w-full max-w-[520px] flex-col items-center text-center">
          <Image src="/evi-practica-limite.svg" width={104} height={104} alt="Evi con un candado" className="size-[104px] shrink-0"/>
          <h1 id="free-practice-limit-title" className="mt-2 text-[27px] font-bold leading-[1.15] tracking-[-.03em] sm:text-[32px]">
            Ya agotaste tu límite gratuito
          </h1>

          <div className="mt-3 flex max-w-full flex-wrap justify-center gap-2">
            {[mode.label, place].map((tag,index) =>
              <span key={index} className="max-w-[250px] truncate rounded-full border border-[#d0d5dd] bg-white px-3 py-1.5 text-[13px] font-medium text-[#344054]">{tag}</span>
            )}
          </div>

          <div className="relative mt-5 w-full pb-[18px]" aria-label="Vista previa bloqueada de la práctica">
            <div aria-hidden="true" className="absolute inset-x-7 bottom-0 top-6 rounded-[20px] border border-[#cfdcf5] bg-[#e3ecfb]"/>
            <div aria-hidden="true" className="absolute bottom-[9px] left-[14px] right-[14px] top-4 rounded-[20px] border border-[#cfdcf5] bg-[#eef4ff]"/>
            <div className="relative overflow-hidden rounded-[20px] border border-[#cfdcf5] bg-gradient-to-b from-[#f3f7ff] via-white to-white px-4 pb-[18px] pt-4 text-left shadow-[0_8px_24px_rgba(20,60,140,0.10)] sm:px-5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-bold tracking-[.18em] text-[#344054]">{mode.preview}</span>
                <span className="max-w-[140px] truncate rounded-full bg-[#eaf0fb] px-2.5 py-1 text-[12px] font-semibold text-[#084bb0]">
                  {topicLabel ?? 'Tu material'}
                </span>
              </div>
              <div aria-hidden="true" className="mt-3 flex select-none flex-col gap-2.5 blur-[5px]">
                <p className="text-[17px] font-bold leading-[1.3] tracking-[-.02em]">¿Qué concepto del material corresponde a este ejercicio?</p>
                {['Primera respuesta', 'Segunda respuesta'].map((answer,index) =>
                  <div key={answer} className="flex items-center gap-3 rounded-xl border-[1.5px] border-[#d0d5dd] bg-white px-3 py-2 text-[14px]">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#f2f4f7] text-[12px] font-bold">{index===0?'A':'B'}</span>
                    {answer}
                  </div>
                )}
              </div>
              <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 top-11 bg-gradient-to-b from-white/15 to-white/70"/>
              <span className="absolute left-1/2 top-[62%] inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-2.5 whitespace-nowrap rounded-full border border-[#cfdcf5] bg-white py-[9px] pl-2.5 pr-[18px] text-[13px] font-semibold shadow-[0_10px_26px_rgba(20,60,140,0.18)] sm:text-[14px]">
                <span className="flex size-7 items-center justify-center rounded-full bg-[#0b63e5] text-white"><LockKeyhole className="size-[15px]"/></span>
                Se desbloquea con Premium
              </span>
            </div>
          </div>

          <p className="mt-[14px] max-w-[500px] text-[14px] leading-[1.55] text-[#4b5565] sm:text-[15px]">
            Ya agotaste tu cupo de {mode.noun} del plan gratis. Podés repetir las actividades que ya desbloqueaste. Con Premium accedés a nuevas prácticas.
          </p>

          <div className="mt-[18px] flex w-full flex-wrap items-center justify-center gap-3">
            <Link href={premiumHref} onClick={event => onLinkClick(event, premiumHref)} aria-disabled={leaving}
              className="inline-flex min-h-[52px] items-center justify-center gap-3 rounded-full bg-[#0b63e5] px-7 text-[16px] font-semibold text-white shadow-[0_8px_20px_rgba(11,99,229,0.28)] hover:bg-[#084bb0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b63e5]">
              Practicar con <span className="rounded-full bg-white px-2.5 py-[3px] text-[12px] font-bold tracking-[.04em] text-[#084bb0]">PREMIUM</span>
            </Link>
            {backControl(
              'inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-full border-[1.5px] border-[#d0d5dd] bg-white px-7 text-[15px] font-semibold text-[#0f1623] hover:bg-[#f7faff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b63e5] sm:text-[16px]',
              <><ArrowLeft className="size-[18px]" aria-hidden="true"/>{backLabel}</>,
            )}
          </div>
        </section>
        <p className="mt-3 max-w-[520px] text-center text-[13px] leading-5 text-[#667085]">
          El límite gratuito ya se agotó para esta modalidad. Tus resúmenes, glosario y ejercicios desbloqueados siguen disponibles.
        </p>
      </main>
      </div>
    </div>, document.body
  );
}
