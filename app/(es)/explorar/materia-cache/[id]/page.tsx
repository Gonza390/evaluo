import type { Metadata } from 'next';
import { buildMateriaMetadata, renderMateriaPage } from '../../materia/[id]/materia-page';
import { getMateriaCachePrebuildParams } from '@/lib/catalog-prebuild';

// Versión cacheada (ISR) de /explorar/materia/[id] para visitas sin parámetros.
// proxy.ts reescribe acá sin cambiar la URL; un acceso directo a esta ruta se
// redirige a /explorar/materia/[id]. No lee searchParams para poder cachearse.
interface PageProps {
  params: Promise<{ id: string }>;
}

// 6 h: la mayoría de las visitas son buscadores que vuelven a pasar por la
// misma URL; con 10 min la página se regeneraba casi en cada pasada.
export const revalidate = 21600;

// Producción: las materias se prearman en el build (ver lib/catalog-prebuild.ts).
export function generateStaticParams() {
  return getMateriaCachePrebuildParams();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return buildMateriaMetadata(await params, {});
}

export default async function CachedMateriaPage({ params }: PageProps) {
  return renderMateriaPage(await params, {});
}
