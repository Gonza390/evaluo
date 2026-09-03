import Link from 'next/link';
import { ArrowLeft, BookOpen, ChevronRight, Clock, Users, Zap } from 'lucide-react';
import { getOfficialCareerProfile } from '@/lib/career-profiles';
import { getUniversityRoute } from '@/lib/routes';
import { CareerHeroActions } from '@/components/career-hero-actions';

type CareerHeroProps = {
  carreraId: string;
  carreraNombre: string;
  carreraData?: {
    id: string;
    nombre: string;
    universidad_id?: string | null;
    descripcion?: string | null;
    nivel?: string | null;
    carga_horaria?: string | null;
  } | null;
  universidadId?: string | null;
  universidadNombre?: string | null;
};

function clean(value?: string | null) {
  const normalized = String(value ?? '').trim();
  return normalized || null;
}

export function CareerHeroServer({
  carreraId,
  carreraNombre,
  carreraData,
  universidadId,
  universidadNombre,
}: CareerHeroProps) {
  const official = getOfficialCareerProfile({ universidadNombre, carreraNombre });
  const duration = clean(carreraData?.carga_horaria) ?? official?.duration ?? null;
  const level = clean(carreraData?.nivel) ?? official?.level ?? null;
  const title = official?.title ?? null;

  return (
    <div className="bg-white">
      <div className="w-full border-b border-[#E8EDF5] bg-white">
        <div className="mx-auto flex min-h-14 max-w-7xl items-center px-4 py-2.5 lg:px-8">
          <nav className="flex flex-wrap items-center gap-1.5 text-sm leading-6">
            <Link href="/explorar" className="flex items-center gap-1 text-slate-500 transition-colors hover:text-slate-950">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="sm:hidden">Volver</span>
              <span className="hidden sm:inline">Universidades</span>
            </Link>
            <ChevronRight className="hidden h-3.5 w-3.5 text-slate-400 sm:block" />
            {universidadId ? (
              <Link
                href={getUniversityRoute(universidadId)}
                className="hidden max-w-[180px] truncate text-slate-500 transition-colors hover:text-slate-950 sm:block"
              >
                {universidadNombre || 'Universidad'}
              </Link>
            ) : null}
            <ChevronRight className="hidden h-3.5 w-3.5 text-slate-400 sm:block" />
            <span className="max-w-[210px] truncate font-medium text-slate-700 sm:max-w-none">{carreraNombre}</span>
          </nav>
        </div>
      </div>

      <section className="relative min-h-[220px] w-full overflow-hidden bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#334155] shadow-xl sm:min-h-[260px]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_36%,rgba(99,102,241,0.20),transparent_26%)]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A] via-[#0F172A]/88 to-[#1E293B]/55" />
        <div className="relative mx-auto flex min-h-[220px] max-w-7xl items-center px-4 py-5 sm:min-h-[260px] lg:px-8 lg:py-8">
          <div className="flex w-full flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-1 items-start gap-4 sm:gap-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-white/70 bg-white/5 sm:h-20 sm:w-20">
                <Zap className="h-6 w-6 text-white sm:h-8 sm:w-8" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="max-w-4xl text-[22px] leading-tight font-bold tracking-[-0.045em] text-white sm:text-[34px] lg:text-[40px]">
                  {carreraNombre}
                </h1>
                <div className="mt-4 grid grid-cols-2 gap-3 text-white sm:flex sm:flex-wrap sm:gap-x-7 sm:gap-y-3">
                  {duration ? (
                    <div className="flex min-h-11 items-center gap-2.5">
                      <Clock className="h-4 w-4 shrink-0 text-white/80" />
                      <div>
                        <p className="text-sm font-semibold">{duration}</p>
                        <p className="text-xs text-white/55">Duración</p>
                      </div>
                    </div>
                  ) : null}
                  {level ? (
                    <div className="flex min-h-11 items-center gap-2.5">
                      <Users className="h-4 w-4 shrink-0 text-white/80" />
                      <div>
                        <p className="text-sm font-semibold">{level}</p>
                        <p className="text-xs text-white/55">Tipo de programa</p>
                      </div>
                    </div>
                  ) : null}
                  {title ? (
                    <div className="col-span-2 flex min-h-11 items-center gap-2.5 sm:max-w-xl">
                      <BookOpen className="h-4 w-4 shrink-0 text-white/80" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{title}</p>
                        <p className="text-xs text-white/55">Título</p>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
            <CareerHeroActions carreraId={carreraId} carreraNombre={carreraNombre} />
          </div>
        </div>
      </section>
    </div>
  );
}
