'use client';

import type { ChangeEvent } from 'react';
import { useAppLocale } from '@/components/i18n/app-locale-provider';
import { useToast } from '@/components/ui/use-toast';
import { parseAppLocale } from '@/lib/i18n/app-locale';
import { settingsMessages } from '@/lib/i18n/settings-messages';

export function LanguagePicker() {
  const { locale, savingLocale, changeLocale } = useAppLocale();
  const settingsCopy = settingsMessages[locale];
  const { toast } = useToast();

  const onChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const next = parseAppLocale(event.target.value);
    if (!next) return;
    void changeLocale(next).then(() => {
      document.cookie = `evaluo_ui_locale=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
    }).catch(() => {
      toast({ title: settingsCopy.languageSaveError, variant: 'destructive' });
    });
  };

  return (
    <div className="flex min-h-12 items-center justify-between gap-4 border-b border-slate-100 py-3 text-ui">
      <label htmlFor="evaluo-language" className="font-medium text-slate-800">
        {settingsCopy.language}
      </label>
      <div className="flex min-w-0 items-center gap-2">
        <select
          id="evaluo-language"
          aria-label={settingsCopy.language}
          aria-busy={savingLocale}
          disabled={savingLocale}
          value={locale}
          onChange={onChange}
          className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-ui font-medium text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-60"
        >
          <option value="es">Español</option>
          <option value="en">English</option>
        </select>
        {savingLocale ? <span role="status" className="text-chico text-slate-500">{settingsCopy.savingLanguage}</span> : null}
      </div>
    </div>
  );
}
