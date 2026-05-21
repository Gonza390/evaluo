'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  BookOpen,
  Building2,
  GraduationCap,
  Search,
  Sparkles,
} from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import { getUniversityRoute } from '@/lib/routes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ElegantLoader } from '@/components/ui/elegant-loader';
import type { ExplorarUniversidad } from './data';

function getUniversityBadge(
  universidad: ExplorarUniversidad,
  topCarreras: number,
  topMaterias: number
) {
  if (universidad.carrerasCount === topCarreras && topCarreras > 0) {
    return 'Mas completa';
  }

  if (universidad.materiasCount === topMaterias && topMaterias > 0) {
    return 'Mas contenido';
  }

  if (universidad.carrerasCount >= 8 || universidad.materiasCount >= 80) {
    return 'Destacada';
  }

  return 'Activa';
}

function getActivityLabel(universidad: ExplorarUniversidad) {
  if (universidad.materiasCount >= 100) return 'Actividad alta';
  if (universidad.materiasCount >= 50) return 'Actividad constante';
  if (universidad.materiasCount >= 20) return 'Actividad en crecimiento';
  return 'Nueva en biblioteca';
}

async function fetchUniversidadesClient() {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('REQUEST_TIMEOUT')), 10000);
  });

  const queryPromise = Promise.all([
    supabase.from('universidades').select('id, nombre').order('nombre'),
    supabase.from('carreras').select('id, universidad_id'),
    supabase.from('carrera_materias').select('carrera_id, materia_id'),
  ]);

  const [universidadesResult, carrerasResult, carreraMateriasResult] = await Promise.race([
    queryPromise,
    timeoutPromise,
  ]);

  if (universidadesResult.error) {
    throw universidadesResult.error;
  }

  if (carrerasResult.error) {
    throw carrerasResult.error;
  }

  if (carreraMateriasResult.error) {
    throw carreraMateriasResult.error;
  }

  const carrerasPorUniversidad = new Map<string, string[]>();
  const materiasPorUniversidad = new Map<string, Set<string>>();
  const carreraToUniversity = new Map<string, string>();

  for (const carrera of carrerasResult.data ?? []) {
    const universityId = carrera.universidad_id;
    if (!universityId) continue;
    carreraToUniversity.set(carrera.id, universityId);
    const current = carrerasPorUniversidad.get(universityId) ?? [];
    current.push(carrera.id);
    carrerasPorUniversidad.set(universityId, current);
  }

  for (const relation of carreraMateriasResult.data ?? []) {
    const carreraId = relation.carrera_id;
    const materiaId = relation.materia_id;
    if (!carreraId || !materiaId) continue;
    const universityId = carreraToUniversity.get(carreraId);
    if (!universityId) continue;
    const current = materiasPorUniversidad.get(universityId) ?? new Set<string>();
    current.add(materiaId);
    materiasPorUniversidad.set(universityId, current);
  }

  return (universidadesResult.data ?? []).map((universidad) => ({
    id: universidad.id,
    nombre: universidad.nombre,
    carrerasCount: carrerasPorUniversidad.get(universidad.id)?.length ?? 0,
    materiasCount: materiasPorUniversidad.get(universidad.id)?.size ?? 0,
  }));
}

export function ExplorarClient({
  initialUniversidades,
}: {
  initialUniversidades: ExplorarUniversidad[];
}) {
  const [universidades, setUniversidades] = useState<ExplorarUniversidad[]>(initialUniversidades);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(initialUniversidades.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const searchParams = useSearchParams();
  const router = useRouter();

  const legacyUniversityId =
    searchParams.get('universidadId') || searchParams.get('unild') || searchParams.get('uniId');
  const presetUniversityName = searchParams.get('universidad');

  useEffect(() => {
    if (legacyUniversityId) {
      router.replace(getUniversityRoute(legacyUniversityId));
      return;
    }

    let isMounted = true;

    async function hydrateUniversidades() {
      if (reloadToken === 0 && initialUniversidades.length > 0) {
        if (presetUniversityName) {
          const normalizedPreset = presetUniversityName.trim().toLowerCase();
          const matchedUniversity = initialUniversidades.find(
            (universidad) => universidad.nombre.trim().toLowerCase() === normalizedPreset
          );

          if (matchedUniversity) {
            router.replace(getUniversityRoute(matchedUniversity.id));
            return;
          }
        }

        setUniversidades(initialUniversidades);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const enrichedUniversidades = await fetchUniversidadesClient();

        if (presetUniversityName) {
          const normalizedPreset = presetUniversityName.trim().toLowerCase();
          const matchedUniversity = enrichedUniversidades.find(
            (universidad) => universidad.nombre.trim().toLowerCase() === normalizedPreset
          );

          if (matchedUniversity) {
            router.replace(getUniversityRoute(matchedUniversity.id));
            return;
          }
        }

        if (isMounted) {
          setUniversidades(enrichedUniversidades);
        }
      } catch (fetchError) {
        console.error('Error fetching universities:', fetchError);
        if (isMounted) {
          const isTimeout =
            fetchError instanceof Error && fetchError.message === 'REQUEST_TIMEOUT';
          setError(
            isTimeout
              ? 'La carga esta demorando demasiado. Revisa tu conexion e intenta de nuevo.'
              : 'No pudimos cargar las universidades.'
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void hydrateUniversidades();

    return () => {
      isMounted = false;
    };
  }, [initialUniversidades, legacyUniversityId, presetUniversityName, reloadToken, router]);

  const filteredUniversidades = useMemo(
    () =>
      universidades.filter((universidad) =>
        universidad.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [searchTerm, universidades]
  );

  const totalCarreras = useMemo(
    () => universidades.reduce((acc, universidad) => acc + universidad.carrerasCount, 0),
    [universidades]
  );

  const totalMaterias = useMemo(
    () => universidades.reduce((acc, universidad) => acc + universidad.materiasCount, 0),
    [universidades]
  );

  const topCarreras = useMemo(
    () => Math.max(...universidades.map((universidad) => universidad.carrerasCount), 0),
    [universidades]
  );

  const topMaterias = useMemo(
    () => Math.max(...universidades.map((universidad) => universidad.materiasCount), 0),
    [universidades]
  );

  if (loading) {
    return (
      <div className="component-loader">
        <ElegantLoader variant="component" size="md" text="Explorando universidades..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <Card className="surface-panel rounded-[var(--radius-panel)]">
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent className="py-8 text-center text-slate-600">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => setReloadToken((current) => current + 1)}
              className="mt-4 inline-flex items-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Reintentar
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-page-enter mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <section className="surface-panel animate-surface-reveal overflow-hidden px-4 py-4 sm:px-6 sm:py-7">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-600">
              <Sparkles className="h-3.5 w-3.5" />
              Explorar
            </div>
            <h1 className="mt-3 text-[1.72rem] font-black tracking-[-0.05em] text-slate-950 sm:mt-4 sm:text-[2.6rem]">
              Elige tu universidad y entra a una ruta de estudio clara.
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:mt-3 sm:text-base sm:leading-7">
              Desde aca puedes descubrir universidades, revisar cuantas carreras y materias ya
              tienen contenido cargado y entrar directo al recorrido academico que te corresponde.
            </p>
          </div>

          <div className="hidden grid-cols-3 gap-3 sm:grid sm:min-w-[360px]">
            <div className="surface-card rounded-[var(--radius-card)] bg-slate-50/90 px-3 py-3 shadow-none">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                Universidades
              </p>
              <p className="mt-2 text-xl font-black text-slate-950">{universidades.length}</p>
            </div>
            <div className="surface-card rounded-[var(--radius-card)] bg-slate-50/90 px-3 py-3 shadow-none">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                Carreras
              </p>
              <p className="mt-2 text-xl font-black text-slate-950">{totalCarreras}</p>
            </div>
            <div className="surface-card rounded-[var(--radius-card)] bg-slate-50/90 px-3 py-3 shadow-none">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                Materias
              </p>
              <p className="mt-2 text-xl font-black text-slate-950">{totalMaterias}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 max-w-xl sm:mt-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Buscar universidad..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="h-11 rounded-2xl border-slate-200 bg-white pl-10 text-sm shadow-sm"
            />
          </div>
        </div>
      </section>

      {filteredUniversidades.length === 0 ? (
        <Card className="surface-panel mt-6 rounded-[var(--radius-panel)]">
          <CardContent className="py-14 text-center">
            <Building2 className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <h2 className="text-xl font-semibold text-slate-900">No encontramos universidades</h2>
            <p className="mt-2 text-slate-500">Prueba con otro termino de busqueda.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredUniversidades.map((universidad, index) => {
            const badge = getUniversityBadge(universidad, topCarreras, topMaterias);
            const activityLabel = getActivityLabel(universidad);

            return (
              <Link
                key={universidad.id}
                href={getUniversityRoute(universidad.id)}
                className="block"
              >
                <Card
                  className="surface-card animate-surface-reveal h-full overflow-hidden rounded-[var(--radius-card)] border border-slate-200/80 bg-white/96 transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-[var(--shadow-panel)]"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                        <Building2 className="h-6 w-6" />
                      </div>
                      <span className="inline-flex items-center rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-600">
                        {badge}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-0">
                    <div>
                      <CardTitle className="text-[1.35rem] font-black leading-tight tracking-[-0.04em] text-slate-950">
                        {universidad.nombre}
                      </CardTitle>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {activityLabel}. Entra para explorar sus carreras, materias y materiales
                        publicados.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-slate-100 bg-slate-50/90 px-3 py-3">
                        <div className="flex items-center gap-2 text-slate-500">
                          <GraduationCap className="h-4 w-4" />
                          <span className="text-[11px] font-bold uppercase tracking-[0.16em]">
                            Carreras
                          </span>
                        </div>
                        <p className="mt-2 text-xl font-black text-slate-950">
                          {universidad.carrerasCount}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-100 bg-slate-50/90 px-3 py-3">
                        <div className="flex items-center gap-2 text-slate-500">
                          <BookOpen className="h-4 w-4" />
                          <span className="text-[11px] font-bold uppercase tracking-[0.16em]">
                            Materias
                          </span>
                        </div>
                        <p className="mt-2 text-xl font-black text-slate-950">
                          {universidad.materiasCount}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-1">
                      <div className="text-xs text-slate-500">
                        Biblioteca disponible y rutas de estudio por carrera.
                      </div>
                      <div className="inline-flex h-10 shrink-0 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 transition group-hover:border-indigo-200 group-hover:text-indigo-600">
                        Ver carreras
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
