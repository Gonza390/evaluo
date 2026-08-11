import type { Metadata } from 'next';
import ClientLayout from '@/components/ClientLayout';
import { getAdminAccessContext } from '@/lib/access-control';
import { AdminAccessState } from './admin-access-state';

export const metadata: Metadata = {
  title: 'Administrador',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdministradorLayout({ children }: { children: React.ReactNode }) {
  const adminAccess = await getAdminAccessContext();

  if (!adminAccess.ok) {
    return (
      <ClientLayout>
        <AdminAccessState reason={adminAccess.reason} message={adminAccess.message} />
      </ClientLayout>
    );
  }

  return <ClientLayout>{children}</ClientLayout>;
}
