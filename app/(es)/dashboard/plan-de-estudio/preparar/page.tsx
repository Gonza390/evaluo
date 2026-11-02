import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClientServer } from '@/lib/supabase-server';
import { fetchStudentMaterialsByUser } from '@/lib/data/student-materials';
import { StudyPlanSetup } from '@/components/dashboard/study-plan-setup';

export const metadata: Metadata = { title:'Preparar mi plan | Evaluo', robots:{index:false,follow:false} };

export default async function PrepareStudyPlanPage() {
  const supabase = await createClientServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/dashboard/plan-de-estudio/preparar');
  const materials = (await fetchStudentMaterialsByUser(supabase,user.id))
    .filter(material=>material.processing_status==='ready')
    .map(material=>({id:material.id,title:material.title,topicCount:0}));
  return <StudyPlanSetup materials={materials}/>;
}
