import type { ReactNode } from 'react';
import { SeoBreadcrumbs } from '@/components/seo/SeoBreadcrumbs';
import { buildSeoEntitySlug, parseSeoEntitySlug } from '@/lib/seo-intents';
import { createPublicClient } from '@/lib/supabase-public';

export default async function CareerStudyLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ universidad: string; carrera: string }>;
}) {
  const resolvedParams = await params;
  const universidadId = parseSeoEntitySlug(resolvedParams.universidad).id;
  const carreraId = parseSeoEntitySlug(resolvedParams.carrera).id;
  const client = createPublicClient();

  const [universidadResult, carreraResult] = await Promise.all([
    client.from('universidades').select('id, nombre').eq('id', universidadId).maybeSingle(),
    client
      .from('carreras')
      .select('id, nombre, universidad_id')
      .eq('id', carreraId)
      .maybeSingle(),
  ]);

  const universidad = universidadResult.data;
  const carrera = carreraResult.data;
  if (!universidad || !carrera || carrera.universidad_id !== universidad.id) return children;

  const canonicalPath = `/estudiar/${buildSeoEntitySlug(
    universidad.nombre,
    universidad.id
  )}/${buildSeoEntitySlug(carrera.nombre, carrera.id)}`;

  return (
    <>
      <SeoBreadcrumbs
        items={[
          { name: 'Inicio', path: '/' },
          { name: 'Explorar', path: '/explorar' },
          { name: universidad.nombre, path: `/universidad/${universidad.id}` },
          { name: carrera.nombre, path: canonicalPath },
        ]}
        structuredData={false}
      />
      {children}
    </>
  );
}
