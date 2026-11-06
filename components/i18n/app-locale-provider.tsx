'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useUser } from '@/hooks/useUser';
import { supabase } from '@/lib/supabase-client';
import {
  APP_LOCALE_STORAGE_KEY, accountAppLocale, parseAppLocale, type AppLocale,
} from '@/lib/i18n/app-locale';
import { uiMessages } from '@/lib/i18n/messages';
import { accountStudyLocale } from '@/lib/i18n/study-language';

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

function storedLocale(): AppLocale | null {
  try {
    return parseAppLocale(window.localStorage.getItem(APP_LOCALE_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function AppLocaleProvider({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser();
  const [locale, setLocale] = useState<AppLocale>('es');
  const [initialized, setInitialized] = useState(false);
  const [savingLocale, setSavingLocale] = useState(false);
  const [studyOverride, setStudyOverride] = useState<AppLocale | null>(null);
  const [savingStudyLocale, setSavingStudyLocale] = useState(false);
  const accountLocale = accountAppLocale(user?.user_metadata);
  const savedStudyLocale = accountStudyLocale(user?.user_metadata);
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
    return () => { document.documentElement.lang = previous; };
  }, [initialized, locale]);

  const changeLocale = useCallback(async (next: AppLocale) => {
    if (next === locale) return;
    setSavingLocale(true);
    try {
      if (user) {
        // A language preference in user_metadata must never grant access or affect RLS.
        const { error } = await supabase.auth.updateUser({ data: { ui_locale: next } });
        if (error) throw error;
      }
      setLocale(next);
    } finally {
      setSavingLocale(false);
    }
  }, [locale, user]);

  const changeStudyLocale = useCallback(async (next: AppLocale) => {
    if (next === studyLocale) return;
    setSavingStudyLocale(true);
    try {
      if (!user) throw new Error('Study language requires a signed-in account');
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
