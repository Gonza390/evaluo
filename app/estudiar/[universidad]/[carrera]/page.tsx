import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { BookOpen, GraduationCap, Sparkles, Target } from 'lucide-react';
import { JsonLd } from '@/components/seo/JsonLd';
import { getOfficialCareerProfile } from '@/lib/career-profiles';
import { buildBreadcrumbJsonLd } from '@/lib/seo';
import {
  buildCareerStudyDescription,
  buildSeoEntitySlug,
  parseSeoEntitySlug,
} from '@/lib/seo-intents';
import { getCarreraById, getMateriasByCarrera, getUniversidadById } from '@/services/api-server';

export const revalidate = 600;

type PageProps = {
  params: Promise<{
    universidad: string;
    carrera: string;
  }>;
};

function buildCareerHref(universidadId: string, universidadNombre: string, carreraId: string, carreraNombre: string) {
  return `/estudiar/${buildSeoEntitySlug(universidadNombre, universidadId)}/${buildSeoEntitySlug(carreraNombre, carreraId)}`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const universidadId = parseSeoEntitySlug(resolvedParams.universidad).id;
  const carreraId = parseSeoEntitySlug(resolvedParams.carrera).id;

  try {
    const [universidad, carrera] = await Promise.all([
      getUniversidadById(universidadId),
      getCarreraById(carreraId),
    ]);

    if (!universidad || !carrera) {
      return {
        title: 'Estudiar una carrera',
        robots: {
          index: false,
          follow: false,
        },
      };
    }

    const officialProfile = getOfficialCareerProfile({
      universidadNombre: universidad.nombre,
      carreraNombre: carrera.nombre,
    });

    const description = buildCareerStudyDescription({
      carreraNombre: carrera.nombre,
      universidadNombre: universidad.nombre,
      summary: officialProfile?.description,
    });

    return {
      title: `Estudiar ${carrera.nombre} en ${universidad.nombre}`,
      description,
      alternates: {
        canonical: buildCareerHref(universidad.id, universidad.nombre, carrera.id, carrera.nombre),
      },
      openGraph: {
        title: `Estudiar ${carrera.nombre} en ${universidad.nombre} | Evaluo`,
        description,
        url: buildCareerHref(universidad.id, universidad.nombre, carrera.id, carrera.nombre),
      },
    };
  } catch {
    return {
      title: 'Estudiar una carrera',
      robots: {
        index: false,
        follow: false,
      },
    };
  }
}

export default async function CareerStudyIntentPage({ params }: PageProps) {
  const resolvedParams = await params;
  const universidadId = parseSeoEntitySlug(resolvedParams.universidad).id;
  const carreraId = parseSeoEntitySlug(resolvedParams.carrera).id;

  const [universidad, carrera, materias] = await Promise.all([
    getUniversidadById(universidadId),
    getCarreraById(carreraId),
    getMateriasByCarrera(carreraId),
  ]);

  if (!universidad || !carrera) {
    notFound();
  }

  if (carrera.universidad_id && carrera.universidad_id !== universidad.id) {
    notFound();
  }

  const canonicalHref = buildCareerHref(universidad.id, universidad.nombre, carrera.id, carrera.nombre);
  if (
    resolvedParams.universidad !== buildSeoEntitySlug(universidad.nombre, universidad.id) ||
    resolvedParams.carrera !== buildSeoEntitySlug(carrera.nombre, carrera.id)
  ) {
    redirect(canonicalHref);
  }

  const officialProfile = getOfficialCareerProfile({
    universidadNombre: universidad.nombre,
    carreraNombre: carrera.nombre,
  });

  const highlightedMaterias = materias.slice(0, 8);

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: 'Inicio', path: '/' },
          { name: 'Explorar', path: '/explorar' },
          { name: universidad.nombre, path: `/universidad/${universidad.id}` },
          { name: `Estudiar ${carrera.nombre}`, path: canonicalHref },
        ])}
      />

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            <p className="inline-flex items-center gap-2 rounded-full bg-[#EEF4FF] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#2563EB]">
              <GraduationCap className="h-4 w-4" />
              Guía de carrera
            </p>
            <h1 className="mt-5 text-4xl font-black tracking-[-0.06em] text-slate-950 sm:text-5xl">
              Estudiar {carrera.nombre} en {universidad.nombre}
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">
              {buildCareerStudyDescription({
                carreraNombre: carrera.nombre,
                universidadNombre: universidad.nombre,
                summary: officialProfile?.description,
              })}
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <article className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-5">
              <BookOpen className="h-5 w-5 text-[#2563EB]" />
              <p className="mt-3 text-sm font-semibold text-slate-950">{materias.length} materias visibles</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Recorre el plan disponible y entra directo a las materias más buscadas.
              </p>
            </article>
            <article className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-5">
              <Target className="h-5 w-5 text-[#2563EB]" />
              <p className="mt-3 text-sm font-semibold text-slate-950">
                {officialProfile?.level ?? 'Grado'} {officialProfile?.duration ? `· ${officialProfile.duration}` : ''}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Información útil para entender el perfil académico y planificar tu recorrido.
              </p>
            </article>
            <article className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-5">
              <Sparkles className="h-5 w-5 text-[#2563EB]" />
              <p className="mt-3 text-sm font-semibold text-slate-950">Resúmenes, recursos y simuladores</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Usa Evaluo para estudiar con más claridad y practicar antes de rendir.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold tracking-[-0.04em] text-slate-950">
              Qué vas a encontrar para {carrera.nombre}
            </h2>
            <div className="mt-5 space-y-4">
              <p className="text-sm leading-7 text-slate-600">
                Esta guía reúne una entrada clara para quienes buscan estudiar {carrera.nombre} en{' '}
                {universidad.nombre}. Desde aquí puedes pasar al catálogo de materias, revisar recursos
                de estudio y descubrir cómo practicar con el simulador.
              </p>
              {officialProfile ? (
                <p className="text-sm leading-7 text-slate-600">
                  Según la información oficial disponible, el enfoque principal de la carrera está puesto en{' '}
                  {officialProfile.description.charAt(0).toLowerCase() + officialProfile.description.slice(1)}
                </p>
              ) : null}
              {officialProfile?.title ? (
                <p className="text-sm leading-7 text-slate-600">
                  Título orientativo: <strong className="text-slate-900">{officialProfile.title}</strong>
                </p>
              ) : null}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`/materias?carreraId=${encodeURIComponent(carrera.id)}`}
                className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#6366F1] px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(37,99,235,0.18)] transition hover:from-[#1D4ED8] hover:to-[#4F46E5]"
              >
                Ver materias de {carrera.nombre}
              </Link>
              <Link
                href={`/simulador-parcial/${buildSeoEntitySlug(carrera.nombre, carrera.id)}`}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
              >
                Ir a la guía de simuladores
              </Link>
            </div>
          </div>

          <aside className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold tracking-[-0.04em] text-slate-950">Materias para empezar</h2>
            <div className="mt-5 space-y-3">
              {highlightedMaterias.map((materia) => (
                <Link
                  key={materia.id}
                  href={`/explorar/materia/${materia.id}?carreraId=${encodeURIComponent(carrera.id)}`}
                  className="block rounded-2xl border border-slate-200 px-4 py-3 transition hover:border-[#BFDBFE] hover:bg-[#F8FBFF]"
                >
                  <p className="text-sm font-semibold text-slate-900">{materia.nombre}</p>
                  <p className="mt-1 text-xs text-slate-500">Ver resúmenes, recursos y simulador</p>
                </Link>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
