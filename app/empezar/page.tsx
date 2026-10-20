import { redirect } from 'next/navigation';
import { createClientServer } from '@/lib/supabase-server';
import { fetchStudentMaterialsByUser } from '@/lib/data/student-materials';

/** Entrada anterior: ir a la carga unificada en lugar de mostrar otro tutorial. */
export default async function EmpezarPage() {
  const supabase = await createClientServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent('/dashboard?openUpload=1&source=onboarding')}&reason=guided-start`);
  }

  const materials = await fetchStudentMaterialsByUser(supabase, user.id);
  if (materials.length > 0) {
    redirect('/dashboard');
  }
  redirect('/dashboard?openUpload=1&source=onboarding');
}
