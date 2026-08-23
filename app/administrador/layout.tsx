import type { Metadata } from 'next';
import Link from 'next/link';
import { Building2, LayoutDashboard } from 'lucide-react';
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

  return (
    <ClientLayout>
      {children}
      <div className="fixed right-5 bottom-5 z-[70] hidden items-center gap-2 lg:flex">
        <Link
          href="/administrador"
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-lg transition hover:border-indigo-200 hover:text-indigo-700"
        >
          <LayoutDashboard className="h-4 w-4" />
          Panel
        </Link>
        <Link
          href="/administrador/solicitudes"
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-3 text-xs font-semibold text-white shadow-lg transition hover:bg-indigo-700"
        >
          <Building2 className="h-4 w-4" />
          Solicitudes universidades
        </Link>
      </div>
    </ClientLayout>
  );
}
