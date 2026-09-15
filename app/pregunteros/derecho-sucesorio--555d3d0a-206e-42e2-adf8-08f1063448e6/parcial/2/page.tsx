import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { FooterHome } from '@/components/footer-home';
import { MarketingAnalyticsSlot } from '@/components/MarketingAnalyticsSlot';
import { PregunteroDerechoSucesorioPlan } from '@/components/marketing/preguntero-derecho-sucesorio-plan';
import { PublicSiteHeader } from '@/components/marketing/public-site-header';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildBreadcrumbJsonLd } from '@/lib/seo';
import { buildSeoEntitySlug } from '@/lib/seo-intents';
import { buildPregunteroParcialSearchTitle } from '@/lib/seo-search-copy';
import { buildParcialHref, getPregunteroParcialData } from '@/lib/data/preguntero';

export const revalidate = 600;

const MATERIA_ID = '555d3d0a-206e-42e2-adf8-08f1063448e6';
const PARCIAL = '2' as const;

function buildDescription(input: {
  materiaNombre: string;
  carreraNombre?: string;
  universidadNombre?: string;
  totalPreguntas: number;
}) {
  const context = [input.carreraNombre, input.universidadNombre].filter(Boolean).join(' en ');
  const base =
    input.totalPreguntas > 0
      ? `${input.totalPreguntas.toLocaleString('es-AR')} preguntas para practicar el parcial 2 de ${input.materiaNombre}`
      : `Practicá el parcial 2 de ${input.materiaNombre}`;

  return context
    ? `${base} para ${context}. Simulá el examen y revisá tus errores en Evaluo.`
    : `${base}. Simulá el examen y revisá tus errores en Evaluo.`;
}

export async function generateMetadata(): Promise<Metadata> {
  const data = await getPregunteroParcialData(MATERIA_ID, PARCIAL);
  if (!data) {
    return { title: 'Preguntero', robots: { index: false, follow: false } };
  }

  const canonicalHref = buildParcialHref(data.materiaNombre, data.materiaId, data.parcial);
  const description = buildDescription({
    materiaNombre: data.materiaNombre,
    carreraNombre: data.carreraNombre,
    universidadNombre: data.universidadNombre,
    totalPreguntas: data.totalPreguntas,
  });
  const seoTitle = buildPregunteroParcialSearchTitle({
    materiaNombre: data.materiaNombre,
    parcial: data.parcial,
    universityName: data.universidadNombre,
  });

  return {
    title: seoTitle,
    description,
    alternates: { canonical: canonicalHref },
    robots: { index: data.totalPreguntas > 0, follow: true },
    openGraph: {
      title: `${seoTitle} | Evaluo`,
      description,
      url: canonicalHref,
      images: [{ url: '/opengraph-image.png', width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${seoTitle} | Evaluo`,
      description,
      images: ['/opengraph-image.png'],
    },
  };
}

export default async function DerechoSucesorioParcial2Page() {
  const data = await getPregunteroParcialData(MATERIA_ID, PARCIAL);
  if (!data) notFound();

  const materiaSlug = buildSeoEntitySlug(data.materiaNombre, data.materiaId);
  const canonicalHref = buildParcialHref(data.materiaNombre, data.materiaId, data.parcial);
  const pregunteroHref = `/pregunteros/${materiaSlug}`;
  const materiaHref = `/explorar/materia/${materiaSlug}`;
  const resumenHref = `/resumenes/${materiaSlug}`;
  const simuladorHref = `/simulador/${data.materiaId}/${data.parcialNumero}`;
  const uploadHref = `/dashboard/materiales/subir?materiaId=${data.materiaId}&source=preguntero-derecho-sucesorio-p2-plan`;
  const title = `Preguntero parcial 2 de ${data.materiaNombre}`;

  const breadcrumbData = buildBreadcrumbJsonLd([
    { name: 'Inicio', path: '/' },
    { name: 'Pregunteros', path: '/pregunteros' },
    { name: `Preguntero de ${data.materiaNombre}`, path: pregunteroHref },
    { name: title, path: canonicalHref },
  ]);

  return (
    <div className="w-full overflow-x-clip bg-white text-slate-950">
      <MarketingAnalyticsSlot />
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-8 lg:px-10">
          <PublicSiteHeader primaryHref={uploadHref} trackingLocation="preguntero_sucesorio_plan_header" />
        </div>
      </div>

      <main className="min-h-screen">
        <JsonLd data={breadcrumbData} />
        <PregunteroDerechoSucesorioPlan
          title={title}
          materiaNombre={data.materiaNombre}
          universidadNombre={data.universidadNombre}
          carreraNombre={data.carreraNombre}
          totalPreguntas={data.totalPreguntas}
          samplePreguntas={data.samplePreguntas}
          simuladorHref={simuladorHref}
          pregunteroHref={pregunteroHref}
          materiaHref={materiaHref}
          resumenHref={resumenHref}
          uploadHref={uploadHref}
          parcial1Href={`/pregunteros/${materiaSlug}/parcial/1`}
          integradorHref={`/pregunteros/${materiaSlug}/parcial/integrador`}
        />
      </main>

      <FooterHome />
    </div>
  );
}
