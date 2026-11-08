'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { useOptionalAppLocale } from '@/components/i18n/app-locale-provider';

type PartnerReferralActionsProps = {
  code: string;
  referralUrl: string;
};

export function PartnerReferralActions({ code, referralUrl }: PartnerReferralActionsProps) {
  const english = useOptionalAppLocale() === 'en';
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);

  async function copy(value: string, type: 'code' | 'link') {
    await navigator.clipboard.writeText(value);
    setCopied(type);
    window.setTimeout(() => setCopied((current) => (current === type ? null : current)), 1600);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => copy(code, 'code')}
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50"
      >
        {copied === 'code' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied === 'code' ? (english ? 'Code copied' : 'Código copiado') : (english ? 'Copy code' : 'Copiar código')}
      </button>
      <button
        type="button"
        onClick={() => copy(referralUrl, 'link')}
        className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-3 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        {copied === 'link' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied === 'link' ? (english ? 'Link copied' : 'Link copiado') : (english ? 'Copy link' : 'Copiar link')}
      </button>
    </div>
  );
}
