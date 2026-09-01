import type { Metadata } from 'next';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  BookOpen,
  Building2,
  ChevronRight,
  GraduationCap,
} from 'lucide-react';
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
            className="h-48 animate-pulse rounded-[28px] border border-slate-200 bg-slate-50"
          />
        ))}
      </div>
    </div>
  ),
});

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ tab?: string; facultadId?: string }>;
};

type CarreraRow = {
  id: string;
  nombre: string;
  facultad_id: string | null;
};

type FacultadRow = {
  id: string;
  nombre: string;
};

const UNIVERSITY_SUBTITLE = 'Excelencia académica, compromiso social e innovación.';
const RELATIONS_PAGE_SIZE = 1000;

async function fetchAllCarreraMateriaRelations(
  supabase: ReturnType<typeof createPublicClient>,
  carreraIds: string[]
) {
  const allRows: Array<{ carrera_id: string | null; materia_id: string | null }> = [];

  for (let from = 0; ; from += RELATIONS_PAGE_SIZE) {
    const to = from + RELATIONS_PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from('carrera_materias')
      .select('carrera_id, materia_id')
      .in('carrera_id', carreraIds)
      .range(from, to);

    if (error) throw error;

    const rows = data ?? [];
    allRows.push(...rows);
    if (rows.length < RELATIONS_PAGE_SIZE) break;
  }

  return allRows;
}

type UniversidadPageData = {
  universidad: { id: string; nombre: string };
  facultades: FacultadRow[];
  allCarreras: CarreraRow[];
  materiaCountByCarrera: Record<string, number>;
  totalUniqueMaterias: number;
} | null;

const loadUniversidadPageData = unstable_cache(
  async (id: string): Promise<UniversidadPageData> => {
    const supabase = createPublicClient();
    const catalog = supabase as any;

    const { data: universidad } = await supabase
      .from('universidades')
      .select('id, nombre')
      .eq('id', id)
      .single();

    if (!universidad) return null;

    const [facultadesResult, carrerasResult] = await Promise.all([
      catalog
        .from('facultades')
        .select('id, nombre')
        .eq('universidad_id', id)
        .order('nombre'),
      catalog
        .from('carreras')
        .select('id, nombre, facultad_id')
        .eq('universidad_id', id)
        .order('nombre'),
    ]);

    if (facultadesResult.error) throw facultadesResult.error;
    if (carrerasResult.error) throw carrerasResult.error;

    const facultades = (facultadesResult.data ?? []) as FacultadRow[];
    const allCarreras = (carrerasResult.data ?? []) as CarreraRow[];
    const carreraIds = allCarreras.map((carrera) => carrera.id);
    const materiaCountByCarrera: Record<string, number> = {};
    const uniqueMateriaIds = new Set<string>();

    if (carreraIds.length > 0) {
      const carreraMaterias = await fetchAllCarreraMateriaRelations(supabase, carreraIds);
      const materiaIdsByCarrera = new Map<string, Set<string>>();

      for (const item of carreraMaterias) {
        if (!item.carrera_id || !item.materia_id) continue;
        uniqueMateriaIds.add(item.materia_id);
        const materiaIds = materiaIdsByCarrera.get(item.carrera_id) ?? new Set<string>();
        materiaIds.add(item.materia_id);
        materiaIdsByCarrera.set(item.carrera_id, materiaIds);
      }

      for (const [carreraId, materiaIds] of materiaIdsByCarrera.entries()) {
        materiaCountByCarrera[carreraId] = materiaIds.size;
      }
    }

    return {
      universidad,
      facultades,
      allCarreras,
      materiaCountByCarrera,
      totalUniqueMaterias: uniqueMateriaIds.size,
    };
  },
  ['universidad-data-v2'],
  { revalidate: 600, tags: ['universidad-data'] }
);

export async function generateMetadata({ params }: Pick<Props, 'params'>): Promise<Metadata> {
  const { id } = await params;
  const data = await loadUniversidadPageData(id);

  if (!data) {
    return {
      title: 'Universidad',
      robots: { index: false, follow: false },
    };
  }

  const { universidad, allCarreras, totalUniqueMaterias } = data;
  const hasAcademicCatalog = allCarreras.length > 0 && totalUniqueMaterias > 0;

  return {
    title: `${universidad.nombre} | Universidad`,
    description: `Explorá la estructura académica, carreras y materias de ${universidad.nombre} para estudiar con Evaluo.`,
    alternates: { canonical: `/universidad/${universidad.id}` },
    robots: { index: hasAcademicCatalog, follow: true },
    openGraph: {
      title: `${universidad.nombre} | Evaluo`,
      description: `Facultades, carreras y materias disponibles de ${universidad.nombre}.`,
      url: `/universidad/${universidad.id}`,
    },
  };
}

function FacultyGrid({ universidadId, facultades }: { universidadId: string; facultades: FacultadRow[] }) {
  return (
    <div className="pt-6 sm:pt-7">
      <div>
        <h2 className="section-title leading-none text-[#10214C]">Facultades</h2>
        <p className="section-copy mt-2 text-[#7C879C]">
          Elegí una facultad para ver sus carreras.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:mt-8 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
        {facultades.map((facultad, index) => (
          <Link
            key={facultad.id}
            href={`/universidad/${universidadId}?tab=carreras&facultadId=${facultad.id}`}
            className="surface-card group animate-surface-reveal p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#CBD5E1] hover:shadow-[var(--shadow-panel)] sm:p-6"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EEF4FF] text-[#2563EB]">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-[1.02rem] font-semibold tracking-[-0.035em] text-[#152A63] sm:text-[1.1rem]">
                  {facultad.nombre}
                </h3>
                <p className="mt-1 text-sm text-[#7C879C]">Ver carreras</p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-blue-600" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default async function UniversidadPage({ params, searchParams }: Props) {
  const [id, resolvedSearchParams] = await Promise.all([
    (await params).id,
    searchParams ?? Promise.resolve<{ tab?: string; facultadId?: string }>({}),
  ]);

  const activeTab = resolvedSearchParams?.tab === 'informacion' ? 'informacion' : 'carreras';
  const data = await loadUniversidadPageData(id);
  if (!data) notFound();

  const { universidad, facultades, allCarreras, totalUniqueMaterias } = data;
  const universityProfile = getUniversityProfile(universidad.nombre);
  const selectedFacultad = facultades.find(
    (facultad) => facultad.id === resolvedSearchParams?.facultadId
  ) ?? null;
  const carrerasDirectas = allCarreras.filter((carrera) => !carrera.facultad_id);
  const carrerasSeleccionadas = selectedFacultad
    ? allCarreras.filter((carrera) => carrera.facultad_id === selectedFacultad.id)
    : [];
  const usesFaculties = facultades.length > 0;

  return (
    <div className="animate-page-enter min-h-full bg-white">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: 'Inicio', path: '/' },
          { name: 'Explorar', path: '/explorar' },
          { name: universidad.nombre, path: `/universidad/${id}` },
          ...(selectedFacultad
            ? [{ name: selectedFacultad.nombre, path: `/universidad/${id}?facultadId=${selectedFacultad.id}` }]
            : []),
        ])}
      />

      <div className="mx-auto w-full max-w-[1240px] px-4 py-7 sm:px-6 sm:py-9 lg:px-10">
        <Link
          href="/explorar"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Universidades
        </Link>

        <header className="mt-7 border-b border-slate-200 pb-7 sm:pb-9">
          <p className="text-xs font-bold tracking-[0.16em] text-blue-600 uppercase">Universidad</p>
          <h1 className="mt-3 max-w-4xl text-3xl font-bold tracking-[-0.055em] text-slate-950 sm:text-4xl lg:text-[44px] lg:leading-[1.03]">
            {universidad.nombre}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
            {universityProfile?.subtitle ?? UNIVERSITY_SUBTITLE}
          </p>

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-600">
            {usesFaculties ? (
              <span className="inline-flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-600" />
                <strong className="font-semibold text-slate-950">{facultades.length}</strong> facultades
              </span>
            ) : null}
            <span className="inline-flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-blue-600" />
              <strong className="font-semibold text-slate-950">{allCarreras.length}</strong> carreras
            </span>
            <span className="inline-flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-600" />
              <strong className="font-semibold text-slate-950">{totalUniqueMaterias}</strong> materias
            </span>
            {universityProfile?.highlightStats?.slice(0, 2).map((stat) => (
              <span key={stat.label} className="inline-flex items-baseline gap-1.5">
                <strong className="font-semibold text-slate-950">{stat.value}</strong>
                <span>{stat.label}</span>
              </span>
            ))}
          </div>
        </header>

        <nav className="flex gap-6 overflow-x-auto border-b border-slate-200 pt-5 text-sm font-semibold [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Link
            href={`/universidad/${id}?tab=carreras`}
            className={`relative shrink-0 pb-3 transition ${
              activeTab === 'carreras' ? 'text-slate-950' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Oferta académica
            {activeTab === 'carreras' ? (
              <span className="absolute inset-x-0 bottom-[-1px] h-0.5 bg-blue-600" />
            ) : null}
          </Link>
          <Link
            href={`/universidad/${id}?tab=informacion`}
            className={`relative shrink-0 pb-3 transition ${
              activeTab === 'informacion' ? 'text-slate-950' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Información
            {activeTab === 'informacion' ? (
              <span className="absolute inset-x-0 bottom-[-1px] h-0.5 bg-blue-600" />
            ) : null}
          </Link>
        </nav>

        {activeTab === 'informacion' ? (
          <section className="animate-tab-panel py-8 sm:py-10">
            <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
              <div className="min-w-0">
                <p className="text-xs font-bold tracking-[0.14em] text-slate-400 uppercase">Información</p>
                <h2 className="mt-3 text-2xl font-bold tracking-[-0.045em] text-slate-950 sm:text-3xl">
                  Sobre {universidad.nombre}
                </h2>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
                  {usesFaculties
                    ? `${universidad.nombre} organiza su oferta académica en facultades, carreras y materias. En Evaluo podés recorrer esa estructura nivel por nivel.`
                    : `${universidad.nombre} reúne una propuesta académica organizada por carreras y materias. En Evaluo podés entrar directo a cada carrera y continuar desde sus materias.`}
                </p>

                <div className="mt-8 border-t border-slate-200">
                  {usesFaculties ? (
                    <div className="grid gap-2 border-b border-slate-200 py-4 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center">
                      <span className="text-sm text-slate-500">Facultades visibles</span>
                      <span className="text-sm font-semibold text-slate-950 sm:text-right">{facultades.length}</span>
                    </div>
                  ) : null}
                  <div className="grid gap-2 border-b border-slate-200 py-4 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center">
                    <span className="text-sm text-slate-500">Carreras visibles</span>
                    <span className="text-sm font-semibold text-slate-950 sm:text-right">{allCarreras.length}</span>
                  </div>
                  <div className="grid gap-2 border-b border-slate-200 py-4 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center">
                    <span className="text-sm text-slate-500">Materias visibles</span>
                    <span className="text-sm font-semibold text-slate-950 sm:text-right">{totalUniqueMaterias}</span>
                  </div>
                  <div className="grid gap-2 border-b border-slate-200 py-4 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center">
                    <span className="text-sm text-slate-500">Modelo académico</span>
                    <span className="text-sm font-semibold text-slate-950 sm:text-right">
                      {usesFaculties ? 'Facultades → carreras → materias' : 'Carreras → materias'}
                    </span>
                  </div>
                </div>
              </div>

              <aside className="border-t border-slate-200 pt-6 lg:border-t-0 lg:border-l lg:pl-8 lg:pt-0">
                <p className="text-xs font-bold tracking-[0.14em] text-blue-600 uppercase">En Evaluo</p>
                <h3 className="mt-3 text-lg font-bold tracking-[-0.035em] text-slate-950">
                  El contenido se conecta por materia.
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Cuando una materia corresponde a más de una carrera, el material puede compartirse sin duplicar contenido.
                </p>
              </aside>
            </div>
          </section>
        ) : (
          <section className="animate-tab-panel">
            {usesFaculties ? (
              selectedFacultad ? (
                <div className="pt-6 sm:pt-7">
                  <Link
                    href={`/universidad/${id}?tab=carreras`}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-600"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Facultades
                  </Link>
                  <div className="mt-5 border-b border-slate-200 pb-5">
                    <p className="text-xs font-bold tracking-[0.14em] text-blue-600 uppercase">Facultad</p>
                    <h2 className="mt-2 text-2xl font-bold tracking-[-0.045em] text-slate-950 sm:text-3xl">
                      {selectedFacultad.nombre}
                    </h2>
                  </div>
                  <CareerListClient
                    initialCarreras={carrerasSeleccionadas}
                    universityName={universidad.nombre}
                  />
                </div>
              ) : (
                <div>
                  <FacultyGrid universidadId={id} facultades={facultades} />
                  {carrerasDirectas.length > 0 ? (
                    <div className="mt-12 border-t border-slate-200 pt-8">
                      <p className="text-xs font-bold tracking-[0.14em] text-slate-400 uppercase">Carreras directas</p>
                      <CareerListClient
                        initialCarreras={carrerasDirectas}
                        universityName={universidad.nombre}
                      />
                    </div>
                  ) : null}
                </div>
              )
            ) : (
              <CareerListClient initialCarreras={allCarreras} universityName={universidad.nombre} />
            )}
          </section>
        )}
      </div>
    </div>
  );
}
