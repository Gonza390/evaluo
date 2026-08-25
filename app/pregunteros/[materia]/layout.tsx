import type { ReactNode } from 'react';
import { PregunteroVisibleBreadcrumbs } from '@/components/seo/PregunteroVisibleBreadcrumbs';
import { getMateriaBootstrap } from '@/lib/data/materia-bootstrap';
import { buildSeoEntitySlug, parseSeoEntitySlug } from '@/lib/seo-intents';

export default async function PregunteroLayout({
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

  return (
    <>
      <PregunteroVisibleBreadcrumbs
        materiaNombre={bootstrap.materiaNombre}
        materiaSlug={buildSeoEntitySlug(bootstrap.materiaNombre, bootstrap.materiaId)}
      />
      {children}
    </>
  );
}
