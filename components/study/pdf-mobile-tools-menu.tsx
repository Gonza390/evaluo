'use client';

import { useEffect, useRef, useState } from 'react';
import { Ellipsis, ExternalLink, MessageCircle, Share2, Timer, X } from 'lucide-react';
import { useOptionalAppLocale } from '@/components/i18n/app-locale-provider';

type Props = {
  materialId: string;
  viewerUrl: string;
  fileType: 'PDF' | 'Word';
  canShare: boolean;
};

export function PdfMobileToolsMenu({ materialId, viewerUrl, fileType, canShare }: Props) {
  const english = useOptionalAppLocale() === 'en';
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', escape);
    return () => document.removeEventListener('keydown', escape);
  }, [open]);

  const actions = [
    ...(canShare ? [{
      id: 'share', label: english ? 'Share' : 'Compartir', Icon: Share2,
      x: -54, y: 42,
      run: () => window.dispatchEvent(new CustomEvent('evaluo:share-material', { detail: { materialId } })),
      enabled: true,
    }] : []),
    {
      id: 'original', label: english ? `Open original ${fileType} file` : `Abrir ${fileType} original`, Icon: ExternalLink,
      x: -99, y: 73,
      run: () => window.open(viewerUrl, '_blank', 'noopener,noreferrer'),
      enabled: true,
    },
    {
      id: 'pomodoro', label: english ? 'Study timer' : 'Pomodoro', Icon: Timer,
      x: -84, y: 125,
      run: () => window.dispatchEvent(new Event('evaluo:open-pomodoro')),
      enabled: true,
    },
    {
      id: 'evi', label: english ? 'Ask Evi (coming soon)' : 'Preguntar a Evi (próximamente)', Icon: MessageCircle,
      x: -27, y: 135,
      run: () => {},
      enabled: false,
    },
  ];

  return (
    <div ref={rootRef} className="relative z-[62] inline-flex size-10 shrink-0" data-pdf-mobile-tools-menu>
      {open ? (
        <button
          type="button"
          tabIndex={-1}
          aria-label={english ? 'Close study tools' : 'Cerrar herramientas'}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[-1] bg-transparent"
        />
      ) : null}
      <div className="pointer-events-none absolute right-0 top-0 size-10">
        {actions.map(({ id, label, Icon, x, y, run, enabled }, index) => (
          <button
            key={id}
            type="button"
            title={label}
            aria-label={label}
            tabIndex={open && enabled ? 0 : -1}
            disabled={!enabled}
            onClick={() => { setOpen(false); run(); }}
            className={`pointer-events-auto absolute right-[-4px] top-[-4px] flex size-10 items-center justify-center rounded-full border border-[#E7EBF4] bg-white text-[#42506A] shadow-[0_7px_22px_rgba(15,27,61,0.10)] transition-[opacity,transform] ease-[cubic-bezier(.2,.8,.2,1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F5DFF] motion-reduce:transition-none ${enabled ? 'hover:text-[#4F5DFF] active:scale-95' : 'cursor-not-allowed opacity-60'}`}
            style={{
              opacity: open ? (enabled ? 1 : 0.55) : 0,
              transform: open ? `translate(${x}px,${y}px) scale(1)` : 'translate(0px,0px) scale(0.65)',
              transitionDuration: '230ms',
              transitionDelay: open ? `${index * 30}ms` : '0ms',
              pointerEvents: open && enabled ? 'auto' : 'none',
            }}
          >
            <Icon className="size-4" strokeWidth={1.8} aria-hidden="true" />
          </button>
        ))}
      </div>
      <button
        type="button"
        data-pdf-mobile-more-trigger
        aria-label={open ? (english ? 'Close material options' : 'Cerrar opciones del material') : (english ? 'More material options' : 'Más opciones del material')}
        aria-expanded={open}
        onClick={() => setOpen(value => !value)}
        className={`relative z-10 inline-flex size-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-[0_2px_8px_rgba(15,23,42,0.06)] transition-[background-color,box-shadow,transform] duration-200 ease-out active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none ${open ? 'bg-slate-100 shadow-[0_4px_16px_rgba(15,23,42,0.12)]' : ''}`}
      >
        <Ellipsis className={`absolute size-[18px] transition-[opacity,transform] duration-200 motion-reduce:transition-none ${open ? 'rotate-90 scale-75 opacity-0' : 'rotate-0 scale-100 opacity-100'}`} aria-hidden="true" />
        <X className={`absolute size-[18px] transition-[opacity,transform] duration-200 motion-reduce:transition-none ${open ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-75 opacity-0'}`} aria-hidden="true" />
      </button>
    </div>
  );
}
