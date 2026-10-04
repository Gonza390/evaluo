import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClientServer } from '@/lib/supabase-server';
import { getPendingStudyErrorOnboarding, getStudyErrorsPageData } from '@/lib/study-errors';
import { StudyErrorsClient } from '@/components/dashboard/study-errors-client';
import { isUuid } from '@/lib/uuid';

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
  searchParams?: Promise<{ tour?: string; error?: string; material?: string }>;
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
  const pendingOnboardingErrorId =
    params.tour === 'first-error' && requestedErrorId
      ? await getPendingStudyErrorOnboarding(user.id, requestedErrorId)
      : null;
  const onboardingActive =
    Boolean(pendingOnboardingErrorId) &&
    data.pending.some((item) => item.id === pendingOnboardingErrorId);

  return (
    <StudyErrorsClient
      data={data}
      initialMaterialId={params.material && isUuid(params.material) ? params.material : undefined}
      onboarding={{
        active: onboardingActive,
        errorId: onboardingActive ? pendingOnboardingErrorId : null,
      }}
    />
  );
}
