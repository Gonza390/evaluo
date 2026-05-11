'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Building2, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import { getUniversityRoute } from '@/lib/routes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ElegantLoader } from '@/components/ui/elegant-loader';

type Universidad = {
  id: string;
  nombre: string;
};

function ExplorarContent() {
  const [universidades, setUniversidades] = useState<Universidad[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const searchParams = useSearchParams();
  const router = useRouter();

  const legacyUniversityId =
    searchParams.get('universidadId') || searchParams.get('unild') || searchParams.get('uniId');

  useEffect(() => {
    if (legacyUniversityId) {
      router.replace(getUniversityRoute(legacyUniversityId));
      return;
    }

    let isMounted = true;

    async function fetchUniversidades() {
      setLoading(true);
      setError(null);

      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('REQUEST_TIMEOUT')), 10000);
        });

        const queryPromise = supabase
          .from('universidades')
          .select('id, nombre')
          .order('nombre');

        const { data, error: fetchError } = await Promise.race([queryPromise, timeoutPromise]);

        if (fetchError) {
          throw fetchError;
        }

        if (isMounted) {
          setUniversidades(data ?? []);
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

    void fetchUniversidades();

    return () => {
      isMounted = false;
    };
  }, [legacyUniversityId, router, reloadToken]);

  const filteredUniversidades = useMemo(
    () =>
      universidades.filter((universidad) =>
        universidad.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [searchTerm, universidades]
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
      <div className="container mx-auto px-4 py-12">
        <Card>
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
    <div className="animate-page-enter container mx-auto px-4 py-12">
      <div className="animate-surface-reveal mb-12">
        <h1 className="text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
          Explora universidades
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-slate-500">
          Elige tu universidad para navegar carreras, materias, recursos y simuladores con un
          solo criterio de rutas.
        </p>
      </div>

      <div className="animate-surface-reveal mb-8 max-w-sm" style={{ animationDelay: '80ms' }}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Buscar universidad..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="rounded-xl py-2 pl-10"
          />
        </div>
      </div>

      {filteredUniversidades.length === 0 ? (
        <Card className="rounded-3xl">
          <CardContent className="py-16 text-center">
            <Building2 className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <h2 className="text-xl font-semibold text-slate-900">No encontramos universidades</h2>
            <p className="mt-2 text-slate-500">Prueba con otro término de búsqueda.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredUniversidades.map((universidad, index) => (
            <Link key={universidad.id} href={getUniversityRoute(universidad.id)} className="block">
              <Card
                className="animate-surface-reveal h-full rounded-3xl border border-slate-200/70 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-2xl"
                style={{ animationDelay: `${index * 90}ms` }}
              >
                <CardHeader className="items-center pb-3 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                    <Building2 className="h-7 w-7" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 text-center">
                  <CardTitle className="text-2xl font-black tracking-tight text-slate-950">
                    {universidad.nombre}
                  </CardTitle>
                  <div className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-emerald-700">
                    Ver carreras
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ExplorarPage() {
  return (
    <Suspense fallback={<p>Cargando...</p>}>
      <ExplorarContent />
    </Suspense>
  );
}
