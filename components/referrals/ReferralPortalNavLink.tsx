'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart3 } from 'lucide-react';

export function ReferralPortalNavLink({
  collapsed,
  pathname,
}: {
  collapsed: boolean;
  pathname: string;
}) {
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

  const active = pathname === '/referidos' || pathname.startsWith('/referidos/');

  return (
    <Link
      href="/referidos"
      title={collapsed ? 'Referidos' : undefined}
      className={`group flex items-center rounded-lg text-[13px] font-medium transition-colors duration-150 ${
        active
          ? 'bg-indigo-50/80 text-indigo-700'
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
      } ${collapsed ? 'mx-auto h-10 w-10 justify-center px-0 py-0' : 'gap-2.5 px-3 py-2.5'}`}
    >
      <BarChart3 className="h-4 w-4 shrink-0" />
      {!collapsed ? <span>Referidos</span> : null}
    </Link>
  );
}
