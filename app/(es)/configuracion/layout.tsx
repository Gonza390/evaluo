import ClientLayout from '@/components/ClientLayout';
import { DeleteAccountSection } from '@/components/settings/delete-account-section';
import './configuration-clean.css';

export default function ConfiguracionLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClientLayout>
      <div className="configuration-editorial">
        {children}
        <div className="mx-auto mt-0 w-full max-w-[760px] px-4 pb-8 sm:px-6">
          <DeleteAccountSection />
        </div>
      </div>
    </ClientLayout>
  );
}
