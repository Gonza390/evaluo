'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  ChevronDown,
  GraduationCap,
  PlusCircle,
  Search,
} from 'lucide-react';
import { getCareerRoute, getUniversityRoute } from '@/lib/routes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { ExplorarCarrera, ExplorarData } from './data';

type ExploreMode = 'todo' | 'universidades' | 'carreras';

const FILTERS: Array<{ id: ExploreMode; label: string }> = [
  { id: 'todo', label: 'Todo' },
  { id: 'universidades', label: 'Universidades' },
  { id: 'carreras', label: 'Carreras' },
];

function getCareerBadge(carrera: ExplorarCarrera, topReadyMaterias: number) {
  if (carrera.readyMateriasCount === topReadyMaterias && topReadyMaterias > 0) {
    return 'Más contenido disponible';
  }

  if (carrera.questionMateriasCount > 0) {
    return 'Con práctica disponible';
  }

  if (carrera.readyMateriasCount > 0) {
    return 'Con materiales';
  }

  return 'Catálogo cargado';
}

export function ExplorarClient({ initialData }: { initialData: ExplorarData }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<ExploreMode>('todo');
  const [showAllCareers, setShowAllCareers] = useState(false);
  const { universidades, carreras } = initialData;
  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredUniversidades = useMemo(
    () =>
      universidades.filter((universidad) =>
        normalizedSearch.length === 0
          ? true
          : universidad.nombre.toLowerCase().includes(normalizedSearch)
      ),
    [normalizedSearch, universidades]
  );

  const filteredCarreras = useMemo(
    () =>
      carreras.filter((carrera) => {
        if (normalizedSearch.length === 0) return true;
        return (
          carrera.nombre.toLowerCase().includes(normalizedSearch) ||
          carrera.universidadNombre.toLowerCase().includes(normalizedSearch)
        );
      }),
    [carreras, normalizedSearch]
  );

  const topReadyMaterias = useMemo(
    () => Math.max(...carreras.map((carrera) => carrera.readyMateriasCount), 0),
    [carreras]
  );

  const rankedCarreras = useMemo(
    () =>
      [...filteredCarreras].sort((a, b) => {
        if (b.readyMateriasCount !== a.readyMateriasCount) {
          return b.readyMateriasCount - a.readyMateriasCount;
        }
        if (b.questionMateriasCount !== a.questionMateriasCount) {
          return b.questionMateriasCount - a.questionMateriasCount;
        }
        if (b.materiasCount !== a.materiasCount) {
          return b.materiasCount - a.materiasCount;
        }
        return a.nombre.localeCompare(b.nombre, 'es');
      }),
    [filteredCarreras]
  );

  const visibleCarreras =
    normalizedSearch.length > 0 || activeFilter === 'carreras' || showAllCareers
      ? rankedCarreras
      : rankedCarreras.slice(0, 8);

  const featuredUniversidades = useMemo(
    () =>
      [...filteredUniversidades]
        .sort((a, b) => {
          if (b.materiasCount !== a.materiasCount) {
            return b.materiasCount - a.materiasCount;
          }

          if (b.carrerasCount !== a.carrerasCount) {
            return b.carrerasCount - a.carrerasCount;
          }

          return a.nombre.localeCompare(b.nombre, 'es');
        })
        .slice(0, 6),
    [filteredUniversidades]
  );

  const visibleUniversidades =
    activeFilter === 'universidades' || normalizedSearch.length > 0
      ? filteredUniversidades
      : featuredUniversidades;

  const showUniversidades = activeFilter !== 'carreras';
  const showCarreras = activeFilter !== 'universidades';

  return (
    <>
      <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Buscar universidad o carrera..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="h-10 rounded-2xl border-slate-200 bg-white pl-10 text-sm shadow-sm sm:h-11"
          />
        </div>

        <div className="grid grid-cols-3 gap-1.5 rounded-2xl border border-slate-200 bg-white p-1 sm:w-fit sm:gap-2">
          {FILTERS.map((filter) => {
            const isActive = activeFilter === filter.id;
            return (
              <button
                key={filter.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => setActiveFilter(filter.id)}
                className={`rounded-xl px-2.5 py-2 text-[12px] font-semibold transition sm:px-3 sm:text-sm ${
                  isActive ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-white'
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-800">¿No encontrás tu universidad?</p>
          <p className="mt-0.5 text-xs leading-5 text-slate-500">
            Pedinos que la sumemos. Para enviar la solicitud necesitás crear una cuenta.
          </p>
        </div>
        <Link
          href="/solicitar-universidad"
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 text-sm font-semibold text-indigo-700 transition hover:border-indigo-300 hover:bg-indigo-100"
        >
          <PlusCircle className="h-4 w-4" />
          Solicitar universidad
        </Link>
      </div>

      {showUniversidades ? (
        <section className="mt-6">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
            <div>
              <p className="text-[12px] font-bold tracking-[0.18em] text-indigo-600 uppercase">
                Universidades
              </p>
              <h2 className="mt-1 text-[1.45rem] font-bold tracking-[-0.04em] text-slate-950 sm:text-2xl">
                Empezá desde tu facultad si todavía no tenés definida la carrera
              </h2>
              <p className="mt-1 text-[13px] text-slate-500 sm:text-sm">
                Entrá por universidad para ver carreras activas y el contenido disponible en cada
                una.
              </p>
            </div>
            <p className="shrink-0 text-sm font-semibold text-slate-500">
              {visibleUniversidades.length} resultados
            </p>
          </div>

          {visibleUniversidades.length === 0 ? (
            <Card className="surface-panel rounded-[var(--radius-panel)]">
              <CardContent className="py-14 text-center">
                <Building2 className="mx-auto mb-4 h-12 w-12 text-slate-300" />
                <h3 className="text-xl font-semibold text-slate-900">
                  No encontramos universidades
                </h3>
                <p className="mt-2 text-slate-500">Probá con otro término de búsqueda.</p>
                <Link
                  href="/solicitar-universidad"
                  className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                >
                  Solicitar que la sumemos
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {visibleUniversidades.map((universidad, index) => (
                <Link
                  key={universidad.id}
                  href={getUniversityRoute(universidad.id)}
                  className="block"
                >
                  <Card
                    className="surface-card animate-surface-reveal h-full rounded-[var(--radius-card)] border border-slate-200/80 bg-white/96 transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-[var(--shadow-panel)]"
                    style={{ animationDelay: `${index * 40}ms` }}
                  >
                    <CardContent className="flex h-full flex-col justify-between gap-4 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[12px] font-bold tracking-[0.14em] text-slate-500 uppercase">
                          {universidad.carrerasCount} carreras
                        </span>
                      </div>

                      <div>
                        <CardTitle className="text-[1.05rem] leading-tight font-bold tracking-[-0.03em] text-slate-950 sm:text-[1.1rem]">
                          {universidad.nombre}
                        </CardTitle>
                        <p className="mt-1.5 text-[13px] leading-5 text-slate-500 sm:text-sm sm:leading-6">
                          {universidad.materiasCount > 0
                            ? `${universidad.materiasCount} materias visibles para explorar desde aquí.`
                            : 'Explorá las carreras disponibles y descubrí el contenido activo.'}
                        </p>
                      </div>

                      <div className="inline-flex h-8 w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800">
                        Ver carreras
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {showCarreras ? (
        <section className="mt-6">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
            <div>
              <p className="text-[12px] font-bold tracking-[0.18em] text-indigo-600 uppercase">
                Carreras
              </p>
              <h2 className="mt-1 text-[1.45rem] font-bold tracking-[-0.04em] text-slate-950 sm:text-2xl">
                Entrá directo a tu ruta académica
              </h2>
              <p className="mt-1 text-[13px] text-slate-500 sm:text-sm">
                Priorizamos las carreras con materiales o preguntas disponibles para que empieces
                por una experiencia lista.
              </p>
            </div>
            <p className="shrink-0 text-sm font-semibold text-slate-500">
              {filteredCarreras.length} resultados
            </p>
          </div>

          {filteredCarreras.length === 0 ? (
            <Card className="surface-panel rounded-[var(--radius-panel)]">
              <CardContent className="py-14 text-center">
                <GraduationCap className="mx-auto mb-4 h-12 w-12 text-slate-300" />
                <h3 className="text-xl font-semibold text-slate-900">No encontramos carreras</h3>
                <p className="mt-2 text-slate-500">Probá con otro término de búsqueda.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              {visibleCarreras.map((carrera, index) => (
                <Link key={carrera.id} href={getCareerRoute(carrera.id)} className="block">
                  <Card
                    className="surface-card animate-surface-reveal h-full overflow-hidden rounded-[var(--radius-card)] border border-slate-200/80 bg-white/96 transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-[var(--shadow-panel)]"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                          <GraduationCap className="h-5 w-5" />
                        </div>
                        <span className="inline-flex max-w-full items-center rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-[12px] font-bold tracking-[0.16em] text-indigo-600 uppercase">
                          {getCareerBadge(carrera, topReadyMaterias)}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 pt-0">
                      <div>
                        <CardTitle className="text-[1.15rem] leading-tight font-bold tracking-[-0.03em] text-slate-950 sm:text-[1.2rem]">
                          {carrera.nombre}
                        </CardTitle>
                        <p className="mt-1 text-[13px] font-medium text-slate-500 sm:text-sm">
                          {carrera.universidadNombre}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-2">
                        <div className="text-[12px] leading-5 text-slate-500 sm:text-xs">
                          Entrá a las materias de esta carrera sin pasos extra.
                        </div>
                        <div className="inline-flex h-8 shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800">
                          Ver materias
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
          {normalizedSearch.length === 0 && activeFilter === 'todo' && rankedCarreras.length > 8 ? (
            <div className="mt-5 flex justify-center">
              <button
                type="button"
                onClick={() => setShowAllCareers((value) => !value)}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700"
                aria-expanded={showAllCareers}
              >
                {showAllCareers
                  ? 'Ver carreras destacadas'
                  : `Ver las ${rankedCarreras.length} carreras`}
                <ChevronDown
                  className={`h-4 w-4 transition ${showAllCareers ? 'rotate-180' : ''}`}
                />
              </button>
            </div>
          ) : null}
        </section>
      ) : null}

      <p className="mt-8 text-center text-[11px] leading-5 text-slate-400">
        Los nombres de universidades se utilizan únicamente para organizar e identificar el catálogo
        académico. Evaluo es una plataforma independiente y no representa ni está afiliada a las
        instituciones listadas.
      </p>
    </>
  );
}
