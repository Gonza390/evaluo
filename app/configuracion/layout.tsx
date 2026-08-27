import ClientLayout from '@/components/ClientLayout';
import './configuration-clean.css';

export default function ConfiguracionLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClientLayout>
      <div className="configuration-editorial">{children}</div>
    </ClientLayout>
  );
}
