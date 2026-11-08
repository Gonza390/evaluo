import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClientServer } from '@/lib/supabase-server';
import { PracticeHomeContent } from '@/components/dashboard/practice-home-content';

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
  const supabase = await createClientServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/dashboard/practicar');

  return <PracticeHomeContent
    requestedMaterialId={requestedMaterialId}
    advancedPracticeEnabled={process.env.PRACTICE_BANK_ENABLED === '1'}
  />;
}
