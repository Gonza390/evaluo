import ClientLayout from '@/components/ClientLayout';
import { DeleteAccountSection } from '@/components/settings/delete-account-section';
import './configuration-clean.css';

export default function ConfiguracionLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClientLayout>
      <div className="configuration-editorial">
        {children}
        <div className="mx-auto mt-6 w-full max-w-6xl pb-6">
          <DeleteAccountSection />
        </div>
      </div>
    </ClientLayout>
  );
}
