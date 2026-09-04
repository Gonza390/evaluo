'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BarChart3 } from 'lucide-react';

export function ReferralPortalDashboardShortcut() {
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    let active = true;
    void fetch('/api/referrals/access', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) return false;
        const payload = (await response.json()) as { hasAccess?: boolean };
        return Boolean(payload.hasAccess);
      })
      .then((value) => {
        if (active) setHasAccess(value);
      })
      .catch(() => {
        if (active) setHasAccess(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (!hasAccess) return null;

  return (
    <div className="border-b border-slate-200 bg-slate-50/70 px-4 py-3 sm:px-6">
      <Link
        href="/referidos"
        className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 text-sm transition hover:text-indigo-700"
      >
        <span className="flex min-w-0 items-center gap-3">
          <BarChart3 className="h-4 w-4 shrink-0 text-indigo-600" />
          <span className="min-w-0">
            <span className="font-semibold text-slate-900">Tu programa de referidos</span>
            <span className="ml-2 hidden text-slate-500 sm:inline">Revisá códigos, conversiones y pagos.</span>
          </span>
        </span>
        <span className="inline-flex shrink-0 items-center gap-1 font-semibold text-indigo-600">
          Ver métricas
          <ArrowRight className="h-4 w-4" />
        </span>
      </Link>
    </div>
  );
}
