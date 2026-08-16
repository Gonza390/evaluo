import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { BookOpen, Clock3, Target } from 'lucide-react';
import { JsonLd } from '@/components/seo/JsonLd';
import { getOfficialCareerProfile } from '@/lib/career-profiles';
import { buildBreadcrumbJsonLd } from '@/lib/seo';
import {
  buildSeoEntitySlug,
  buildSimulatorLandingDescription,
  parseSeoEntitySlug,
} from '@/lib/seo-intents';
import { getCarreraById, getMateriasByCarrera, getUniversidadById } from '@/services/api-server';

export const revalidate = 600;

type PageProps = {
  params: Promise<{
    carrera: string;
  }>;
};

function buildSimulatorHref(carreraNombre: string, carreraId: string) {
  return `/simulador-parcial/${buildSeoEntitySlug(carreraNombre, carreraId)}`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const carreraId = parseSeoEntitySlug(resolvedParams.carrera).id;

  try {
    const carrera = await getCarreraById(carreraId);
    if (!carrera) {
      return {
        title: 'Simulador de parcial',
        robots: {
          index: false,
          follow: false,
        },
      };
    }
    const universidad = carrera.universidad_id
      ? await getUniversidadById(carrera.universidad_id)
      : null;
    const materias = await getMateriasByCarrera(carrera.id);

    const description = buildSimulatorLandingDescription({
      carreraNombre: carrera.nombre,
      universidadNombre: universidad?.nombre ?? 'tu universidad',
      materiasCount: materias.length,
    });

    return {
      title: `Pregunteros y simuladores de ${carrera.nombre}`,
      description,
      alternates: {
        canonical: buildSimulatorHref(carrera.nombre, carrera.id),
      },
      openGraph: {
        title: `Pregunteros y simuladores de ${carrera.nombre} | Evaluo`,
        description,
        url: buildSimulatorHref(carrera.nombre, carrera.id),
        images: [{ url: '/opengraph-image.png', width: 1200, height: 630 }],
      },
    };
  } catch {
    return {
      title: 'Simulador de parcial',
      robots: {
        index: false,
        follow: false,
      },
    };
  }
}

export default async function CareerSimulatorIntentPage({ params }: PageProps) {
  const resolvedParams = await params;
  const carreraId = parseSeoEntitySlug(resolvedParams.carrera).id;
  const carrera = await getCarreraById(carreraId);

  if (!carrera) {
    notFound();
  }

  const universidad = carrera.universidad_id ? await getUniversidadById(carrera.universidad_id) : null;
  const materias = await getMateriasByCarrera(carrera.id);
  const canonicalHref = buildSimulatorHref(carrera.nombre, carrera.id);

  if (resolvedParams.carrera !== buildSeoEntitySlug(carrera.nombre, carrera.id)) {
    redirect(canonicalHref);
  }

  const officialProfile = getOfficialCareerProfile({
    universidadNombre: universidad?.nombre,
    carreraNombre: carrera.nombre,
  });

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: 'Inicio', path: '/' },
          { name: 'Explorar', path: '/explorar' },
          { name: `Pregunteros y simuladores de ${carrera.nombre}`, path: canonicalHref },
        ])}
      />

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="inline-flex items-center gap-2 rounded-full bg-[#EEF4FF] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#2563EB]">
            <Target className="h-4 w-4" />
            Pregunteros y simuladores
          </p>
          <h1 className="mt-5 text-4xl font-bold tracking-[-0.06em] text-slate-950 sm:text-5xl">
            Pregunteros y simuladores de {carrera.nombre}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">
            {buildSimulatorLandingDescription({
              carreraNombre: carrera.nombre,
              universidadNombre: universidad?.nombre ?? 'tu universidad',
              materiasCount: materias.length,
            })}
          </p>
          {officialProfile?.description ? (
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-500">
              Esta carrera está orientada a{' '}
              {officialProfile.description.charAt(0).toLowerCase() + officialProfile.description.slice(1)}
            </p>
          ) : null}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold tracking-[-0.04em] text-slate-950">
              Cómo aprovechar esta ruta de práctica
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <article className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <Clock3 className="h-5 w-5 text-[#2563EB]" />
                <p className="mt-3 text-sm font-semibold text-slate-950">Práctica con tiempo real</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Entrena con una lógica cercana al examen y toma decisiones bajo presión.
                </p>
              </article>
              <article className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <BookOpen className="h-5 w-5 text-[#2563EB]" />
                <p className="mt-3 text-sm font-semibold text-slate-950">{materias.length} materias para revisar</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Entrá a cada materia y buscá parciales, errores frecuentes y materiales complementarios.
                </p>
              </article>
              <article className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <Target className="h-5 w-5 text-[#2563EB]" />
                <p className="mt-3 text-sm font-semibold text-slate-950">Ruta de mejora continua</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Combina simulador, resúmenes y recursos para cerrar huecos antes de rendir.
                </p>
              </article>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`/materias?carreraId=${encodeURIComponent(carrera.id)}`}
                className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#6366F1] px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(37,99,235,0.18)] transition hover:from-[#1D4ED8] hover:to-[#4F46E5]"
              >
                Ver materias de {carrera.nombre}
              </Link>
              {universidad ? (
                <Link
                  href={`/estudiar/${buildSeoEntitySlug(universidad.nombre, universidad.id)}/${buildSeoEntitySlug(carrera.nombre, carrera.id)}`}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
                >
                  Ver guía de carrera
                </Link>
              ) : null}
            </div>
          </div>

          <aside className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold tracking-[-0.04em] text-slate-950">Materias donde empezar</h2>
            <div className="mt-5 space-y-3">
              {materias.slice(0, 8).map((materia) => (
                <Link
                  key={materia.id}
                  href={`/explorar/materia/${materia.id}?carreraId=${encodeURIComponent(carrera.id)}`}
                  className="block rounded-2xl border border-slate-200 px-4 py-3 transition hover:border-[#BFDBFE] hover:bg-[#F8FBFF]"
                >
                  <p className="text-sm font-semibold text-slate-900">{materia.nombre}</p>
                  <p className="mt-1 text-xs text-slate-500">Ir a recursos, resúmenes y simulador</p>
                </Link>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
