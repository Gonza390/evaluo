'use client';

import { Languages } from 'lucide-react';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { useAppLocale } from '@/components/i18n/app-locale-provider';
import { useToast } from '@/components/ui/use-toast';

export function LanguageMenuItem({ className }: { className?: string }) {
  const { locale, messages, savingLocale, changeLocale } = useAppLocale();
  const { toast } = useToast();
  return (
    <DropdownMenuItem
      disabled={savingLocale}
      className={className}
      onSelect={() => {
        void changeLocale(locale === 'es' ? 'en' : 'es').catch(() => {
          toast({ title: messages.settings.languageSaveError, variant: 'destructive' });
        });
      }}
    >
      <Languages className="mr-2 h-4 w-4" aria-hidden="true" />
      {messages.settings.language}: {locale === 'es' ? 'English' : 'Español'}
    </DropdownMenuItem>
  );
}
