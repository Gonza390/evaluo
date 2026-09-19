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

export default async function StudyErrorsPage() {
  const supabase = await createClientServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/dashboard/explicaciones');
  }

  const data = await getStudyErrorsPageData(user.id);

  return <StudyErrorsClient data={data} />;
}
