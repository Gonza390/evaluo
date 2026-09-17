'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { BookOpen, ChevronDown, ChevronRight, Search, X } from 'lucide-react';
import { buildSeoEntitySlug } from '@/lib/seo-intents';
import type {
  PregunteroHubCarrera,
  PregunteroHubCarreraSummary,
  PregunteroHubMateria,
} from './data';

const PAGE_SIZE = 10;

type DisplayCarrera = PregunteroHubCarreraSummary & {
  materias?: PregunteroHubMateria[];
};

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es-AR')
    .trim();
}

export function PregunteroHubClient({ carreras }: { carreras: PregunteroHubCarreraSummary[] }) {
  const [query, setQuery] = useState('');
  const [universidad, setUniversidad] = useState('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [catalog, setCatalog] = useState<PregunteroHubCarrera[] | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [expandingCareer, setExpandingCareer] = useState<string | null>(null);
  const catalogPromiseRef = useRef<Promise<PregunteroHubCarrera[]> | null>(null);

  const universidades = useMemo(
    () => Array.from(new Set(carreras.map((carrera) => carrera.universidadNombre))).sort((a, b) => a.localeCompare(b, 'es')),
    [carreras]
  );

  const ensureCatalog = useCallback(async () => {
    if (catalog) return catalog;
    if (!catalogPromiseRef.current) {
      setCatalogLoading(true);
      setCatalogError(null);
      catalogPromiseRef.current = fetch('/api/pregunteros/catalog', {
        headers: { Accept: 'application/json' },
      })
        .then(async (response) => {
          if (!response.ok) throw new Error(`No se pudo cargar el catálogo (${response.status}).`);
          return (await response.json()) as PregunteroHubCarrera[];
        })
        .then((data) => {
          setCatalog(data);
          return data;
        })
        .catch((error: unknown) => {
          catalogPromiseRef.current = null;
          const message = error instanceof Error ? error.message : 'No se pudo cargar el catálogo.';
          setCatalogError(message);
          throw error;
        })
        .finally(() => setCatalogLoading(false));
    }
    return catalogPromiseRef.current;
  }, [catalog]);

  useEffect(() => {
    if (!query.trim() || catalog) return;
    const timer = window.setTimeout(() => {
      void ensureCatalog().catch(() => undefined);
    }, 120);
    return () => window.clearTimeout(timer);
  }, [catalog, ensureCatalog, query]);

  const catalogByCareer = useMemo(
    () => new Map((catalog ?? []).map((carrera) => [carrera.carreraId, carrera] as const)),
    [catalog]
  );

  const filteredCarreras = useMemo<DisplayCarrera[]>(() => {
    const normalizedQuery = normalize(query);
    const base = carreras.filter(
      (carrera) => universidad === 'all' || carrera.universidadNombre === universidad
    );

    if (!normalizedQuery) return base;

    if (!catalog) {
      return base.filter((carrera) =>
        normalize(`${carrera.universidadNombre} ${carrera.carreraNombre}`).includes(normalizedQuery)
      );
    }

    return catalog.flatMap((carrera) => {
      if (universidad !== 'all' && carrera.universidadNombre !== universidad) return [];
      const contextMatches = normalize(
        `${carrera.universidadNombre} ${carrera.carreraNombre}`
      ).includes(normalizedQuery);
      const matchingMaterias = contextMatches
        ? carrera.materias
        : carrera.materias.filter((materia) =>
            normalize(materia.materiaNombre).includes(normalizedQuery)
          );

      if (matchingMaterias.length === 0) return [];
      return [
        {
          carreraId: carrera.carreraId,
          carreraNombre: carrera.carreraNombre,
          universidadNombre: carrera.universidadNombre,
          materiaCount: matchingMaterias.length,
          materias: matchingMaterias,
        },
      ];
    });
  }, [carreras, catalog, query, universidad]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
    setExpanded(new Set());
  }, [query, universidad]);

  const visibleCarreras = filteredCarreras.slice(0, visibleCount);
  const hasMore = visibleCount < filteredCarreras.length;
  const isSearchingCatalog = Boolean(query.trim()) && !catalog && !catalogError;

  async function toggleCarrera(carreraId: string) {
    if (expanded.has(carreraId)) {
      setExpanded((current) => {
        const next = new Set(current);
        next.delete(carreraId);
        return next;
      });
      return;
    }

    if (!catalog) {
      setExpandingCareer(carreraId);
      try {
        await ensureCatalog();
      } catch {
        return;
      } finally {
        setExpandingCareer(null);
      }
    }

    setExpanded((current) => new Set(current).add(carreraId));
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
              onFocus={() => void ensureCatalog().catch(() => undefined)}
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
          {isSearchingCatalog
            ? 'Buscando también por materia…'
            : catalogError && query.trim()
              ? 'No pudimos completar la búsqueda por materia. Podés buscar por carrera o intentar de nuevo.'
              : filteredCarreras.length === 0
                ? 'No encontramos pregunteros con esos filtros.'
                : `${filteredCarreras.length} ${filteredCarreras.length === 1 ? 'carrera encontrada' : 'carreras encontradas'}. Abrí una carrera para ver sus materias.`}
        </p>
      </div>

      {!isSearchingCatalog && filteredCarreras.length === 0 ? (
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
            const isLoadingCareer = expandingCareer === carrera.carreraId;
            const panelId = `preguntero-carrera-${carrera.carreraId}`;
            const materias = carrera.materias ?? catalogByCareer.get(carrera.carreraId)?.materias ?? [];

            return (
              <section key={carrera.carreraId} className="py-1">
                <button
                  type="button"
                  onClick={() => void toggleCarrera(carrera.carreraId)}
                  aria-expanded={isExpanded}
                  aria-controls={panelId}
                  aria-busy={isLoadingCareer}
                  className="group flex w-full min-w-0 items-center gap-3 px-1 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold tracking-[0.08em] text-indigo-700 uppercase">{carrera.universidadNombre}</p>
                    <h2 className="mt-1 break-words text-base font-bold tracking-[-0.025em] text-slate-950 sm:text-lg">{carrera.carreraNombre}</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {isLoadingCareer
                        ? 'Cargando materias…'
                        : `${carrera.materiaCount} ${carrera.materiaCount === 1 ? 'materia con preguntero' : 'materias con preguntero'}`}
                    </p>
                  </div>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition group-hover:bg-slate-100 group-hover:text-indigo-700">
                    <ChevronDown className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} aria-hidden="true" />
                  </span>
                </button>

                {isExpanded ? (
                  <ul id={panelId} className="grid gap-1 pb-4 sm:grid-cols-2">
                    {materias.map((materia) => (
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
