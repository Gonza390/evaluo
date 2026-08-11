'use client';

import type { ReactNode } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { UserProvider } from '@/hooks/useUser';

export function AppShellProviders({ children }: { children: ReactNode }) {
  return (
    <UserProvider>
      {children}
      <Toaster />
    </UserProvider>
  );
}
