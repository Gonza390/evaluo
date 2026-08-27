import ClientLayout from '@/components/ClientLayout';
import './calendar-clean.css';

export default function CalendarioLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClientLayout>
      <div className="calendar-editorial">{children}</div>
    </ClientLayout>
  );
}
