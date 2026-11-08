import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { PracticeHomeContent } from '@/components/dashboard/practice-home-content';
import { getSessionUser } from '@/lib/auth-session';

export const metadata: Metadata = {
  title: 'Practicar',
  robots: { index: false, follow: false },
};

export default async function PracticeHomePage({
  searchParams,
}: {
  searchParams?: Promise<{ materialId?: string }>;
}) {
  const requestedMaterialId = (await searchParams)?.materialId ?? null;
  const user = await getSessionUser();
  if (!user) redirect('/login?next=/dashboard/practicar');

  return <PracticeHomeContent
    requestedMaterialId={requestedMaterialId}
    advancedPracticeEnabled={process.env.PRACTICE_BANK_ENABLED === '1'}
  />;
}
