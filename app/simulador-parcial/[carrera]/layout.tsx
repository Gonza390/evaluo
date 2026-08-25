import type { ReactNode } from 'react';
import { SeoBreadcrumbs } from '@/components/seo/SeoBreadcrumbs';
import { buildSeoEntitySlug, parseSeoEntitySlug } from '@/lib/seo-intents';
import { createPublicClient } from '@/lib/supabase-public';

export default async function CareerSimulatorLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ carrera: string }>;
}) {
  const { carrera: carreraRoute } = await params;
  const carreraId = parseSeoEntitySlug(carreraRoute).id;
  const client = createPublicClient();
  const { data: carrera } = await client
    .from('carreras')
    .select('id, nombre, universidad_id')
    .eq('id', carreraId)
    .maybeSingle();

  if (!carrera) return children;

  const universidad = carrera.universidad_id
    ? (
        await client
          .from('universidades')
          .select('id, nombre')
          .eq('id', carrera.universidad_id)
          .maybeSingle()
      ).data
    : null;

  const items = [
    { name: 'Inicio', path: '/' },
    { name: 'Explorar', path: '/explorar' },
  ];

  if (universidad) {
    items.push({ name: universidad.nombre, path: `/universidad/${universidad.id}` });
    items.push({
      name: carrera.nombre,
      path: `/estudiar/${buildSeoEntitySlug(universidad.nombre, universidad.id)}/${buildSeoEntitySlug(
        carrera.nombre,
        carrera.id
      )}`,
    });
  }

  items.push({
    name: `Simuladores de ${carrera.nombre}`,
    path: `/simulador-parcial/${buildSeoEntitySlug(carrera.nombre, carrera.id)}`,
  });

  return (
    <>
      <SeoBreadcrumbs items={items} structuredData={false} />
      {children}
    </>
  );
}
