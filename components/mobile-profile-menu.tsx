'use client';

import Link from 'next/link';
import { MessageSquarePlus, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAppLocale } from '@/components/i18n/app-locale-provider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import dynamic from 'next/dynamic';

// Mantener el formulario de sugerencias fuera del bundle inicial.
const FeedbackDialog = dynamic(() =>
  import('@/components/FeedbackDialog').then(module => module.FeedbackDialog)
);

type MobileProfileMenuProps = {
  initials: string;
  avatarUrl?: string;
  sourcePath: string;
};

export function MobileProfileMenu({ initials, avatarUrl, sourcePath }: MobileProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const { messages, locale } = useAppLocale();
  const english = locale === 'en';

  useEffect(() => {
    if (!open) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onEscape);
    return () => document.removeEventListener('keydown', onEscape);
  }, [open]);

  const actions = [
    {
      id: 'settings',
      label: messages.navigation.settings,
      x: -50,
      y: 26,
      Icon: Settings,
    },
    {
      id: 'feedback',
      label: messages.navigation.feedback,
      x: -13,
      y: 63,
      Icon: MessageSquarePlus,
    },
  ] as const;

  return (
    <>
      <div className="relative z-[62] inline-flex size-10 shrink-0 md:hidden" data-mobile-profile-menu>
        {open ? (
          <button
            type="button"
            tabIndex={-1}
            aria-label={english ? 'Close profile options' : 'Cerrar opciones de perfil'}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[-1] bg-transparent"
          />
        ) : null}
        <div className="pointer-events-none absolute right-0 top-0 size-10">
          {actions.map(({ id, label, x, y, Icon }, index) => (
            <div
              key={id}
              className="pointer-events-none absolute right-[-2px] top-[-2px] size-11"
              style={{
                opacity: open ? 1 : 0,
                transform: open
                  ? `translate(${x}px,${y}px) scale(1)`
                  : 'translate(0px,0px) scale(0.65)',
                transition: 'opacity 230ms ease-out, transform 230ms cubic-bezier(.2,.8,.2,1)',
                transitionDelay: open ? `${index * 35}ms` : '0ms',
              }}
            >
              {id === 'settings' ? (
                <Link
                  href="/configuracion"
                  tabIndex={open ? 0 : -1}
                  aria-label={label}
                  title={label}
                  onClick={() => setOpen(false)}
                  className={`flex size-11 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F5DFF] ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}
                >
                  <span className="flex size-9 items-center justify-center rounded-full border border-[#E7EBF4] bg-white text-[#42506A] shadow-[0_5px_18px_rgba(15,27,61,0.10)]">
                    <Icon className="size-[15px]" strokeWidth={1.8} aria-hidden="true" />
                  </span>
                </Link>
              ) : (
                <button
                  type="button"
                  tabIndex={open ? 0 : -1}
                  aria-label={label}
                  title={label}
                  onClick={() => {
                    setOpen(false);
                    setFeedbackOpen(true);
                  }}
                  className={`flex size-11 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F5DFF] ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}
                >
                  <span className="flex size-9 items-center justify-center rounded-full border border-[#E7EBF4] bg-white text-[#42506A] shadow-[0_5px_18px_rgba(15,27,61,0.10)]">
                    <Icon className="size-[15px]" strokeWidth={1.8} aria-hidden="true" />
                  </span>
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          data-mobile-profile-menu-trigger
          aria-label={open
            ? (english ? 'Close profile options' : 'Cerrar opciones de perfil')
            : messages.navigation.profileMenu}
          aria-expanded={open}
          onClick={() => setOpen(value => !value)}
          className={`relative z-10 inline-flex size-10 items-center justify-center rounded-full transition-[background-color,transform] duration-200 ease-out active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none ${open ? 'bg-slate-50' : 'hover:bg-slate-50'}`}
        >
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-gradient-to-br from-fuchsia-500 via-violet-500 to-indigo-500 text-chico font-semibold text-white">
              {initials}
            </AvatarFallback>
            {avatarUrl ? <AvatarImage src={avatarUrl} /> : null}
          </Avatar>
        </button>
      </div>
      {feedbackOpen ? (
        <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} sourcePath={sourcePath} />
      ) : null}
    </>
  );
}
