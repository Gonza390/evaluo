'use client';

import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import './practice-motion.css';
import { ArrowLeft, FileText, LockKeyhole, X } from 'lucide-react';
import { useOptionalAppLocale } from '@/components/i18n/app-locale-provider';
import { trackMarketingEvent } from '@/lib/marketing-analytics';

type Props = {
  /** PDF o Word que el alumno acaba de elegir. */
  fileName: string;
  fileSizeBytes?: number;
  premiumHref: string;
  /** Instante en que se libera el próximo apunte gratis (día 1 del mes). */
  nextAvailableAt: Date;
  onBack: () => void;
};

function formatSize(bytes: number | undefined, english: boolean) {
  if (!bytes || bytes <= 0) return null;
  const mb = bytes / (1024 * 1024);
  const value = mb >= 1 ? mb.toFixed(1) : (bytes / 1024).toFixed(0);
  return (english ? value : value.replace('.', ',')) + (mb >= 1 ? ' MB' : ' KB');
}

/** Límite Free de apuntes: misma composición que FreePracticeLimitScreen.
 * Se muestra después de elegir el archivo, sólo ante un rechazo verificado
 * del cupo mensual (nunca por errores de red o del servidor).
 */
export function FreeUploadLimitScreen({
  fileName, fileSizeBytes, premiumHref, nextAvailableAt, onBack,
}: Props) {
  const router = useRouter();
  const english = useOptionalAppLocale() === 'en';
  const t = (es: string, en: string) => english ? en : es;
  const [mounted, setMounted] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const transitionTimer = useRef<number | null>(null);
  const fitViewport = useRef<HTMLDivElement>(null);
  const fitContent = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(1);

  useEffect(() => {
    setMounted(true);
    trackMarketingEvent('premium_gate_viewed', { source: 'free_v2_material_upload_limit' });
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

  // Toda la pantalla, botones incluidos, entra debajo del encabezado.
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
  }, [mounted, fileName]);

  const transitionOut = (navigate: () => void) => {
    if (leaving) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      navigate();
      return;
    }
    setLeaving(true);
    transitionTimer.current = window.setTimeout(navigate, 150);
  };
  const back = () => transitionOut(onBack);
  const onPremiumClick = (event: MouseEvent<HTMLAnchorElement>) => {
    trackMarketingEvent('premium_cta_clicked', { source: 'free_v2_material_upload_limit' });
    if (event.defaultPrevented || event.button !== 0 || event.metaKey ||
      event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    transitionOut(() => router.push(premiumHref));
  };

  if (!mounted) return null;

  const size = formatSize(fileSizeBytes, english);
  const nextDate = new Intl.DateTimeFormat(english ? 'en-US' : 'es-AR', {
    day: 'numeric', month: 'long', timeZone: 'America/Argentina/Buenos_Aires',
  }).format(nextAvailableAt);
  const lockedTools = english
    ? ['Topic summary', 'Glossary', 'Flashcards', 'Practice and mock exam']
    : ['Resumen por tema', 'Glosario', 'Flashcards', 'Práctica y simulacro'];

  return createPortal(
    <div data-free-upload-limit role="dialog" aria-modal="true" aria-labelledby="free-upload-limit-title"
      className="fixed inset-0 z-[200] h-dvh w-full overflow-hidden bg-white font-sans text-[#0f1623]">
      <div className={`flex h-full min-h-0 w-full flex-col overflow-hidden ${leaving ? 'practice-screen-leave' : 'practice-screen-enter'}`}>
        <header className="flex min-h-[54px] shrink-0 items-center justify-between gap-2 border-b border-[#e8ecf2] px-3 py-2 sm:min-h-[60px] sm:gap-3 sm:px-8">
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
            <Image src="/evaluo-logo-icono.svg" alt="" width={28} height={28} className="size-6 sm:size-7"/>
            <span className="text-[16px] font-bold tracking-[-.01em] sm:text-[18px]">Evaluo</span>
          </div>
          <span className="min-w-0 flex-1 truncate text-center text-[11px] font-semibold text-[#344054] sm:max-w-[42vw] sm:text-[15px]">
            {t('Subir apunte', 'Upload material')}
          </span>
          <button type="button" onClick={back} disabled={leaving}
            aria-label={t('Cerrar y volver', 'Close and go back')}
            className="flex size-11 shrink-0 items-center justify-center rounded-full border border-[#e8ecf2] bg-white transition-colors hover:bg-[#f7faff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3c6cba]">
            <X className="size-[18px] text-[#344054]" aria-hidden="true"/>
          </button>
        </header>

        <main className="flex min-h-0 w-full flex-1 flex-col px-3 py-2 sm:px-6 sm:py-3">
          <div ref={fitViewport} className="relative min-h-0 w-full flex-1 overflow-hidden">
            <div ref={fitContent}
              className="absolute left-1/2 top-1/2 flex w-full max-w-[460px] flex-col items-center text-center"
              style={{ transform: `translate(-50%, -50%) scale(${fitScale})`, transformOrigin: 'center center' }}>
              <section className="flex w-full flex-col items-center text-center">
                <Image src="/evi-practica-limite.svg" width={104} height={104} alt={t('Evi con un candado', 'Evi with a padlock')} className="size-[72px] shrink-0"/>
                <h1 id="free-upload-limit-title" className="mt-1.5 text-[23px] font-bold leading-[1.16] tracking-[-.03em] sm:text-[27px]">
                  {t('Ya usaste tu apunte gratis del mes', 'You have used this month’s free upload')}
                </h1>

                <div className="mt-2.5 flex max-w-full flex-wrap justify-center gap-2">
                  {[t('Apunte nuevo', 'New material'), fileName].map((tag, index) =>
                    <span key={index} className="max-w-[210px] truncate rounded-full border border-[#d0d5dd] bg-white px-3 py-1 text-[11px] font-medium text-[#344054]">{tag}</span>
                  )}
                </div>

                <div className="relative mt-3.5 w-full pb-[12px]" aria-label={t('Vista previa bloqueada del apunte', 'Locked preview of your material')}>
                  <div aria-hidden="true" className="absolute inset-x-7 bottom-0 top-5 rounded-[20px] border border-[#cfdcf5] bg-[#e3ecfb]"/>
                  <div aria-hidden="true" className="absolute bottom-[6px] left-[14px] right-[14px] top-3 rounded-[20px] border border-[#cfdcf5] bg-[#eef4ff]"/>
                  <div className="relative overflow-hidden rounded-[20px] border border-[#cfdcf5] bg-gradient-to-b from-[#f3f7ff] via-white to-white px-4 pb-3 pt-3 text-left shadow-[0_8px_24px_rgba(20,60,140,0.10)] sm:px-5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] font-bold tracking-[.16em] text-[#344054]">{t('TU ARCHIVO', 'YOUR FILE')}</span>
                      {size ? <span className="rounded-full bg-[#eaf0fb] px-2.5 py-1 text-[11px] font-semibold text-[#2a5193]">{size}</span> : null}
                    </div>
                    <div className="mt-2.5 flex items-center gap-2.5 rounded-xl border-[1.5px] border-[#d0d5dd] bg-white px-3 py-2">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#eaf0fb]">
                        <FileText className="size-4 text-[#2a5193]" aria-hidden="true"/>
                      </span>
                      <span className="min-w-0 truncate text-[13px] font-semibold">{fileName}</span>
                    </div>
                    <div aria-hidden="true" className="mt-2 grid select-none grid-cols-2 gap-2 blur-[5px]">
                      {lockedTools.map(tool =>
                        <span key={tool} className="rounded-xl border-[1.5px] border-[#d0d5dd] bg-white px-2.5 py-1.5 text-[12px]">{tool}</span>
                      )}
                    </div>
                    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 top-[92px] bg-gradient-to-b from-white/15 to-white/70"/>
                    <span className="absolute left-1/2 top-[74%] inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-[#cfdcf5] bg-white py-1.5 pl-2 pr-3.5 text-[12px] font-semibold shadow-[0_10px_26px_rgba(20,60,140,0.18)] sm:text-[14px]">
                      <span className="flex size-6 items-center justify-center rounded-full bg-[#3c6cba] text-white"><LockKeyhole className="size-[15px]"/></span>
                      {t('Se desbloquea con Premium', 'Unlock with Premium')}
                    </span>
                  </div>
                </div>

                <p className="mt-3 max-w-[440px] text-[12px] leading-[1.5] text-[#4b5565] sm:text-[13px]">
                  {english
                    ? `Your next free upload is available on ${nextDate}. With Premium you can study this file now and upload up to 3 new materials per day.`
                    : `El ${nextDate} podés subir otro apunte gratis. Con Premium estudiás este ahora y subís hasta 3 apuntes nuevos por día.`}
                </p>

                <div className="mt-3 flex w-full flex-col items-stretch justify-center gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2.5">
                  <Link href={premiumHref} onClick={onPremiumClick} aria-disabled={leaving}
                    className="inline-flex min-h-[44px] w-full items-center justify-center gap-2.5 rounded-full bg-[#3c6cba] px-5 text-[13px] font-semibold text-white shadow-[0_8px_20px_rgba(11,99,229,0.28)] hover:bg-[#2a5193] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3c6cba] sm:w-auto">
                    {t('Estudiar este PDF con ', 'Study this file with ')}<span className="rounded-full bg-white px-2.5 py-[3px] text-[11px] font-bold tracking-[.04em] text-[#2a5193]">PREMIUM</span>
                  </Link>
                  <button type="button" onClick={back} disabled={leaving}
                    className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full border-[1.5px] border-[#d0d5dd] bg-white px-5 text-[13px] font-semibold text-[#0f1623] hover:bg-[#f7faff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3c6cba] sm:w-auto sm:text-[14px]">
                    <ArrowLeft className="size-[18px]" aria-hidden="true"/>{t('Volver', 'Back')}
                  </button>
                </div>
              </section>
              <p className="mt-3 max-w-[440px] text-center text-[11px] leading-[1.45] text-[#667085]">
                {t('Tus apuntes anteriores, con sus resúmenes y prácticas, siguen disponibles.',
                  'Your previous materials, summaries and practice remain available.')}
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>, document.body
  );
}
