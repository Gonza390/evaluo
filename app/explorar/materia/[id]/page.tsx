import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getCanonicalMateriaId } from '@/lib/materia-aliases';
import { isUuid } from '@/lib/uuid';
import { getMateriaBootstrap } from '@/lib/data/materia-bootstrap';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildBreadcrumbJsonLd, buildLearningResourceJsonLd } from '@/lib/seo';
import { getMateriaSeoContentSignals } from '@/lib/seo-content-signals';
import { buildSeoEntitySlug, parseSeoEntitySlug } from '@/lib/seo-intents';
import { buildShareCardPath } from '@/lib/share-card';
import {
  buildMateriaSharePath,
  getApprovedShareCreatorLabel,
} from '@/lib/materia-share-path';
import { createPublicClient } from '@/lib/supabase-public';
import { fetchSharedStudentMaterialsByMateria } from '@/lib/data/student-materials';
import MateriaStudyHome from './materia-study-home';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{
    carreraId?: string;
    tab?: string;
    modulo?: string;
    creador?: string;
  }>;
}

export const revalidate = 600;

function resolveMateriaId(routeValue: string) {
  return getCanonicalMateriaId(parseSeoEntitySlug(routeValue).id);
}

function buildMateriaQuery(searchParams: {
  carreraId?: string;
  tab?: string;
  modulo?: string;
  creador?: string;
}) {
  const params = new URLSearchParams();
  const carreraId = searchParams.carreraId?.trim();
  const tab = searchParams.tab?.trim();
  const modulo = searchParams.modulo?.trim();
  const creador = searchParams.creador?.trim();

  if (carreraId) params.set('carreraId', carreraId);
  if (tab) params.set('tab', tab);
  if (modulo) params.set('modulo', modulo);
  if (creador) params.set('creador', creador);

  const query = params.toString();
  return query ? `?${query}` : '';
}

async function getMateriaStudyHomeData(materiaId: string) {
  const client = createPublicClient();

  const [partial1, partial2, sharedStudentMaterials] = await Promise.all([
    client
      .from('preguntas_banco_public')
      .select('id', { count: 'exact', head: true })
      .eq('materia_id', materiaId)
      .eq('parcial', 1),
    client
      .from('preguntas_banco_public')
      .select('id', { count: 'exact', head: true })
      .eq('materia_id', materiaId)
      .eq('parcial', 2),
    fetchSharedStudentMaterialsByMateria(client, materiaId, 6).catch(() => []),
  ]);

  const partial1Count = partial1.error ? 0 : (partial1.count ?? 0);
  const partial2Count = partial2.error ? 0 : (partial2.count ?? 0);

  return {
    questionCounts: {
      1: partial1Count,
      2: partial2Count,
      3: partial1Count + partial2Count,
    } as Record<1 | 2 | 3, number>,
    sharedStudentMaterials,
  };
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const [resolvedParams, resolvedSearchParams] = await Promise.all([
    params,
    searchParams ?? Promise.resolve({} as { creador?: string }),
  ]);
  const canonicalMateriaId = resolveMateriaId(resolvedParams.id);
  const [bootstrap, contentSignals] = await Promise.all([
    getMateriaBootstrap({
      materiaId: canonicalMateriaId,
      requestedCarreraId: '',
    }),
    getMateriaSeoContentSignals(canonicalMateriaId),
  ]);
  const materiaNombre = bootstrap.materiaNombre?.trim() || 'Materia';
  const universidadNombre = bootstrap.universidadNombre?.trim();
  const creatorLabel = getApprovedShareCreatorLabel(resolvedSearchParams.creador);
  const canonicalHref = `/explorar/materia/${buildSeoEntitySlug(materiaNombre, canonicalMateriaId)}`;
  const socialHref = universidadNombre
    ? buildMateriaSharePath(materiaNombre, universidadNombre)
    : canonicalHref;
  const hasStudyMaterial =
    contentSignals.summaryCount +
      contentSignals.summaryResourceCount +
      contentSignals.resourceCount >
    0;

  let description: string;
  if (contentSignals.questionCount > 0) {
    description = `Prepará ${materiaNombre}${universidadNombre ? ` en ${universidadNombre}` : ''} con modelos de examen para practicar y explicación de cada respuesta${hasStudyMaterial ? ', más resúmenes y material de estudio' : ''}.`;
  } else if (hasStudyMaterial) {
    description = `Prepará ${materiaNombre}${universidadNombre ? ` en ${universidadNombre}` : ''} con resúmenes y material de estudio disponibles en Evaluo.`;
  } else {
    description = `Prepará ${materiaNombre}${universidadNombre ? ` en ${universidadNombre}` : ''} con material de estudio, práctica y herramientas de Evaluo.`;
  }

  if (creatorLabel) {
    description = `${description} Contenido compartido con ${creatorLabel}.`;
  }

  const seoTitle = universidadNombre
    ? `${materiaNombre} - ${universidadNombre}`
    : `Guía y recursos de ${materiaNombre}`;
  const socialTitle = creatorLabel
    ? `${materiaNombre} — con ${creatorLabel} | Evaluo`
    : `${seoTitle} | Evaluo`;
  const socialImage = buildShareCardPath({
    kind: 'materia',
    title: materiaNombre,
    subtitle: universidadNombre || 'Recursos de estudio',
    detail:
      contentSignals.questionCount > 0
        ? 'Modelos de examen con explicación de cada respuesta'
        : 'Recursos, práctica y material de estudio en un solo lugar',
  });

  return {
    title: seoTitle,
    description,
    alternates: {
      canonical: canonicalHref,
    },
    openGraph: {
      title: socialTitle,
      description,
      url: socialHref,
      images: [
        { url: socialImage, width: 1200, height: 630, alt: `${materiaNombre} en Evaluo` },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: socialTitle,
      description,
      images: [socialImage],
    },
    robots: {
      index: bootstrap.materiaFound !== false && contentSignals.hasAcademicContent,
      follow: true,
    },
  };
}

export default async function MateriaPage({ params, searchParams }: PageProps) {
  const [resolvedParams, resolvedSearchParams] = await Promise.all([
    params,
    searchParams ??
      Promise.resolve({} as {
        carreraId?: string;
        tab?: string;
        modulo?: string;
        creador?: string;
      }),
  ]);
  const parsedMateriaId = parseSeoEntitySlug(resolvedParams.id).id;
  const canonicalMateriaId = getCanonicalMateriaId(parsedMateriaId);

  if (canonicalMateriaId !== parsedMateriaId) {
    redirect(`/explorar/materia/${canonicalMateriaId}${buildMateriaQuery(resolvedSearchParams)}`);
  }

  const materiaId = canonicalMateriaId;
  if (!isUuid(materiaId)) {
    return notFound();
  }

  const requestedCarreraId = resolvedSearchParams.carreraId?.trim() ?? '';
  const [bootstrap, studyHomeData] = await Promise.all([
    getMateriaBootstrap({
      materiaId,
      requestedCarreraId,
    }),
    getMateriaStudyHomeData(materiaId),
  ]);

  if (bootstrap.materiaFound === false) {
    return notFound();
  }

  const canonicalSegment = buildSeoEntitySlug(bootstrap.materiaNombre, materiaId);
  if (resolvedParams.id.includes('--') && resolvedParams.id !== canonicalSegment) {
    redirect(`/explorar/materia/${canonicalSegment}${buildMateriaQuery(resolvedSearchParams)}`);
  }

  const canonicalHref = `/explorar/materia/${canonicalSegment}`;

  return (
    <>
      <JsonLd
        data={[
          buildBreadcrumbJsonLd([
            { name: 'Inicio', path: '/' },
            { name: 'Explorar', path: '/explorar' },
            { name: bootstrap.materiaNombre, path: canonicalHref },
          ]),
          buildLearningResourceJsonLd({
            name: bootstrap.materiaNombre,
            universityName: bootstrap.universidadNombre,
            careerName: bootstrap.carreraNombre,
            url: canonicalHref,
          }),
        ]}
      />
      <MateriaStudyHome
        materiaId={materiaId}
        materiaNombre={bootstrap.materiaNombre}
        carreraId={bootstrap.carreraId || requestedCarreraId || undefined}
        carreraNombre={bootstrap.carreraNombre}
        universidadId={bootstrap.universidadId}
        universidadNombre={bootstrap.universidadNombre}
        contextError={bootstrap.contextError}
        initialResumenes={bootstrap.initialResumenes}
        initialResumenesError={bootstrap.initialResumenesError}
        sharedStudentMaterials={studyHomeData.sharedStudentMaterials}
        questionCounts={studyHomeData.questionCounts}
      />
    </>
  );
}
