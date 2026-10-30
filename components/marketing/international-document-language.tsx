'use client';

import { useEffect } from 'react';

/**
 * Synchronizes the document language for assistive technologies during client-side
 * navigation. The shared root layout sends generic Spanish in its initial HTML; localized
 * page wrappers already send their regional language during SSR. A future
 * multi-root-layout i18n refactor can regionalize the root attribute too.
 */
export function InternationalDocumentLanguage({ lang }: { lang: string }) {
  useEffect(() => {
    const previous = document.documentElement.lang;
    document.documentElement.lang = lang;
    return () => {
      document.documentElement.lang = previous;
    };
  }, [lang]);

  return null;
}
