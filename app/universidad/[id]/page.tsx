import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  GraduationCap,
  MapPin,
  Users,
} from 'lucide-react';
import { createClientServer } from '@/lib/supabase-server';
import { NotificationBell } from '@/components/NotificationBell';
import CareerListClient from './career-list-client';

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ tab?: string }>;
};

type CarreraRow = {
  id: string;
  nombre: string;
};

const UNIVERSITY_SUBTITLE = 'Excelencia academica, compromiso social e innovacion.';

function getUniversityInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 3)
    .map((chunk) => chunk[0]?.toUpperCase() ?? '')
    .join('');
}

export default async function UniversidadPage({ params, searchParams }: Props) {
  const [{ id }, resolvedSearchParams, supabase] = await Promise.all([
    params,
    searchParams ?? Promise.resolve<{ tab?: string }>({}),
    createClientServer(),
  ]);
  const activeTab = resolvedSearchParams?.tab === 'informacion' ? 'informacion' : 'carreras';

  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData?.session?.user;

  const { data: universidad } = await supabase
    .from('universidades')
    .select('nombre')
    .eq('id', id)
    .single();

  if (!universidad) {
    notFound();
  }

  const { data: carrerasData } = await supabase
    .from('carreras')
    .select('id, nombre')
    .eq('universidad_id', id)
    .order('nombre');

  const allCarreras = (carrerasData ?? []) as CarreraRow[];
  const carreraIds = allCarreras.map((carrera) => carrera.id);
  let materiaCountByCarrera = new Map<string, number>();

  if (carreraIds.length > 0) {
    const { data: carreraMaterias } = await supabase
      .from('carrera_materias')
      .select('carrera_id')
      .in('carrera_id', carreraIds);

    materiaCountByCarrera = (carreraMaterias ?? []).reduce((acc, item) => {
      if (!item.carrera_id) return acc;
      acc.set(item.carrera_id, (acc.get(item.carrera_id) ?? 0) + 1);
      return acc;
    }, new Map<string, number>());
  }

  return (
    <main className="animate-page-enter min-h-screen bg-[#F8FAFC]">
      <div className="w-full border-b border-[#E8EDF5] bg-[#F8FAFC]">
        <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 lg:px-8">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm font-medium text-[#64748B] transition hover:text-[#0F172A]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="font-poppins">Universidades</span>
          </Link>

          

          {user ? (
            <div className="flex items-center gap-4">
              <NotificationBell />
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-full border border-[#CBD5E1] px-4 py-2 text-sm font-medium text-[#475569] transition hover:border-[#4F5DFF] hover:text-[#4F5DFF]"
            >
              Iniciar sesión
            </Link>
          )}
        </div>
      </div>

      <section className="relative w-full overflow-hidden bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#334155] shadow-2xl min-h-[280px] sm:min-h-[280px]">
        <div 
          className="absolute inset-0 h-full w-full bg-cover bg-center"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1562774053-701939374585?w=1200&q=80)' }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#0F172A_0%,#0F172A_28%,rgba(15,23,42,0.94)_42%,rgba(15,23,42,0.76)_56%,rgba(15,23,42,0.42)_70%,rgba(15,23,42,0.16)_84%,rgba(15,23,42,0.04)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_36%,rgba(99,102,241,0.18),transparent_24%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/32 via-transparent to-[#0F172A]/10" />

        <div className="relative mx-auto max-w-7xl px-4 py-5 sm:py-8 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
            <div className="hidden lg:flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-white/80 bg-white/5 sm:h-24 sm:w-24">
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
                {UNIVERSITY_SUBTITLE}
              </p>

              <div className="mt-5 grid grid-cols-1 gap-3 text-white sm:mt-6 sm:grid-cols-2 xl:grid-cols-4">
                <div className="flex items-start gap-3">
                  <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-white/90" />
                  <div>
                    <p className="text-sm font-semibold text-white drop-shadow">1995 - Ano de fundacion</p>
                    <p className="mt-0.5 text-xs text-white/60">Fundacion</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-white/90" />
                  <div>
                    <p className="text-sm font-semibold text-white drop-shadow">Cordoba, Argentina</p>
                    <p className="mt-0.5 text-xs text-white/60">Ubicacion</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-white/90" />
                  <div>
                    <p className="text-sm font-semibold text-white drop-shadow">{allCarreras.length} Carreras</p>
                    <p className="mt-0.5 text-xs text-white/60">Carreras</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Users className="mt-0.5 h-4 w-4 shrink-0 text-white/90" />
                  <div>
                    <p className="text-sm font-semibold text-white drop-shadow">+50K Estudiantes</p>
                    <p className="mt-0.5 text-xs text-white/60">Estudiantes</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-4 px-4 py-5 sm:gap-5 sm:px-6 sm:py-6 lg:px-10">
        <section className="surface-panel animate-saas-lift-in px-4 py-4 sm:px-6 sm:py-6">
          <div className="flex items-center justify-between border-b border-[#E8EDF5] pb-3">
            <div className="grid w-full grid-cols-2 gap-2 text-xs font-medium text-[#7C879C] sm:flex sm:gap-6 sm:text-sm">
              <Link
                href={`/universidad/${id}?tab=informacion`}
                className={`relative rounded-xl px-3 py-2.5 text-center transition-all duration-300 sm:rounded-none sm:bg-transparent sm:px-0 sm:py-0 ${
                  activeTab === 'informacion'
                    ? 'bg-[#EEF2FF] text-[#4F5DFF] shadow-[0_12px_30px_rgba(79,93,255,0.12)] sm:bg-transparent sm:shadow-none'
                    : 'bg-slate-50 text-[#7C879C] hover:bg-slate-100 hover:text-[#475569] sm:bg-transparent'
                }`}
              >
                Informacion
                {activeTab === 'informacion' ? (
                  <span className="absolute inset-x-0 bottom-[-10px] hidden h-0.5 rounded-full bg-[#4F5DFF] sm:block" />
                ) : null}
              </Link>
              <Link
                href={`/universidad/${id}?tab=carreras`}
                className={`relative rounded-xl px-3 py-2.5 text-center transition-all duration-300 sm:rounded-none sm:bg-transparent sm:px-0 sm:py-0 ${
                  activeTab === 'carreras'
                    ? 'bg-[#EEF2FF] text-[#4F5DFF] shadow-[0_12px_30px_rgba(79,93,255,0.12)] sm:bg-transparent sm:shadow-none'
                    : 'bg-slate-50 text-[#7C879C] hover:bg-slate-100 hover:text-[#475569] sm:bg-transparent'
                }`}
              >
                Carreras
                {activeTab === 'carreras' ? (
                  <span className="absolute inset-x-0 bottom-[-10px] hidden h-0.5 rounded-full bg-[#4F5DFF] sm:block" />
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
                      <span className="rounded-full border border-[#C7D2FE] bg-white/90 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#4F5DFF]">
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
                        {universidad.nombre} reune una propuesta academica pensada para avanzar
                        con orden, criterio practico y una experiencia de estudio mas simple.
                        En Evaluo puedes entrar directo a cada carrera, encontrar sus materias y
                        estudiar desde un mismo lugar sin perder continuidad.
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="surface-card rounded-[var(--radius-card)] border-white/80 bg-white/80 p-4 backdrop-blur">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#94A3B8]">
                          Ubicacion
                        </p>
                        <p className="mt-2 text-base font-semibold text-[#0F172A]">
                          Cordoba, Argentina
                        </p>
                      </div>
                      <div className="surface-card rounded-[var(--radius-card)] border-white/80 bg-white/80 p-4 backdrop-blur">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#94A3B8]">
                          Fundacion
                        </p>
                        <p className="mt-2 text-base font-semibold text-[#0F172A]">1995</p>
                      </div>
                      <div className="surface-card rounded-[var(--radius-card)] border-white/80 bg-white/80 p-4 backdrop-blur">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#94A3B8]">
                          Experiencia
                        </p>
                        <p className="mt-2 text-base font-semibold text-[#0F172A]">
                          Modalidad flexible
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="surface-card rounded-[var(--radius-panel)] border-white/80 bg-white/88 p-5 backdrop-blur">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#94A3B8]">
                        Datos rapidos
                      </p>
                      <div className="mt-4 space-y-3">
                        <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#F8FAFC] px-4 py-3 text-sm">
                          <span className="text-[#64748B]">Carreras visibles</span>
                          <span className="font-semibold text-[#0F172A]">{allCarreras.length}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#F8FAFC] px-4 py-3 text-sm">
                          <span className="text-[#64748B]">Modelo academico</span>
                          <span className="font-semibold text-[#0F172A]">Organizado por carreras</span>
                        </div>
                        <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#F8FAFC] px-4 py-3 text-sm">
                          <span className="text-[#64748B]">Estudio en Evaluo</span>
                          <span className="font-semibold text-[#0F172A]">Materias compartidas</span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[28px] border border-[#D9E2FF] bg-[linear-gradient(135deg,#EEF2FF_0%,#FFFFFF_100%)] p-5">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#4F5DFF]">
                        En Evaluo
                      </p>
                      <p className="mt-3 text-sm leading-7 text-[#475569]">
                        El contenido se organiza por materia y se comparte entre carreras cuando
                        corresponde. Eso evita duplicaciones y te deja una experiencia mas clara,
                        rapida y consistente al estudiar.
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
                materiaCountEntries={Array.from(materiaCountByCarrera.entries())}
              />
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
