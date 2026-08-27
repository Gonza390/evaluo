'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { BookOpen, ChevronDown, ChevronRight, Search, X } from 'lucide-react';
import { buildSeoEntitySlug } from '@/lib/seo-intents';

export type PregunteroHubMateria = {
  materiaId: string;
  materiaNombre: string;
};

export type PregunteroHubCarrera = {
  carreraId: string;
  carreraNombre: string;
  universidadNombre: string;
  materias: PregunteroHubMateria[];
};

const PAGE_SIZE = 10;

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es-AR')
    .trim();
}

export function PregunteroHubClient({ carreras }: { carreras: PregunteroHubCarrera[] }) {
  const [query, setQuery] = useState('');
  const [universidad, setUniversidad] = useState('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  const universidades = useMemo(
    () => Array.from(new Set(carreras.map((carrera) => carrera.universidadNombre))).sort((a, b) => a.localeCompare(b, 'es')),
    [carreras]
  );

  const filteredCarreras = useMemo(() => {
    const normalizedQuery = normalize(query);

    return carreras.flatMap((carrera) => {
      if (universidad !== 'all' && carrera.universidadNombre !== universidad) return [];
      if (!normalizedQuery) return [carrera];

      const contextMatches = normalize(`${carrera.universidadNombre} ${carrera.carreraNombre}`).includes(normalizedQuery);
      const matchingMaterias = contextMatches
        ? carrera.materias
        : carrera.materias.filter((materia) => normalize(materia.materiaNombre).includes(normalizedQuery));

      if (matchingMaterias.length === 0) return [];
      return [{ ...carrera, materias: matchingMaterias }];
    });
  }, [carreras, query, universidad]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
    setExpanded(new Set());
  }, [query, universidad]);

  const visibleCarreras = filteredCarreras.slice(0, visibleCount);
  const hasMore = visibleCount < filteredCarreras.length;

  function toggleCarrera(carreraId: string) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(carreraId)) next.delete(carreraId);
      else next.add(carreraId);
      return next;
    });
  }

  return (
    <div>
      <div className="border-y border-slate-200 bg-white py-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_260px]">
          <label className="relative block min-w-0">
            <span className="sr-only">Buscar universidad, carrera o materia</span>
            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar universidad, carrera o materia"
              className="h-11 w-full rounded-xl border border-slate-300 bg-white pr-11 pl-10 text-sm text-slate-950 outline-none transition placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Limpiar búsqueda"
                className="absolute top-1/2 right-2.5 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : null}
          </label>

          <label className="min-w-0">
            <span className="sr-only">Filtrar por universidad</span>
            <select
              value={universidad}
              onChange={(event) => setUniversidad(event.target.value)}
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">Todas las universidades</option>
              {universidades.map((nombre) => (
                <option key={nombre} value={nombre}>{nombre}</option>
              ))}
            </select>
          </label>
        </div>

        <p className="mt-3 text-sm text-slate-600" role="status" aria-live="polite">
          {filteredCarreras.length === 0
            ? 'No encontramos pregunteros con esos filtros.'
            : `${filteredCarreras.length} ${filteredCarreras.length === 1 ? 'carrera encontrada' : 'carreras encontradas'}. Abrí una carrera para ver sus materias.`}
        </p>
      </div>

      {filteredCarreras.length === 0 ? (
        <div className="border-b border-slate-200 py-12 text-center">
          <p className="font-semibold text-slate-900">Probá con otro término o universidad.</p>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setUniversidad('all');
            }}
            className="mt-3 text-sm font-bold text-indigo-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            Ver todos los pregunteros
          </button>
        </div>
      ) : (
        <div className="divide-y divide-slate-200 border-b border-slate-200">
          {visibleCarreras.map((carrera) => {
            const isExpanded = expanded.has(carrera.carreraId);
            const panelId = `preguntero-carrera-${carrera.carreraId}`;

            return (
              <section key={carrera.carreraId} className="py-1">
                <button
                  type="button"
                  onClick={() => toggleCarrera(carrera.carreraId)}
                  aria-expanded={isExpanded}
                  aria-controls={panelId}
                  className="group flex w-full min-w-0 items-center gap-3 px-1 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold tracking-[0.08em] text-indigo-700 uppercase">{carrera.universidadNombre}</p>
                    <h2 className="mt-1 break-words text-base font-bold tracking-[-0.025em] text-slate-950 sm:text-lg">{carrera.carreraNombre}</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {carrera.materias.length} {carrera.materias.length === 1 ? 'materia con preguntero' : 'materias con preguntero'}
                    </p>
                  </div>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition group-hover:bg-slate-100 group-hover:text-indigo-700">
                    <ChevronDown className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} aria-hidden="true" />
                  </span>
                </button>

                {isExpanded ? (
                  <ul id={panelId} className="grid gap-1 pb-4 sm:grid-cols-2">
                    {carrera.materias.map((materia) => (
                      <li key={materia.materiaId} className="min-w-0">
                        <Link
                          href={`/pregunteros/${buildSeoEntitySlug(materia.materiaNombre, materia.materiaId)}`}
                          className="group flex min-h-11 min-w-0 items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                        >
                          <BookOpen className="h-4 w-4 shrink-0 text-slate-500 group-hover:text-indigo-700" aria-hidden="true" />
                          <span className="min-w-0 flex-1 break-words">{materia.materiaNombre}</span>
                          <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-indigo-700" aria-hidden="true" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            );
          })}
        </div>
      )}

      {hasMore ? (
        <div className="pt-6 text-center">
          <button
            type="button"
            onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-bold text-slate-800 transition hover:border-indigo-300 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            Ver más carreras
          </button>
        </div>
      ) : null}
    </div>
  );
}
