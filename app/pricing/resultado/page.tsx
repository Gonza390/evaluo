import { PaymentResult } from '@/components/pricing/PaymentResult';

export default function PricingResultPage() {
  return (
    <main className="bg-background relative flex min-h-[calc(100vh-5rem)] items-center justify-center overflow-hidden px-4 py-12 sm:py-16">
      <div className="bg-primary/8 absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full blur-3xl" />
      <PaymentResult />
    </main>
  );
}
