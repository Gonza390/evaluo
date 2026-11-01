import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClientServer } from '@/lib/supabase-server';
import { fetchStudentMaterialsByUser } from '@/lib/data/student-materials';
import { PracticeModePicker } from '@/components/dashboard/practice-mode-picker';
import { getPracticeHistory } from '@/lib/student-materials/practice-history';

export const metadata: Metadata = {
  title: 'Practicar | Evaluo',
  robots: { index: false, follow: false },
};

export default async function PracticeHomePage() {
  const supabase = await createClientServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/dashboard/practicar');

  const materials = (await fetchStudentMaterialsByUser(supabase, user.id))
    .filter(material => material.processing_status === 'ready')
    .map(material => ({ id: material.id, title: material.title }));

  let lastOpenedMaterialId: string | null = null;
  if (materials.length) {
    const { data: recentOpens } = await supabase
      .from('analytics_events')
      .select('metadata')
      .eq('user_id', user.id)
      .eq('event_name', 'student_material_study_opened')
      .order('created_at', { ascending: false })
      .limit(40);
    const ids = new Set(materials.map(material => material.id));
    lastOpenedMaterialId = (recentOpens ?? [])
      .map(event => event.metadata && typeof event.metadata === 'object' && !Array.isArray(event.metadata)
        ? (event.metadata as Record<string, unknown>).material_id : null)
      .find((id): id is string => typeof id === 'string' && ids.has(id)) ?? null;
  }

  const history = await getPracticeHistory(user.id, materials.map(material => material.id));

  return <PracticeModePicker materials={materials} initialMaterialId={lastOpenedMaterialId}
    history={history} advancedPracticeEnabled={process.env.PRACTICE_BANK_ENABLED === '1'} />;
}
