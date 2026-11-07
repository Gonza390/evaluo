'use client';

import { useEffect } from 'react';
import { APP_LOCALE_STORAGE_KEY } from '@/lib/i18n/app-locale';

/** An English landing/sign-in should not lead to a Spanish default dashboard. */
export function EnglishLoginLocale() {
  useEffect(() => {
    try {
      window.localStorage.setItem(APP_LOCALE_STORAGE_KEY, 'en');
      document.cookie = 'evaluo_ui_locale=en; Path=/; Max-Age=31536000; SameSite=Lax';
    } catch {
      // Storage may be disabled by the browser.
    }
  }, []);
  return null;
}
