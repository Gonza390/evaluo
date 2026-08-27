import type { Metadata } from 'next';
import ClientLayout from '@/components/ClientLayout';
import './dashboard-responsive.css';

export const metadata: Metadata = {
  title: 'Dashboard',
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClientLayout>
      <div className="dashboard-responsive">{children}</div>
    </ClientLayout>
  );
}
