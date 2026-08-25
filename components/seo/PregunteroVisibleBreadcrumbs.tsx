'use client';

import { usePathname } from 'next/navigation';
import { SeoBreadcrumbs, type SeoBreadcrumbItem } from '@/components/seo/SeoBreadcrumbs';

export function PregunteroVisibleBreadcrumbs({
  materiaNombre,
  materiaSlug,
}: {
  materiaNombre: string;
  materiaSlug: string;
}) {
  const pathname = usePathname();
  const basePath = `/pregunteros/${materiaSlug}`;
  const items: SeoBreadcrumbItem[] = [
    { name: 'Inicio', path: '/' },
    { name: 'Pregunteros', path: '/pregunteros' },
    { name: `Preguntero de ${materiaNombre}`, path: basePath },
  ];

  const partialMatch = pathname.match(/\/parcial\/(1|2|integrador)(?:\/|$)/);
  if (partialMatch) {
    const parcial = partialMatch[1];
    items.push({
      name: parcial === 'integrador' ? 'Integrador' : `Parcial ${parcial}`,
      path: `${basePath}/parcial/${parcial}`,
    });
  }

  return <SeoBreadcrumbs items={items} structuredData={false} className="max-w-5xl" />;
}
