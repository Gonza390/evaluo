import type { ReactNode } from 'react';
import ClientLayoutClient from '@/components/ClientLayoutClient';

export default function ClientLayout({ children }: { children: ReactNode }) {
  return <ClientLayoutClient>{children}</ClientLayoutClient>;
}
