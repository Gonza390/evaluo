'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

type PartnerReferralActionsProps = {
  code: string;
  referralUrl: string;
};

export function PartnerReferralActions({ code, referralUrl }: PartnerReferralActionsProps) {
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
        {copied === 'code' ? 'Código copiado' : 'Copiar código'}
      </button>
      <button
        type="button"
        onClick={() => copy(referralUrl, 'link')}
        className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-3 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        {copied === 'link' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied === 'link' ? 'Link copiado' : 'Copiar link'}
      </button>
    </div>
  );
}
