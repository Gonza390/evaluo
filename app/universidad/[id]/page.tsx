import type { Metadata } from 'next';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { notFound } from 'next/navigation';
import { ArrowLeft, BookOpen, GraduationCap } from 'lucide-react';
import { createPublicClient } from '@/lib/supabase-public';
import { unstable_cache } from 'next/cache';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildBreadcrumbJsonLd } from '@/lib/seo';
import { getUniversityProfile } from '@/lib/university-profiles';

const CareerListClient = dynamic(() => import('./career-list-client'), {
  loading: () => (
    <div className="pt-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-48 animate-pulse rounded-[28px] border border-slate-200 bg-white"
          />
        ))}
      </div>
    </div>
  ),
});

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ tab?: string }>;
};

type CarreraRow = {
  id: string;
  nombre: string;
};

const UNIVERSITY_SUBTITLE = 'Excelencia académica, compromiso social e innovación.';
const RELATIONS_PAGE_SIZE = 1000;

async function fetchAllCarreraMateriaRelations(
  supabase: ReturnType<typeof createPublicClient>,
  carreraIds: string[]
) {
  const allRows: Array<{ carrera_id: string | null }> = [];

  for (let from = 0; ; from += RELATIONS_PAGE_SIZE) {
    const to = from + RELATIONS_PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from('carrera_materias')
      .select('carrera_id')
      .in('carrera_id', carreraIds)
      .range(from, to);

    if (error) {
      throw error;
    }

    const rows = data ?? [];
    allRows.push(...rows);

    if (rows.length < RELATIONS_PAGE_SIZE) {
      break;
    }
  }

  return allRows;
}

function getUniversityInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 3)
    .map((chunk) => chunk[0]?.toUpperCase() ?? '')
    .join('');
}

type UniversidadPageData = {
  universidad: { id: string; nombre: string };
  allCarreras: CarreraRow[];
  materiaCountByCarrera: Record<string, number>;
} | null;

const loadUniversidadPageData = unstable_cache(
  async (id: string): Promise<UniversidadPageData> => {
    const supabase = createPublicClient();

    const { data: universidad } = await supabase
      .from('universidades')
      .select('id, nombre')
      .eq('id', id)
      .single();

    if (!universidad) {
      return null;
    }

    const { data: carrerasData } = await supabase
      .from('carreras')
      .select('id, nombre')
      .eq('universidad_id', id)
      .order('nombre');

    const allCarreras = (carrerasData ?? []) as CarreraRow[];
    const carreraIds = allCarreras.map((carrera) => carrera.id);
    const materiaCountByCarrera: Record<string, number> = {};

    if (carreraIds.length > 0) {
      const carreraMaterias = await fetchAllCarreraMateriaRelations(supabase, carreraIds);

      for (const item of carreraMaterias) {
        if (!item.carrera_id) continue;
        materiaCountByCarrera[item.carrera_id] = (materiaCountByCarrera[item.carrera_id] ?? 0) + 1;
      }
    }

    return { universidad, allCarreras, materiaCountByCarrera };
  },
  ['universidad-data'],
  { revalidate: 600, tags: ['universidad-data'] }
);

export async function generateMetadata({ params }: Pick<Props, 'params'>): Promise<Metadata> {
  const { id } = await params;
  const data = await loadUniversidadPageData(id);

  if (!data) {
    return {
      title: 'Universidad',
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const universidad = data.universidad;

  return {
    title: `${universidad.nombre} | Universidad`,
    description: `Explora carreras y materias de ${universidad.nombre} para estudiar con Evaluo.`,
    alternates: {
      canonical: `/universidad/${universidad.id}`,
    },
    openGraph: {
      title: `${universidad.nombre} | Evaluo`,
      description: `Carreras y materias disponibles de ${universidad.nombre}.`,
      url: `/universidad/${universidad.id}`,
    },
  };
}

export default async function UniversidadPage({ params, searchParams }: Props) {
  const [id, resolvedSearchParams] = await Promise.all([
    (await params).id,
    searchParams ?? Promise.resolve<{ tab?: string }>({}),
  ]);
  const activeTab = resolvedSearchParams?.tab === 'informacion' ? 'informacion' : 'carreras';

  const data = await loadUniversidadPageData(id);

  if (!data) {
    notFound();
  }

  const { universidad, allCarreras } = data;
  const materiaCountByCarrera = new Map(Object.entries(data.materiaCountByCarrera));

  const universityProfile = getUniversityProfile(universidad.nombre);
  const totalMaterias = Array.from(materiaCountByCarrera.values()).reduce((acc, count) => acc + count, 0);

  return (
    <div className="animate-page-enter min-h-full bg-[#F8FAFC]">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: 'Inicio', path: '/' },
          { name: 'Explorar', path: '/explorar' },
          { name: universidad.nombre, path: `/universidad/${id}` },
        ])}
      />
      <div className="w-full border-b border-[#E8EDF5] bg-[#F8FAFC]">
        <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 lg:px-8">
          <Link
            href="/explorar"
            className="flex items-center gap-2 text-sm font-medium text-[#64748B] transition hover:text-[#0F172A]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="font-poppins">Universidades</span>
          </Link>
        </div>
      </div>

      <section className="relative min-h-[220px] w-full overflow-hidden bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#334155] shadow-2xl sm:min-h-[280px]">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#0F172A_0%,#0F172A_28%,rgba(15,23,42,0.94)_42%,rgba(15,23,42,0.76)_56%,rgba(15,23,42,0.42)_70%,rgba(15,23,42,0.16)_84%,rgba(15,23,42,0.04)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_36%,rgba(99,102,241,0.18),transparent_24%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/32 via-transparent to-[#0F172A]/10" />

        <div className="relative mx-auto max-w-7xl px-4 py-4 sm:py-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
            <div className="hidden h-20 w-20 shrink-0 items-center justify-center rounded-full border border-white/80 bg-white/5 lg:flex sm:h-24 sm:w-24">
              <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full border border-white/20 text-center text-[24px] font-bold tracking-[-0.08em] text-white sm:h-[80px] sm:w-[80px] sm:text-[28px]">
                {getUniversityInitials(universidad.nombre)}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[20px] font-bold leading-tight tracking-[-0.05em] text-white drop-shadow-lg sm:text-[32px]">
                  {universidad.nombre}
                </h1>
              </div>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-white/80 drop-shadow sm:text-[15px]">
                {universityProfile?.subtitle ?? UNIVERSITY_SUBTITLE}
              </p>

              {universityProfile?.highlightStats?.length ? (
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-white/78">
                  {universityProfile.highlightStats.slice(0, 2).map((stat) => (
                    <div key={stat.label} className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{stat.value}</span>
                      <span className="text-xs text-white/62">{stat.label}</span>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="mt-5 grid grid-cols-2 gap-3 text-white sm:mt-6 sm:grid-cols-2 xl:grid-cols-4">
                <div className="flex items-start gap-3 rounded-2xl bg-white/8 px-3 py-3 backdrop-blur-sm">
                  <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-white/90" />
                  <div>
                    <p className="text-sm font-semibold text-white drop-shadow">{allCarreras.length} Carreras</p>
                    <p className="mt-0.5 text-xs text-white/60">Disponibles</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl bg-white/8 px-3 py-3 backdrop-blur-sm">
                  <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-white/90" />
                  <div>
                    <p className="text-sm font-semibold text-white drop-shadow">
                      {totalMaterias} Materias
                    </p>
                    <p className="mt-0.5 text-xs text-white/60">Visibles</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-4 px-4 py-4 sm:gap-5 sm:px-6 sm:py-5 lg:px-10">
        <section className="surface-panel animate-saas-lift-in px-4 py-4 sm:px-6 sm:py-6">
          <div className="flex items-center justify-between border-b border-[#E8EDF5] pb-3">
            <div className="grid w-full grid-cols-2 gap-2 text-xs font-medium text-[#7C879C] sm:flex sm:gap-6 sm:text-sm">
              <Link
                href={`/universidad/${id}?tab=informacion`}
                className={`relative rounded-xl px-3 py-2.5 text-center transition-all duration-300 sm:rounded-none sm:bg-transparent sm:px-0 sm:py-0 ${
                  activeTab === 'informacion'
                    ? 'bg-[#EEF2FF] text-[#2563EB] shadow-[0_12px_30px_rgba(37,99,235,0.12)] sm:bg-transparent sm:shadow-none'
                    : 'bg-slate-50 text-[#7C879C] hover:bg-slate-100 hover:text-[#475569] sm:bg-transparent'
                }`}
              >
                Información
                {activeTab === 'informacion' ? (
                  <span className="absolute inset-x-0 bottom-[-10px] hidden h-0.5 rounded-full bg-[#2563EB] sm:block" />
                ) : null}
              </Link>
              <Link
                href={`/universidad/${id}?tab=carreras`}
                className={`relative rounded-xl px-3 py-2.5 text-center transition-all duration-300 sm:rounded-none sm:bg-transparent sm:px-0 sm:py-0 ${
                  activeTab === 'carreras'
                    ? 'bg-[#EEF2FF] text-[#2563EB] shadow-[0_12px_30px_rgba(37,99,235,0.12)] sm:bg-transparent sm:shadow-none'
                    : 'bg-slate-50 text-[#7C879C] hover:bg-slate-100 hover:text-[#475569] sm:bg-transparent'
                }`}
              >
                Carreras
                {activeTab === 'carreras' ? (
                  <span className="absolute inset-x-0 bottom-[-10px] hidden h-0.5 rounded-full bg-[#2563EB] sm:block" />
                ) : null}
              </Link>
            </div>
          </div>

          {activeTab === 'informacion' ? (
            <div className="animate-tab-panel space-y-5 pt-6">
              <div className="surface-panel overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(79,93,255,0.18),transparent_32%),linear-gradient(135deg,#FFFFFF_0%,#F8FAFF_56%,#F3F6FD_100%)]">
                <div className="grid gap-6 p-6 lg:grid-cols-[1.3fr_0.9fr] lg:p-8">
                  <div className="space-y-5">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full border border-[#C7D2FE] bg-white/90 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#2563EB]">
                        Universidad
                      </span>
                      <span className="rounded-full border border-[#E2E8F0] bg-white/90 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-[#64748B]">
                        {allCarreras.length} carreras activas
                      </span>
                    </div>

                    <div>
                      <h2 className="section-title text-[#0F172A] sm:text-[34px]">
                        Sobre {universidad.nombre}
                      </h2>
                      <p className="section-copy mt-3 max-w-3xl text-[#475569] sm:text-[15px]">
                        {universidad.nombre} reúne una propuesta académica pensada para avanzar
                        con orden, criterio práctico y una experiencia de estudio más simple.
                        En Evaluo puedes entrar directo a cada carrera, encontrar sus materias y
                        estudiar desde un mismo lugar sin perder continuidad.
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="surface-card rounded-[var(--radius-card)] border-white/80 bg-white/80 p-4 backdrop-blur">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#94A3B8]">
                          Carreras visibles
                        </p>
                        <p className="mt-2 text-base font-semibold text-[#0F172A]">{allCarreras.length}</p>
                      </div>
                      <div className="surface-card rounded-[var(--radius-card)] border-white/80 bg-white/80 p-4 backdrop-blur">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#94A3B8]">
                          Materias visibles
                        </p>
                        <p className="mt-2 text-base font-semibold text-[#0F172A]">
                          {totalMaterias}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="surface-card rounded-[var(--radius-panel)] border-white/80 bg-white/88 p-5 backdrop-blur">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#94A3B8]">
                        Datos rápidos
                      </p>
                      <div className="mt-4 space-y-3">
                        <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#F8FAFC] px-4 py-3 text-sm">
                          <span className="text-[#64748B]">Carreras visibles</span>
                          <span className="font-semibold text-[#0F172A]">{allCarreras.length}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#F8FAFC] px-4 py-3 text-sm">
                          <span className="text-[#64748B]">Modelo académico</span>
                          <span className="font-semibold text-[#0F172A]">Organizado por carreras</span>
                        </div>
                        <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#F8FAFC] px-4 py-3 text-sm">
                          <span className="text-[#64748B]">Estudio en Evaluo</span>
                          <span className="font-semibold text-[#0F172A]">Materias compartidas</span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[28px] border border-[#D9E2FF] bg-[linear-gradient(135deg,#EEF2FF_0%,#FFFFFF_100%)] p-5">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#2563EB]">En Evaluo</p>
                      <p className="mt-3 text-sm leading-7 text-[#475569]">
                        El contenido se organiza por materia y se comparte entre carreras cuando
                        corresponde. Eso evita duplicaciones y te deja una experiencia más clara,
                        rápida y consistente al estudiar.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="animate-tab-panel pt-6">
              <CareerListClient
                initialCarreras={allCarreras}
                universityName={universidad.nombre}
              />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
