import type { Metadata } from 'next';
import { buildMateriaMetadata, renderMateriaPage, type MateriaQuery } from './materia-page';

// Ruta dinámica: solo atiende visitas con carreraId, tab, modulo o creador.
// Las demás las reescribe proxy.ts a /explorar/materia-cache/[id] (ISR).
interface PageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<MateriaQuery>;
}

export const revalidate = 600;

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const [resolvedParams, resolvedSearchParams] = await Promise.all([
    params,
    searchParams ?? Promise.resolve({} as MateriaQuery),
  ]);
  return buildMateriaMetadata(resolvedParams, resolvedSearchParams);
}

export default async function MateriaPage({ params, searchParams }: PageProps) {
  const [resolvedParams, resolvedSearchParams] = await Promise.all([
    params,
    searchParams ?? Promise.resolve({} as MateriaQuery),
  ]);
  return renderMateriaPage(resolvedParams, resolvedSearchParams);
}
