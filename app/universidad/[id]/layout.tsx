import type { ReactNode } from 'react';
import { SeoBreadcrumbs } from '@/components/seo/SeoBreadcrumbs';
import { createPublicClient } from '@/lib/supabase-public';

export default async function UniversidadLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = createPublicClient();
  const { data: universidad } = await client
    .from('universidades')
    .select('id, nombre')
    .eq('id', id)
    .maybeSingle();

  if (!universidad) return children;

  return (
    <>
      <SeoBreadcrumbs
        items={[
          { name: 'Inicio', path: '/' },
          { name: 'Explorar', path: '/explorar' },
          { name: universidad.nombre, path: `/universidad/${universidad.id}` },
        ]}
        className="max-w-7xl"
        structuredData={false}
      />
      {children}
    </>
  );
}
