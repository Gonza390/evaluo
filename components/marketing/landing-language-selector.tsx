'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { Check, ChevronDown, Globe2 } from 'lucide-react';
import { APP_LOCALE_STORAGE_KEY, type AppLocale } from '@/lib/i18n/app-locale';

const options = [
  { locale: 'es', label: 'Español', shortLabel: 'ES', flag: '🇦🇷', href: '/' },
  { locale: 'en', label: 'English', shortLabel: 'EN', flag: '🇺🇸', href: '/en' },
] as const;

/** Shared landing navigation: a page-language selector, not a claim of complete app localization. */
export function LandingLanguageSelector({ locale }: { locale: AppLocale }) {
  const menuRef = useRef<HTMLDetailsElement>(null);

  const rememberLocale = (next: AppLocale) => {
    menuRef.current?.removeAttribute('open');
    try {
      window.localStorage.setItem(APP_LOCALE_STORAGE_KEY, next);
    } catch {
      // Navigation still works in browsers where storage is unavailable.
    }
  };

  return (
    <details ref={menuRef} className="group relative z-50 shrink-0" data-landing-language-selector>
      <summary
        aria-label={locale === 'es' ? 'Cambiar idioma' : 'Change language'}
        className="flex min-h-11 cursor-pointer list-none items-center gap-1.5 rounded-xl px-2 text-[13px] font-semibold text-[#0F1B3D] transition hover:bg-[#EEF2FF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F5DFF] [&::-webkit-details-marker]:hidden"
      >
        <Globe2 className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
        <span>{locale === 'es' ? 'ES' : 'EN'}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div
        className="absolute right-0 top-full z-50 mt-2 w-[min(280px,calc(100vw-32px))] rounded-2xl border border-[#E7EBF4] bg-white p-2 shadow-[0_16px_45px_rgba(15,27,61,0.14)]"
        role="group"
        aria-label={locale === 'es' ? 'Idiomas disponibles' : 'Available languages'}
      >
        {options.map((option) => (
          <Link
            key={option.locale}
            href={option.href}
            hrefLang={option.locale}
            lang={option.locale}
            aria-current={locale === option.locale ? 'page' : undefined}
            onClick={() => rememberLocale(option.locale)}
            className={`flex min-h-12 items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold no-underline transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F5DFF] ${
              locale === option.locale
                ? 'bg-[#EEF2FF] text-[#032269]'
                : 'text-[#0F1B3D] hover:bg-[#F5F7FB]'
            }`}
          >
            <span className="text-xl leading-none" role="img" aria-label={option.locale === 'es' ? 'Argentina' : 'United States'}>
              {option.flag}
            </span>
            <span className="min-w-0 flex-1">{option.label}</span>
            {locale === option.locale ? <Check className="h-4 w-4 shrink-0 text-[#4F5DFF]" aria-hidden="true" /> : null}
          </Link>
        ))}
      </div>
    </details>
  );
}
