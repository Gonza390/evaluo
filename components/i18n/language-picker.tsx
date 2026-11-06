'use client';

import type { ChangeEvent } from 'react';
import { useAppLocale } from '@/components/i18n/app-locale-provider';
import { useToast } from '@/components/ui/use-toast';
import { parseAppLocale } from '@/lib/i18n/app-locale';

export function LanguagePicker() {
  const { locale, messages, savingLocale, changeLocale } = useAppLocale();
  const { toast } = useToast();

  const onChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const next = parseAppLocale(event.target.value);
    if (!next) return;
    void changeLocale(next).catch(() => {
      toast({ title: messages.settings.languageSaveError, variant: 'destructive' });
    });
  };

  return (
    <div className="flex min-h-12 items-center justify-between gap-4 border-b border-slate-100 py-3 text-[13px]">
      <label htmlFor="evaluo-language" className="font-medium text-slate-800">
        {messages.settings.language}
      </label>
      <div className="flex min-w-0 items-center gap-2">
        <select
          id="evaluo-language"
          aria-label={messages.settings.language}
          aria-busy={savingLocale}
          disabled={savingLocale}
          value={locale}
          onChange={onChange}
          className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-60"
        >
          <option value="es">Español</option>
          <option value="en">English</option>
        </select>
        {savingLocale ? <span role="status" className="text-xs text-slate-500">{messages.settings.savingLanguage}</span> : null}
      </div>
    </div>
  );
}
