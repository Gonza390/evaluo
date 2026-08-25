import type { ReactNode } from 'react';
import { SeoBreadcrumbs, type SeoBreadcrumbItem } from '@/components/seo/SeoBreadcrumbs';
import { getMateriaBootstrap } from '@/lib/data/materia-bootstrap';
import { buildSeoEntitySlug, parseSeoEntitySlug } from '@/lib/seo-intents';

export default async function MateriaLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id: routeValue } = await params;
  const materiaId = parseSeoEntitySlug(routeValue).id;
  const bootstrap = await getMateriaBootstrap({ materiaId });

  if (bootstrap.materiaFound === false) return children;

  const canonicalMateriaPath = `/explorar/materia/${buildSeoEntitySlug(
    bootstrap.materiaNombre,
    bootstrap.materiaId
  )}`;
  const items: SeoBreadcrumbItem[] = [
    { name: 'Inicio', path: '/' },
    { name: 'Explorar', path: '/explorar' },
  ];

  if (bootstrap.universidadId && bootstrap.universidadNombre) {
    items.push({
      name: bootstrap.universidadNombre,
      path: `/universidad/${bootstrap.universidadId}`,
    });
  }

  if (
    bootstrap.carreraId &&
    bootstrap.carreraNombre &&
    bootstrap.universidadId &&
    bootstrap.universidadNombre
  ) {
    items.push({
      name: bootstrap.carreraNombre,
      path: `/estudiar/${buildSeoEntitySlug(
        bootstrap.universidadNombre,
        bootstrap.universidadId
      )}/${buildSeoEntitySlug(bootstrap.carreraNombre, bootstrap.carreraId)}`,
    });
  }

  items.push({ name: bootstrap.materiaNombre, path: canonicalMateriaPath });

  return (
    <>
      <SeoBreadcrumbs items={items} />
      {children}
    </>
  );
}
