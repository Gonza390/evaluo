'use client';

import { createContext, useContext } from 'react';
import { usePathname } from 'next/navigation';
import ClientLayoutClient from '@/components/ClientLayoutClient';

const SharedShellContext = createContext(false);

export function SharedPrivateShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPrivate = pathname === '/dashboard' || pathname.startsWith('/dashboard/') ||
    pathname === '/calendario' || pathname.startsWith('/calendario/') ||
    pathname.startsWith('/materiales/');
  if (!isPrivate) return <>{children}</>;
  return (
    <SharedShellContext.Provider value>
      <ClientLayoutClient>{children}</ClientLayoutClient>
    </SharedShellContext.Provider>
  );
}

export function NestedClientLayout({ children }: { children: React.ReactNode }) {
  const hasSharedShell = useContext(SharedShellContext);
  return hasSharedShell ? <>{children}</> : <ClientLayoutClient>{children}</ClientLayoutClient>;
}
