import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClientServer } from '@/lib/supabase-server';
import { fetchStudentMaterialsByUser } from '@/lib/data/student-materials';
import { StudyPlanSetup } from '@/components/dashboard/study-plan-setup';

export const metadata: Metadata = { title:'Preparar mi plan | Evaluo', robots:{index:false,follow:false} };

export default async function PrepareStudyPlanPage({ searchParams }: { searchParams?: Promise<{ material?: string }> }) {
  const supabase = await createClientServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/dashboard/plan-de-estudio/preparar');
  const ready = (await fetchStudentMaterialsByUser(supabase,user.id))
    .filter(material=>material.processing_status==='ready');
  const materials = await Promise.all(ready.map(async material => {
    const {data}=await supabase.from('student_material_summaries')
      .select('summary_sections').eq('student_material_id',material.id).maybeSingle();
    const sections=Array.isArray(data?.summary_sections) ? data.summary_sections : [];
    const topics=sections.map((section:unknown,index:number)=>{
      const item=section as {title?:string;body?:string};
      const words=(item.body??'').trim().split(/\s+/u).filter(Boolean).length;
      return {title:item.title?.trim()||`Tema ${index+1}`,estimatedMinutes:Math.max(10,Math.ceil(words/180)+10)};
    });
    return {id:material.id,title:material.title,topicCount:topics.length,topics};
  }));
  const materialId = (await searchParams)?.material;
  const selectedId = materials.some(m => m.id === materialId) ? materialId : undefined;
  const { data: selectedMaterial } = selectedId
    ? await supabase.from('student_materials').select('exam_date').eq('id', selectedId).eq('user_id', user.id).maybeSingle()
    : { data: null };
  // exam_date exists in remote Supabase but local generated DB types lag the schema.
  const examDate = (selectedMaterial as unknown as { exam_date?: string | null } | null)?.exam_date;
  const futureExamDate = typeof examDate === 'string' && /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(examDate) &&
    examDate >= new Date().toISOString().slice(0,10) ? examDate : undefined;
  return <StudyPlanSetup materials={materials} initialMaterialId={selectedId} initialExamDate={futureExamDate}/>;
}
