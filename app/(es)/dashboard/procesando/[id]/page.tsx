import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { createClientServer } from '@/lib/supabase-server';
import { getStudentMaterialProcessingStateAction } from '@/app/dashboard/materiales/actions';
import { FullscreenProcessing } from '@/components/pdf-processing/fullscreen-processing';
import { isUuid } from '@/lib/uuid';

export const metadata: Metadata = {
  title: 'Preparando material | Evaluo',
  robots: { index: false, follow: false },
};

export default async function ProcessingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const supabase = await createClientServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/dashboard');
  const state = await getStudentMaterialProcessingStateAction(id);
  if (!state) notFound();
  return <FullscreenProcessing initialState={state} />;
}
