'use client';

import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import './practice-motion.css';
import { ArrowLeft, LockKeyhole, X } from 'lucide-react';
import type { PremiumGateReason } from '@/lib/premium-flow';
import { useOptionalAppLocale } from '@/components/i18n/app-locale-provider';

export type FreePracticeLimitKind = Extract<PremiumGateReason,
  'multiple_choice' | 'true_false' | 'matching_round' | 'case' | 'flashcard' | 'simulator' | 'complete' | 'mixed'>;

const modes: Record<FreePracticeLimitKind, { label: string; noun: string; preview: string }> = {
  multiple_choice: { label: 'Opción múltiple', noun: 'preguntas de opción múltiple', preview: 'PREGUNTA 1' },
  true_false: { label: 'Verdadero o falso', noun: 'ejercicios de verdadero o falso', preview: 'PREGUNTA 1' },
  matching_round: { label: 'Unir conceptos', noun: 'rondas de unir conceptos', preview: 'RONDA 1' },
  case: { label: 'Casos prácticos', noun: 'casos prácticos', preview: 'CASO 1' },
  flashcard: { label: 'Flashcards', noun: 'flashcards', preview: 'TARJETA 1' },
  simulator: { label: 'Simulacro', noun: 'simulacros de examen', preview: 'SIMULACRO' },
  complete: { label: 'Completar', noun: 'ejercicios para completar', preview: 'EJERCICIO 1' },
  mixed: { label: 'Mixto', noun: 'prácticas mixtas', preview: 'PRÁCTICA 1' },
};

const modesEnglish: typeof modes = {
  multiple_choice: { label: 'Multiple choice', noun: 'multiple-choice questions', preview: 'QUESTION 1' },
  true_false: { label: 'True or false', noun: 'true-or-false exercises', preview: 'QUESTION 1' },
  matching_round: { label: 'Match concepts', noun: 'concept-matching rounds', preview: 'ROUND 1' },
  case: { label: 'Case studies', noun: 'practical cases', preview: 'CASE 1' },
  flashcard: { label: 'Flashcards', noun: 'flashcards', preview: 'CARD 1' },
  simulator: { label: 'Mock exam', noun: 'mock exams', preview: 'MOCK EXAM' },
  complete: { label: 'Fill in the blanks', noun: 'fill-in-the-blank exercises', preview: 'EXERCISE 1' },
  mixed: { label: 'Mixed', noun: 'mixed practice sessions', preview: 'PRACTICE 1' },
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
  const english = useOptionalAppLocale() === 'en';
  const t = (es: string, en: string) => english ? en : es;
  const localizedBackLabel = english && backLabel === 'Volver' ? 'Back' : backLabel;
  const [mounted, setMounted] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const transitionTimer = useRef<number | null>(null);
  const fitViewport = useRef<HTMLDivElement>(null);
  const fitContent = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(1);
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

  // Fit the WHOLE screen including the CTAs into the space below the header.
  // Reduce spacing first; scale only as needed on zoomed or short viewports.
  useLayoutEffect(() => {
    if (!mounted) return;
    const viewport = fitViewport.current;
    const content = fitContent.current;
    if (!viewport || !content) return;
    const fit = () => {
      const height = content.scrollHeight;
      const width = content.scrollWidth;
      if (!height || !width || !viewport.clientHeight || !viewport.clientWidth) return;
      const next = Math.min(1,
        (viewport.clientHeight - 8) / height,
        (viewport.clientWidth - 8) / width);
      const safe = Math.max(0.1, next);
      setFitScale(current => Math.abs(current - safe) < 0.005 ? current : safe);
    };
    const observer = new ResizeObserver(fit);
    observer.observe(viewport);
    observer.observe(content);
    fit();
    return () => observer.disconnect();
  }, [mounted, kind, materialTitle, topicLabel, backLabel]);

  const mode = (english ? modesEnglish : modes)[kind];
  const place = topicLabel || materialTitle || t('Tu material', 'Your material');

  // Reuse the 280ms entrance / 200ms departure from the practice flow.
  const transitionOut = (navigate: () => void) => {
    if (leaving) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      navigate();
      return;
    }
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
      className="fixed inset-0 z-[200] h-dvh w-full overflow-hidden bg-white font-sans text-[#0f1623]">
      <div data-free-practice-limit-transition className={`flex h-full min-h-0 w-full flex-col overflow-hidden ${leaving ? 'practice-screen-leave' : 'practice-screen-enter'}`}>
      <header className="flex min-h-[54px] shrink-0 items-center justify-between gap-2 border-b border-[#e8ecf2] px-3 py-2 sm:min-h-[60px] sm:gap-3 sm:px-8">
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
          <Image src="/evaluo-logo-icono.svg" alt="" width={28} height={28} className="size-6 sm:size-7"/>
          <span className="text-cuerpo font-semibold tracking-[-.01em] sm:text-subtitulo">Evaluo</span>
        </div>
        <span className="min-w-0 flex-1 truncate text-center text-etiqueta font-semibold text-[#344054] sm:max-w-[42vw] sm:text-cuerpo">
          {t('Práctica', 'Practice')} · {place}
        </span>
        {backControl(
          'flex size-11 shrink-0 items-center justify-center rounded-full border border-[#e8ecf2] bg-white transition-colors hover:bg-[#f7faff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3c6cba]',
          <X className="size-[18px] text-[#344054]" aria-hidden="true"/>, t('Cerrar y ', 'Close and ') + localizedBackLabel.toLowerCase(),
        )}
      </header>

      <main className="flex min-h-0 w-full flex-1 flex-col px-3 py-2 sm:px-6 sm:py-3">
        <div ref={fitViewport} data-free-practice-fit-viewport className="relative min-h-0 w-full flex-1 overflow-hidden">
          <div ref={fitContent} data-free-practice-fit-content
            className="absolute left-1/2 top-1/2 flex w-full max-w-[460px] flex-col items-center text-center"
            style={{ transform: `translate(-50%, -50%) scale(${fitScale})`, transformOrigin: 'center center' }}>
        <section className="flex w-full flex-col items-center text-center">
          <Image src="/evi-practica-limite.svg" width={104} height={104} alt={t('Evi con un candado', 'Evi with a padlock')} className="size-[72px] shrink-0"/>
          <h1 id="free-practice-limit-title" className="mt-1.5 text-titulo font-bold leading-[1.16] tracking-titulo sm:text-destacado">
            {t('Ya agotaste tu límite gratuito', 'You have reached your Free limit')}
          </h1>

          <div className="mt-2.5 flex max-w-full flex-wrap justify-center gap-2">
            {[mode.label, place].map((tag,index) =>
              <span key={index} className="max-w-[210px] truncate rounded-full border border-[#d0d5dd] bg-white px-3 py-1 text-etiqueta font-medium text-[#344054]">{tag}</span>
            )}
          </div>

          <div className="relative mt-3.5 w-full pb-[12px]" aria-label={t('Vista previa bloqueada de la práctica','Locked practice preview')}>
            <div aria-hidden="true" className="absolute inset-x-7 bottom-0 top-5 rounded-[20px] border border-[#cfdcf5] bg-[#e3ecfb]"/>
            <div aria-hidden="true" className="absolute bottom-[6px] left-[14px] right-[14px] top-3 rounded-[20px] border border-[#cfdcf5] bg-[#eef4ff]"/>
            <div className="relative overflow-hidden rounded-[20px] border border-[#cfdcf5] bg-gradient-to-b from-[#f3f7ff] via-white to-white px-4 pb-3 pt-3 text-left shadow-[0_8px_24px_rgba(20,60,140,0.10)] sm:px-5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-etiqueta font-semibold tracking-etiqueta text-[#344054]">{mode.preview}</span>
                <span className="max-w-[140px] truncate rounded-full bg-[#eaf0fb] px-2.5 py-1 text-etiqueta font-semibold text-[#2a5193]">
                  {topicLabel ?? t('Tu material','Your material')}
                </span>
              </div>
              <div aria-hidden="true" className="mt-2.5 flex select-none flex-col gap-2 blur-[5px]">
                <p className="text-ui font-semibold leading-[1.3] tracking-titulo">{t('¿Qué concepto del material corresponde a este ejercicio?', 'Which concept from your material matches this exercise?')}</p>
                {(english ? ['First answer','Second answer'] : ['Primera respuesta', 'Segunda respuesta']).map((answer,index) =>
                  <div key={answer} className="flex items-center gap-2.5 rounded-xl border-[1.5px] border-[#d0d5dd] bg-white px-3 py-1.5 text-chico">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#f2f4f7] text-etiqueta font-semibold">{index===0?'A':'B'}</span>
                    {answer}
                  </div>
                )}
              </div>
              <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 top-11 bg-gradient-to-b from-white/15 to-white/70"/>
              <span className="absolute left-1/2 top-[62%] inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-[#cfdcf5] bg-white py-1.5 pl-2 pr-3.5 text-chico font-semibold shadow-[0_10px_26px_rgba(20,60,140,0.18)] sm:text-cuerpo">
                <span className="flex size-6 items-center justify-center rounded-full bg-[#3c6cba] text-white"><LockKeyhole className="size-[15px]"/></span>
                {t('Se desbloquea con Premium','Unlock with Premium')}
              </span>
            </div>
          </div>

          <p className="mt-3 max-w-[440px] text-chico leading-[1.5] text-[#4b5565] sm:text-ui">
            {english
              ? `You have used all your Free ${mode.noun}. You can repeat previously unlocked activities or keep practicing with Premium.`
              : `Ya agotaste el cupo de ${mode.noun} del plan gratis. Podés repetir las actividades desbloqueadas o seguir practicando con Premium.`}
          </p>

          <div className="mt-3 flex w-full flex-col items-stretch justify-center gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2.5">
            <Link href={premiumHref} onClick={event => onLinkClick(event, premiumHref)} aria-disabled={leaving}
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2.5 rounded-full bg-[#3c6cba] px-5 text-ui font-semibold text-white shadow-[0_8px_20px_rgba(11,99,229,0.28)] sm:w-auto hover:bg-[#2a5193] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3c6cba]">
              {t('Practicar con ', 'Practice with ')}<span className="rounded-full bg-white px-2.5 py-[3px] text-etiqueta font-semibold tracking-[.04em] text-[#2a5193]">PREMIUM</span>
            </Link>
            {backControl(
              'inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full border-[1.5px] border-[#d0d5dd] bg-white px-5 text-ui font-semibold text-[#0f1623] hover:bg-[#f7faff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3c6cba] sm:w-auto sm:text-cuerpo',
              <><ArrowLeft className="size-[18px]" aria-hidden="true"/>{localizedBackLabel}</>,
            )}
          </div>
        </section>
        <p data-free-practice-secondary-note className="mt-3 max-w-[440px] text-center text-etiqueta leading-[1.45] text-[#667085]">
          {t('Tus resúmenes, glosario y ejercicios desbloqueados siguen disponibles.','Your summaries, glossary and previously unlocked exercises remain available.')}
        </p>
          </div>
        </div>
      </main>
      </div>
    </div>, document.body
  );
}
