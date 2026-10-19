import ClientLayout from '@/components/ClientLayout';
import './career-clean.css';

export default function MateriasLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClientLayout>
      <div className="career-editorial">{children}</div>
    </ClientLayout>
  );
}
