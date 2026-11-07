'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef } from 'react';
import { Check, ChevronDown, Globe2 } from 'lucide-react';
import { APP_LOCALE_STORAGE_KEY, type AppLocale } from '@/lib/i18n/app-locale';

const options = [
  { locale: 'es', label: 'Español', shortLabel: 'ES', href: '/' },
  { locale: 'en', label: 'English', shortLabel: 'EN', href: '/en' },
] as const;

/** Public language switching is separate from invisible hreflang metadata. */
const SEO_EQUIVALENT_PAGES: ReadonlyArray<readonly [string, string]> = [
  ['/', '/en'],
  ['/blog', '/en/blog'],
  ['/estudiar-pdf-con-ia', '/en/study-pdf-with-ai'],
  ['/es/estudiar-pdf-con-ia', '/en/study-pdf-with-ai'],
  ['/es-mx/estudiar-pdf-con-ia', '/en/study-pdf-with-ai'],
  ['/es-co/estudiar-pdf-con-ia', '/en/study-pdf-with-ai'],
  ['/es-es/estudiar-pdf-con-ia', '/en/study-pdf-with-ai'],
  ['/convertir-pdf-en-preguntas', '/en/pdf-to-quiz'],
  ['/funciones/crear-flashcards-desde-pdf', '/en/pdf-to-flashcards'],
  ['/funciones/verdadero-falso-con-ia', '/en/ai-true-false-questions'],
  ['/funciones/unir-conceptos-con-ia', '/en/match-concepts-with-ai'],
  ['/pricing', '/en/pricing'],
];

function validLocalHref(href?: string): string | null {
  if (!href || !href.startsWith('/') || href.startsWith('//') || href.includes('\\')) return null;
  return href;
}

/** An untranslated article leads to the destination blog hub, not an unrelated post. */
function destinationFor(path: string, locale: AppLocale, alternateHref?: string) {
  const explicit = validLocalHref(alternateHref);
  if (explicit) return { href: explicit, exact: true };
  const pair = SEO_EQUIVALENT_PAGES.find(([es, en]) => path === es || path === en);
  if (pair) return { href: locale === 'es' ? pair[1] : pair[0], exact: true };
  if (path.startsWith('/blog/') || path.startsWith('/en/blog/')) {
    return { href: locale === 'es' ? '/en/blog' : '/blog', exact: false };
  }
  if (path === '/en/resources') return { href: '/recursos', exact: false };
  if (path === '/recursos') return { href: '/en/resources', exact: false };
  return { href: locale === 'es' ? '/en' : '/', exact: false };
}

export function LandingLanguageSelector({ locale, alternateHref }: { locale: AppLocale; alternateHref?: string }) {
  const menuRef = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname() ?? (locale === 'es' ? '/' : '/en');
  const currentPath = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');
  const destination = destinationFor(currentPath, locale, alternateHref);

  const rememberLocale = (next: AppLocale) => {
    menuRef.current?.removeAttribute('open');
    try {
      window.localStorage.setItem(APP_LOCALE_STORAGE_KEY, next);
    } catch {
      // Navigation works without browser storage.
    }
    document.cookie = 'evaluo_ui_locale=' + next + '; Path=/; Max-Age=31536000; SameSite=Lax';
  };

  return (
    <details ref={menuRef} className="group relative z-50 shrink-0" data-landing-language-selector>
      <summary
        aria-label={locale === 'es' ? 'Cambiar idioma' : 'Change language'}
        className="flex min-h-11 cursor-pointer list-none items-center gap-1.5 rounded-xl px-2 text-[13px] font-semibold text-[#0F1B3D] transition hover:bg-[#EEF2FF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5D70C4] [&::-webkit-details-marker]:hidden"
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
        {options.map(option => (
          <Link
            key={option.locale}
            href={option.locale === locale ? currentPath : destination.href}
            hrefLang={option.locale}
            prefetch={false}
            lang={option.locale}
            aria-current={locale === option.locale ? 'page' : undefined}
            onClick={() => rememberLocale(option.locale)}
            className={option.locale === locale
              ? 'flex min-h-12 items-center gap-3 rounded-xl bg-[#EEF2FF] px-3 py-2.5 text-[13px] font-semibold text-[#032269] no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5D70C4]'
              : 'flex min-h-12 items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-[#0F1B3D] no-underline transition hover:bg-[#F5F7FB] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5D70C4]'}
          >
            <span className="min-w-0 flex-1">
              <span className="block">{option.label}</span>
              {option.locale !== locale && !destination.exact ? (
                <span className="mt-0.5 block text-[11px] font-normal text-slate-500">
                  {locale === 'es' ? 'Abrir la sección en inglés' : 'Open the Spanish section'}
                </span>
              ) : null}
            </span>
            {locale === option.locale ? <Check className="h-4 w-4 shrink-0 text-[#5D70C4]" aria-hidden="true" /> : null}
          </Link>
        ))}
      </div>
    </details>
  );
}
