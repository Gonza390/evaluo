import { redirect } from 'next/navigation';

export default async function DashboardMaterialsPage({
  searchParams,
}: {
  searchParams: Promise<{
    openUpload?: string;
    universidadId?: string;
    carreraId?: string;
    materiaId?: string;
    source?: string;
    examDate?: string;
    dailyMinutes?: string;
  }>;
}) {
  const params = await searchParams;
  const next = new URLSearchParams();

  if (params.openUpload === '1') next.set('openUpload', '1');
  if (params.universidadId) next.set('universidadId', params.universidadId);
  if (params.carreraId) next.set('carreraId', params.carreraId);
  if (params.materiaId) next.set('materiaId', params.materiaId);
  if (params.source) next.set('source', params.source);
  if (params.examDate) next.set('examDate', params.examDate);
  if (params.dailyMinutes) next.set('dailyMinutes', params.dailyMinutes);

  const query = next.toString();
  redirect(query ? `/dashboard?${query}` : '/dashboard');
}
