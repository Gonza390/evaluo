'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import { getCareerRoute, getMateriaRoute, getUniversityRoute } from '@/lib/routes';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';

type SearchResult = {
  id: string;
  nombre: string;
  tipo: 'Universidad' | 'Carrera' | 'Materia';
  subtitle: string;
  carreraId?: string | null;
};

interface GlobalSearchProps {
  placeholder?: string;
  className?: string;
  initialOpen?: boolean;
  onSelectResult?: (result: SearchResult) => void;
  autoFocus?: boolean;
}

export default function GlobalSearch({
  placeholder = 'Buscar universidades, carreras o materias...',
  className = '',
  initialOpen = false,
  onSelectResult,
  autoFocus = false,
}: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(initialOpen);
  const [searchError, setSearchError] = useState<string | null>(null);
  const router = useRouter();

  const search = useCallback(async (value: string) => {
    if (value.length < 3) {
      setResults([]);
      setSearchError(null);
      return;
    }

    setLoading(true);
    setSearchError(null);

    try {
      const [universidadesResponse, carrerasResponse, materiasResponse] = await Promise.all([
        supabase.from('universidades').select('id, nombre').ilike('nombre', `%${value}%`).limit(4),
        supabase
          .from('carreras')
          .select('id, nombre, universidad_id')
          .ilike('nombre', `%${value}%`)
          .limit(4),
        supabase
          .from('materias')
          .select('id, nombre, carrera_id')
          .ilike('nombre', `%${value}%`)
          .limit(4),
      ]);

      const formatted: SearchResult[] = [];

      for (const universidad of universidadesResponse.data ?? []) {
        formatted.push({
          id: universidad.id,
          nombre: universidad.nombre,
          tipo: 'Universidad',
          subtitle: 'Universidad',
        });
      }

      for (const carrera of carrerasResponse.data ?? []) {
        formatted.push({
          id: carrera.id,
          nombre: carrera.nombre,
          tipo: 'Carrera',
          subtitle: 'Carrera',
        });
      }

      for (const materia of materiasResponse.data ?? []) {
        formatted.push({
          id: materia.id,
          nombre: materia.nombre,
          tipo: 'Materia',
          subtitle: 'Materia',
          carreraId: materia.carrera_id,
        });
      }

      setResults(formatted);
      if (formatted.length === 0) {
        setSearchError('No encontramos resultados para esa búsqueda.');
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
      setSearchError('No pudimos completar la búsqueda.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void search(query);
    }, 300);

    return () => clearTimeout(timeout);
  }, [query, search]);

  const handleSelect = (item: SearchResult) => {
    setShowResults(false);
    setQuery('');

    const visits = JSON.parse(localStorage.getItem('visitas') || '[]') as Array<{
      id: string;
      nombre: string;
      tipo: 'universidad' | 'carrera' | 'materia';
    }>;

    const visitType =
      item.tipo === 'Universidad'
        ? 'universidad'
        : item.tipo === 'Carrera'
          ? 'carrera'
          : 'materia';

    visits.unshift({
      id: item.id,
      nombre: item.nombre,
      tipo: visitType,
    });
    localStorage.setItem('visitas', JSON.stringify(visits.slice(0, 10)));

    const href =
      item.tipo === 'Universidad'
        ? getUniversityRoute(item.id)
        : item.tipo === 'Carrera'
          ? getCareerRoute(item.id)
          : getMateriaRoute(item.id, item.carreraId);

    router.push(href);
    onSelectResult?.(item);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setSearchError(null);
  };

  const showDropdown = showResults && (loading || results.length > 0 || Boolean(searchError));

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder={placeholder}
            className={`!pl-10 pr-10 ${className}`}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setShowResults(true)}
            autoFocus={autoFocus}
          />

          {query ? (
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 transition-colors hover:bg-slate-100"
              onClick={handleClear}
              aria-label="Limpiar búsqueda"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      {showDropdown ? (
        <div className="absolute left-0 right-0 top-full z-[9999] mt-1 max-h-[70vh] overflow-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
          {loading ? (
            <div className="p-4 text-center">
              <Spinner size="sm" className="mx-auto mb-2" />
              <div className="text-sm text-slate-500">Buscando...</div>
            </div>
          ) : null}

          {!loading && searchError ? (
            <div className="p-4 text-sm text-slate-500">{searchError}</div>
          ) : null}

          {!loading
            ? results.map((item) => (
                <button
                  key={`${item.tipo}-${item.id}`}
                  className="flex w-full items-center gap-3 border-b border-slate-100 p-4 text-left transition-colors first:rounded-t-xl last:rounded-b-xl last:border-b-0 hover:bg-slate-50"
                  onClick={() => handleSelect(item)}
                >
                  <div className="flex-shrink-0">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        item.tipo === 'Universidad'
                          ? 'bg-blue-500'
                          : item.tipo === 'Carrera'
                            ? 'bg-emerald-500'
                            : 'bg-amber-500'
                      }`}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-slate-900">{item.nombre}</div>
                    <div className="truncate text-xs text-slate-500">{item.subtitle}</div>
                  </div>
                </button>
              ))
            : null}
        </div>
      ) : null}
    </div>
  );
}
