import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { requirePremiumUser } from '@/lib/premium';
import { getExplanationHistory } from '@/lib/explanations-history';
import { ExplanationsHistoryClient } from '@/components/dashboard/explanations-history-client';

export const metadata: Metadata = {
  title: 'Historial de explicaciones',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ExplanationsHistoryPage() {
  const premiumCheck = await requirePremiumUser();
  if (!premiumCheck.ok) {
    redirect('/pricing');
  }

  const history = await getExplanationHistory(premiumCheck.user.id);

  return <ExplanationsHistoryClient initialHistory={history} />;
}
