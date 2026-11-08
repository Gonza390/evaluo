'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Clock3, ShieldCheck, XCircle } from 'lucide-react';

type ResultState = 'checking' | 'pending' | 'active' | 'test' | 'failed' | 'signin' | 'error';
type PaymentResponse = {
  plan?: 'free' | 'premium';
  provider?: string | null;
  checkoutProvider?: string | null;
  checkoutMode?: string | null;
  checkoutAttemptId?: string | null;
  checkoutStatus?: string | null;
};

export function EnglishCreemPaymentResult({ attemptId }: { attemptId: string | null }) {
  const [state, setState] = useState<ResultState>(attemptId ? 'checking' : 'error');
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    if (!attemptId) return;
    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout> | null = null;
    let polls = 0;
    const check = async () => {
      let next: ResultState = 'error';
      try {
        const response = await fetch('/api/payments/status?attemptId=' + encodeURIComponent(attemptId), { cache: 'no-store' });
        if (response.status === 401) next = 'signin';
        else if (response.ok) {
          const payload = await response.json() as PaymentResponse;
          if (payload.checkoutProvider !== 'creem' || payload.checkoutAttemptId !== attemptId) {
            next = 'error';
          } else if (payload.checkoutMode === 'test') {
            // Sandbox payments must NEVER be presented as real Premium access.
            next = 'test';
          } else if (payload.checkoutMode !== 'live') {
            next = 'error';
          } else if (payload.plan === 'premium' && payload.provider === 'creem' && payload.checkoutStatus === 'paid') {
            // The server checks actual entitlements; a checkout return alone is insufficient.
            next = 'active';
          } else if (['failed', 'refunded', 'canceled', 'disputed'].includes(payload.checkoutStatus ?? '')) {
            next = 'failed';
          } else next = 'pending';
        }
      } catch {
        next = 'pending';
      }
      if (cancelled) return;
      setState(next);
      if (next === 'pending' && polls++ < 20) timeout = setTimeout(() => { void check(); }, 3000);
    };
    void check();
    return () => { cancelled = true; if (timeout) clearTimeout(timeout); };
  }, [attemptId, refresh]);

  const title: Record<ResultState, string> = {
    checking: 'Verifying your payment…',
    pending: 'Payment confirmation is in progress',
    active: 'Your Evaluo Premium access is ready',
    test: 'Creem test checkout complete',
    failed: 'We could not confirm your purchase',
    signin: 'Sign in to view your payment status',
    error: 'We cannot find a valid payment attempt',
  };
  const description: Record<ResultState, string> = {
    checking: 'We are checking your purchase securely.',
    pending: 'A payment return does not automatically activate Premium. We will only enable it after the provider confirms the paid subscription. If the message remains, please check again.',
    active: 'The payment provider confirmed your subscription and Evaluo has verified your Premium access.',
    test: 'This was a sandbox checkout. No real charge was made and real Premium access was not activated.',
    failed: 'No Premium access was activated from this attempt. Please review your payment or try again.',
    signin: 'Your account is required to check the payment associated with it.',
    error: 'The link may be incomplete or expired. You can return to the English pricing page.',
  };
  const checking = state === 'checking' || state === 'pending';
  return <section className="mx-auto max-w-xl rounded-3xl border border-[#E7EBF4] bg-white px-6 py-12 text-center shadow-sm sm:px-10">
    {state === 'active' ? <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" aria-hidden="true" />
      : state === 'failed' || state === 'error' ? <XCircle className="mx-auto h-12 w-12 text-amber-600" aria-hidden="true" />
      : <Clock3 className="mx-auto h-12 w-12 text-[#456DBD]" aria-hidden="true" />}
    <h1 className="mt-5 text-titulo font-bold tracking-titulo sm:text-destacado">{title[state]}</h1>
    <p className="mt-4 text-cuerpo leading-7 text-[#42506A]" role="status">{description[state]}</p>
    <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
      {state === 'active' ? (
        <Link href="/dashboard" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#456DBD] px-5 py-3 text-cuerpo font-semibold text-white">Continue studying</Link>
      ) : state === 'signin' ? (
        <Link href={'/en/login?mode=login&next=' + encodeURIComponent('/en/pricing/result?attemptId=' + attemptId)} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#456DBD] px-5 py-3 text-cuerpo font-semibold text-white">Sign in</Link>
      ) : (
        <Link href="/en/pricing" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#456DBD] px-5 py-3 text-cuerpo font-semibold text-white">Back to plans</Link>
      )}
      {checking ? <button type="button" onClick={() => { setState('checking'); setRefresh(n => n + 1); }}
        className="min-h-11 rounded-xl border border-slate-300 px-5 py-3 text-cuerpo font-semibold text-[#0F1B3D]">Check again</button> : null}
    </div>
    <p className="mt-7 flex items-center justify-center gap-2 text-chico text-[#7F8AA3]"><ShieldCheck className="h-4 w-4" aria-hidden="true" />Access is granted only after verified payment.</p>
  </section>;
}
