'use client';

import { useEffect } from 'react';

/**
 * Synchronizes the document language for assistive technologies during client-side
 * navigation. The shared root layout is still Spanish (Argentina) on initial HTML,
 * so a future full product i18n migration should move this to route-aware SSR.
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
