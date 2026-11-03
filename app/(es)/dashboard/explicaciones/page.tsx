import { redirect } from 'next/navigation';

// Compatibilidad para enlaces antiguos de Explicaciones y revisión de errores.
export default async function LegacyStudyPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; material?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const query = new URLSearchParams();
  if (params.error) query.set('error', params.error);
  if (params.material) query.set('material', params.material);
  redirect(`/dashboard/estudiar${query.size ? `?${query.toString()}` : ''}`);
}
