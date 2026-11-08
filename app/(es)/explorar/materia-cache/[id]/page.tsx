import type { Metadata } from 'next';
import { buildMateriaMetadata, renderMateriaPage } from '../../materia/[id]/materia-page';

// Versión cacheada (ISR) de /explorar/materia/[id] para visitas sin parámetros.
// proxy.ts reescribe acá sin cambiar la URL; un acceso directo a esta ruta se
// redirige a /explorar/materia/[id]. No lee searchParams para poder cachearse.
interface PageProps {
  params: Promise<{ id: string }>;
}

export const revalidate = 600;

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return buildMateriaMetadata(await params, {});
}

export default async function CachedMateriaPage({ params }: PageProps) {
  return renderMateriaPage(await params, {});
}
