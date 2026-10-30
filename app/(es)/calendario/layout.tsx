import ClientLayout from '@/components/ClientLayout';
import { PremiumAccessOverrideProvider } from '@/hooks/usePremium';
import './calendar-clean.css';

export default function CalendarioLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClientLayout>
      <PremiumAccessOverrideProvider>
        <div className="calendar-editorial">{children}</div>
      </PremiumAccessOverrideProvider>
    </ClientLayout>
  );
}
