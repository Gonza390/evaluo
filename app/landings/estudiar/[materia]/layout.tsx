import type { ReactNode } from 'react';
import { SeoBreadcrumbs } from '@/components/seo/SeoBreadcrumbs';
import { getMateriaBootstrap } from '@/lib/data/materia-bootstrap';
import { buildSeoEntitySlug, parseSeoEntitySlug } from '@/lib/seo-intents';

export default async function EstudiarMateriaLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ materia: string }>;
}) {
  const { materia } = await params;
  const materiaId = parseSeoEntitySlug(materia).id;
  const bootstrap = await getMateriaBootstrap({ materiaId });

  if (bootstrap.materiaFound === false) return children;

  const materiaSlug = buildSeoEntitySlug(bootstrap.materiaNombre, bootstrap.materiaId);

  return (
    <>
      <SeoBreadcrumbs
        items={[
          { name: 'Inicio', path: '/' },
          { name: 'Explorar', path: '/explorar' },
          {
            name: bootstrap.materiaNombre,
            path: `/explorar/materia/${materiaSlug}`,
          },
          {
            name: `Cómo estudiar ${bootstrap.materiaNombre}`,
            path: `/landings/estudiar/${materiaSlug}`,
          },
        ]}
        className="max-w-[1240px]"
      />
      {children}
    </>
  );
}
