import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClientServer } from '@/lib/supabase-server';
import { getStudyErrorsPageData } from '@/lib/study-errors';
import { StudyErrorsClient } from '@/components/dashboard/study-errors-client';

export const metadata: Metadata = {
  title: 'Mis errores',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function StudyErrorsPage({
  searchParams,
}: {
  searchParams?: Promise<{ tour?: string; error?: string }>;
}) {
  const supabase = await createClientServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/dashboard/explicaciones');
  }

  const data = await getStudyErrorsPageData(user.id);
  const params = (await searchParams) ?? {};
  const requestedErrorId = String(params.error ?? '').slice(0, 80) || null;
  const onboardingActive =
    params.tour === 'first-error' &&
    Boolean(requestedErrorId) &&
    data.pending.some((item) => item.id === requestedErrorId);

  return (
    <StudyErrorsClient
      data={data}
      onboarding={{ active: onboardingActive, errorId: requestedErrorId }}
    />
  );
}
