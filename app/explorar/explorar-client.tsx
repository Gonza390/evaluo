'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  GraduationCap,
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

function getCareerBadge(carrera: ExplorarCarrera, topCareerMaterias: number) {
  if (carrera.materiasCount === topCareerMaterias && topCareerMaterias > 0) {
    return 'Más completa';
  }

  if (carrera.materiasCount >= 20) {
    return 'Lista para estudiar';
  }

  if (carrera.materiasCount >= 8) {
    return 'Con contenido';
  }

  return 'En expansión';
}

export function ExplorarClient({ initialData }: { initialData: ExplorarData }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<ExploreMode>('todo');
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

  const topCareerMaterias = useMemo(
    () => Math.max(...carreras.map((carrera) => carrera.materiasCount), 0),
    [carreras]
  );

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
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
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
                onClick={() => setActiveFilter(filter.id)}
                className={`rounded-xl px-2.5 py-2 text-[11px] font-semibold transition sm:px-3 sm:text-sm ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      {showUniversidades ? (
        <section className="mt-6">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-600">
                Universidades
              </p>
              <h2 className="mt-1 text-[1.45rem] font-bold tracking-[-0.04em] text-slate-950 sm:text-2xl">
                Empieza desde tu facultad si todavía no tienes definida la carrera
              </h2>
              <p className="mt-1 text-[13px] text-slate-500 sm:text-sm">
                Entra por universidad para ver carreras activas y el contenido disponible en cada una.
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
                <h3 className="text-xl font-semibold text-slate-900">No encontramos universidades</h3>
                <p className="mt-2 text-slate-500">Prueba con otro término de búsqueda.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {visibleUniversidades.map((universidad, index) => (
                <Link key={universidad.id} href={getUniversityRoute(universidad.id)} className="block">
                  <Card
                    className="surface-card animate-surface-reveal h-full rounded-[var(--radius-card)] border border-slate-200/80 bg-white/96 transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-[var(--shadow-panel)]"
                    style={{ animationDelay: `${index * 40}ms` }}
                  >
                    <CardContent className="flex h-full flex-col justify-between gap-4 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                          {universidad.carrerasCount} carreras
                        </span>
                      </div>

                      <div>
                        <CardTitle className="text-[1.05rem] font-bold leading-tight tracking-[-0.03em] text-slate-950 sm:text-[1.1rem]">
                          {universidad.nombre}
                        </CardTitle>
                        <p className="mt-1.5 text-[13px] leading-5 text-slate-500 sm:text-sm sm:leading-6">
                          {universidad.materiasCount > 0
                            ? `${universidad.materiasCount} materias visibles para explorar desde aquí.`
                            : 'Explora las carreras disponibles y descubre el contenido activo.'}
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
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-600">
                Carreras
              </p>
              <h2 className="mt-1 text-[1.45rem] font-bold tracking-[-0.04em] text-slate-950 sm:text-2xl">
                Entra directo a tu ruta académica
              </h2>
              <p className="mt-1 text-[13px] text-slate-500 sm:text-sm">
                Busca por nombre de carrera o por universidad y ve directo a las materias.
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
                <p className="mt-2 text-slate-500">Prueba con otro término de búsqueda.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              {filteredCarreras.map((carrera, index) => (
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
                        <span className="inline-flex max-w-full items-center rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-600">
                          {getCareerBadge(carrera, topCareerMaterias)}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 pt-0">
                      <div>
                        <CardTitle className="text-[1.15rem] font-bold leading-tight tracking-[-0.03em] text-slate-950 sm:text-[1.2rem]">
                          {carrera.nombre}
                        </CardTitle>
                        <p className="mt-1 text-[13px] font-medium text-slate-500 sm:text-sm">
                          {carrera.universidadNombre}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-2">
                        <div className="text-[11px] leading-5 text-slate-500 sm:text-xs">
                          Entra a las materias de esta carrera sin pasos extra.
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
        </section>
      ) : null}
    </>
  );
}
