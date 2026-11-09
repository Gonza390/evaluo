'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
// Supabase se carga solo al guardar preferencias: este proveedor está en casi
// todas las pantallas y no debe sumar el cliente al JavaScript inicial (LCP).
const loadSupabase = () => import('@/lib/supabase-client').then((module) => module.supabase);
import {
  APP_LOCALE_STORAGE_KEY, accountAppLocale, parseAppLocale, type AppLocale,
} from '@/lib/i18n/app-locale';
import { uiMessages } from '@/lib/i18n/messages';
import { accountStudyLocale } from '@/lib/i18n/study-language';
import { parseAccountTimeZone } from '@/lib/i18n/account-time-zone';

type AppLocaleContextValue = {
  locale: AppLocale;
  studyLocale: AppLocale;
  changeStudyLocale: (next: AppLocale) => Promise<void>;
  savingStudyLocale: boolean;
  messages: typeof uiMessages[AppLocale];
  savingLocale: boolean;
  changeLocale: (next: AppLocale) => Promise<void>;
};
const AppLocaleContext = createContext<AppLocaleContextValue | null>(null);

/**
 * Las páginas del servidor leen el idioma de esta cookie (lib/i18n/request-app-locale.ts):
 * los metadatos de la sesión tardan hasta una hora en actualizarse.
 */
function writeLocaleCookie(locale: AppLocale) {
  try {
    document.cookie = `${APP_LOCALE_STORAGE_KEY}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
  } catch {
    // Sin cookies, el servidor usa el idioma de la cuenta.
  }
}

function readLocaleCookie(): AppLocale | null {
  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )${APP_LOCALE_STORAGE_KEY}=([^;]*)`));
    return parseAppLocale(match?.[1]);
  } catch {
    return null;
  }
}

function storedLocale(): AppLocale | null {
  try {
    return parseAppLocale(window.localStorage.getItem(APP_LOCALE_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function AppLocaleProvider({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser();
  const router = useRouter();
  const refreshedForCookie = useRef(false);
  const [locale, setLocale] = useState<AppLocale>('es');
  const [initialized, setInitialized] = useState(false);
  const [savingLocale, setSavingLocale] = useState(false);
  const [studyOverride, setStudyOverride] = useState<AppLocale | null>(null);
  const [savingStudyLocale, setSavingStudyLocale] = useState(false);
  const accountLocale = accountAppLocale(user?.user_metadata);
  const savedStudyLocale = accountStudyLocale(user?.user_metadata);
  const preferenceCaptureAttempted = useRef<string | null>(null);
  // Older accounts did not save the UI locale. Capture the language actually shown
  // at their next authenticated visit, rather than retroactively guessing Spanish.
  // Combine this with time-zone capture to avoid racing auth.updateUser calls.
  // These are display preferences, never authorization claims.
  useEffect(() => {
    if (loading || !initialized || !user?.id ||
        preferenceCaptureAttempted.current === user.id) return;
    const savedZone = parseAccountTimeZone(user.user_metadata?.time_zone);
    const detectedZone = savedZone ? null :
      parseAccountTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    const missingLocale = accountLocale === null;
    if (!missingLocale && !detectedZone) return;
    preferenceCaptureAttempted.current = user.id;
    const data: { ui_locale?: AppLocale; time_zone?: string } = {};
    if (missingLocale) data.ui_locale = storedLocale() ?? locale;
    if (detectedZone) data.time_zone = detectedZone;
    void loadSupabase().then((supabase) => supabase.auth.updateUser({ data })).catch(() => undefined);
  }, [loading, initialized, user?.id, user?.user_metadata?.time_zone, accountLocale, locale]);

  const studyLocale = studyOverride ?? savedStudyLocale ?? locale;

  // Never carry a temporary language override across account changes.
  useEffect(() => { setStudyOverride(null); }, [user?.id]);

  useEffect(() => {
    if (loading) return;
    setLocale(accountLocale ?? storedLocale() ?? 'es');
    setInitialized(true);
  }, [loading, user?.id, accountLocale]);

  useEffect(() => {
    if (!initialized) return;
    const previous = document.documentElement.lang;
    document.documentElement.lang = locale;
    try {
      window.localStorage.setItem(APP_LOCALE_STORAGE_KEY, locale);
    } catch {
      // Auth metadata remains the persisted preference when storage is unavailable.
    }
    // Solo con sesión: sin cuenta, la cookie la decide el selector de idioma de la landing
    // (y el registro la usa para elegir el idioma de la cuenta nueva).
    if (user?.id) {
      // Si el servidor armó la página con otro idioma (cookie vieja), se vuelve a pedir una vez.
      const cookieLocale = readLocaleCookie();
      writeLocaleCookie(locale);
      if (cookieLocale && cookieLocale !== locale && !refreshedForCookie.current) {
        refreshedForCookie.current = true;
        router.refresh();
      }
    }
    return () => { document.documentElement.lang = previous; };
  }, [initialized, locale, router, user?.id]);

  const changeLocale = useCallback(async (next: AppLocale) => {
    if (next === locale) return;
    setSavingLocale(true);
    try {
      if (user) {
        // A language preference in user_metadata must never grant access or affect RLS.
        const supabase = await loadSupabase();
        const { error } = await supabase.auth.updateUser({ data: { ui_locale: next } });
        if (error) throw error;
      }
      setLocale(next);
      // Que las partes armadas en el servidor (home, plan, progreso…) también cambien de idioma.
      writeLocaleCookie(next);
      router.refresh();
    } finally {
      setSavingLocale(false);
    }
  }, [locale, user, router]);

  const changeStudyLocale = useCallback(async (next: AppLocale) => {
    if (next === studyLocale) return;
    setSavingStudyLocale(true);
    try {
      if (!user) throw new Error('Study language requires a signed-in account');
      const supabase = await loadSupabase();
      const { error } = await supabase.auth.updateUser({ data: { study_locale: next } });
      if (error) throw error;
      setStudyOverride(next);
    } finally {
      setSavingStudyLocale(false);
    }
  }, [studyLocale, user]);

  const value = useMemo<AppLocaleContextValue>(() => ({
    locale, studyLocale, changeStudyLocale, savingStudyLocale,
    messages: uiMessages[locale], savingLocale, changeLocale,
  }), [locale, studyLocale, changeStudyLocale, savingStudyLocale, savingLocale, changeLocale]);

  return <AppLocaleContext.Provider value={value}>{children}</AppLocaleContext.Provider>;
}

/** Safe fallback for public study demos rendered outside the authenticated shell. */
export function useOptionalAppLocale() {
  return useContext(AppLocaleContext)?.locale ?? 'es';
}

export function useAppLocale() {
  const context = useContext(AppLocaleContext);
  if (!context) throw new Error('useAppLocale must be used within AppLocaleProvider');
  return context;
}
