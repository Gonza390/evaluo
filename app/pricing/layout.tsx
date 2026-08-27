import { PublicLayout } from '@/components/PublicLayout';
import './pricing-clean.css';

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return (
    <PublicLayout>
      <div className="pricing-editorial">{children}</div>
    </PublicLayout>
  );
}
