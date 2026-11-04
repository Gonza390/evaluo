import type { Metadata } from 'next';
import ClientLayout from '@/components/ClientLayout';
import { getAdminAccessContext } from '@/lib/access-control';
import { AdminAccessState } from './admin-access-state';

export const metadata: Metadata = {
  title: 'Administrador',
  robots: { index: false, follow: false },
};

export default async function AdministradorLayout({ children }: { children: React.ReactNode }) {
  const access = await getAdminAccessContext();
  return <ClientLayout>
    {access.ok ? children : <AdminAccessState reason={access.reason} message={access.message} />}
  </ClientLayout>;
}
