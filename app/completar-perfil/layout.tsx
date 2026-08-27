import ClientLayout from '@/components/ClientLayout';
import './profile-completion-clean.css';

export default function CompletarPerfilLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClientLayout>
      <div className="profile-completion-editorial">{children}</div>
    </ClientLayout>
  );
}
