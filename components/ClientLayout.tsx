'use client';

import type { ReactNode } from 'react';
import { NestedClientLayout } from '@/components/SharedPrivateShell';

export default function ClientLayout({ children }: { children: ReactNode }) {
  return <NestedClientLayout>{children}</NestedClientLayout>;
}
