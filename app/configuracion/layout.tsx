import ClientLayout from '@/components/ClientLayout';
import { DeleteAccountSection } from '@/components/settings/delete-account-section';
import './configuration-clean.css';

export default function ConfiguracionLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClientLayout>
      <div className="configuration-editorial">
        {children}
        <div className="mx-auto mt-3 w-full max-w-[1240px] px-3 pb-5 sm:px-4 lg:px-6">
          <DeleteAccountSection />
        </div>
      </div>
    </ClientLayout>
  );
}
