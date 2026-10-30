import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { FileText, ArrowRight } from 'lucide-react';
import { createClientServer } from '@/lib/supabase-server';
import { isUuid } from '@/lib/uuid';

export const metadata: Metadata = {
  title: 'Progreso de tu PDF',
  robots: { index: false, follow: false },
};

export default async function PdfProgressPage({
  searchParams,
}: {
  searchParams: Promise<{ material?: string; error?: string; from?: string }>;
}) {
  const { material: materialId, error: requestedError, from } = await searchParams;
  if (materialId && !isUuid(materialId)) notFound();
  const supabase = await createClientServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    redirect(
      `/login?next=${encodeURIComponent(`/dashboard/progreso${materialId ? `?material=${materialId}` : ''}`)}`
    );

  // Verificar pertenencia antes de consultar el resumen y los errores del material.
  let query = supabase
    .from('student_materials')
    .select('id, title')
    .eq('user_id', user.id)
    .eq('processing_status', 'ready')
    .order('updated_at', { ascending: false });
  if (materialId) query = query.eq('id', materialId);
  const { data: materials, error } = await query;
  if (error) throw new Error('No pudimos cargar tus materiales. Intentá nuevamente.');
  const material = materialId ? materials?.find((item) => item.id === materialId) : null;
  if (materialId && !material) notFound();
  if (!material)
    return (
      <div className="mx-auto w-full max-w-[1240px] px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-5">
        <h1 className="text-[20px] font-bold leading-[1.3] tracking-[-0.04em] sm:text-[22px]">Tu progreso</h1>
        <p className="text-muted-foreground mt-1.5 text-[13px] leading-5">
          Elegí un PDF para ver sus temas y los errores que registraste.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {materials?.map((item) => (
            <Link
              key={item.id}
              href={`/dashboard/progreso?material=${item.id}`}
              className="border-border bg-card hover:border-primary focus-visible:outline-ring flex min-w-0 items-center gap-3 rounded-xl border p-3.5 text-[13px] transition focus-visible:outline-2"
            >
              <FileText className="text-primary shrink-0" size={22} />
              <span className="min-w-0 flex-1 font-medium break-words">{item.title}</span>
              <ArrowRight size={18} className="text-primary shrink-0" />
            </Link>
          ))}
        </div>
        {!materials?.length && (
          <div className="border-border mt-4 rounded-xl border p-4 text-[13px]">
            <p>Todavía no tenés PDFs procesados.</p>
            <Link
              href="/dashboard/materiales?openUpload=1"
              className="text-primary mt-4 inline-flex text-sm font-semibold"
            >
              Subir un PDF
              <ArrowRight size={17} className="ml-2" />
            </Link>
          </div>
        )}
      </div>
    );
  const destination = new URLSearchParams({ tab: 'progreso' });
  if (requestedError) destination.set('error', requestedError.slice(0, 80));
  if (from === 'errores') destination.set('from', from);
  redirect(`/materiales/${material.id}?${destination}`);
}
