'use client';

import { Languages } from 'lucide-react';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { useAppLocale } from '@/components/i18n/app-locale-provider';
import { useToast } from '@/components/ui/use-toast';
import { settingsMessages } from '@/lib/i18n/settings-messages';

export function LanguageMenuItem({ className }: { className?: string }) {
  const { locale, savingLocale, changeLocale } = useAppLocale();
  const settingsCopy = settingsMessages[locale];
  const { toast } = useToast();
  return (
    <DropdownMenuItem
      disabled={savingLocale}
      className={className}
      onSelect={() => {
        void changeLocale(locale === 'es' ? 'en' : 'es').catch(() => {
          toast({ title: settingsCopy.languageSaveError, variant: 'destructive' });
        });
      }}
    >
      <Languages className="mr-2 h-4 w-4" aria-hidden="true" />
      {settingsCopy.language}: {locale === 'es' ? 'English' : 'Español'}
    </DropdownMenuItem>
  );
}
