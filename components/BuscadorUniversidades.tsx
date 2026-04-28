'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, GraduationCap, Search, X } from 'lucide-react';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase-client';
import { getCareerRoute, getUniversityRoute } from '@/lib/routes';
import { Spinner } from '@/components/ui/spinner';

type SearchResult = {
  id: string;
  nombre: string;
  tipo: 'universidad' | 'carrera';
};

interface BuscadorUniversidadesProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BuscadorUniversidades({ open, onOpenChange }: BuscadorUniversidadesProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [siglo21Id, setSiglo21Id] = useState<string | null>(null);
  const [fetchingSiglo, setFetchingSiglo] = useState(true);

  const search = useCallback(async (value: string) => {
    if (value.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);

    try {
      const [universidades, carreras] = await Promise.all([
        supabase.from('universidades').select('id, nombre').ilike('nombre', `%${value}%`).limit(5),
        supabase.from('carreras').select('id, nombre').ilike('nombre', `%${value}%`).limit(5),
      ]);

      const merged: SearchResult[] = [
        ...(universidades.data ?? []).map((item) => ({
          id: item.id,
          nombre: item.nombre,
          tipo: 'universidad' as const,
        })),
        ...(carreras.data ?? []).map((item) => ({
          id: item.id,
          nombre: item.nombre,
          tipo: 'carrera' as const,
        })),
      ];

      setResults(merged);
    } catch (error) {
      console.error('Error searching universities:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void search(query);
    }, 200);

    return () => clearTimeout(timeout);
  }, [query, search]);

  useEffect(() => {
    async function fetchSiglo21() {
      try {
        const { data } = await supabase
          .from('universidades')
          .select('id')
          .ilike('nombre', '%siglo 21%')
          .single();

        if (data) {
          setSiglo21Id(data.id);
        }
      } catch (error) {
        console.error('Error fetching Siglo 21:', error);
      } finally {
        setFetchingSiglo(false);
      }
    }

    void fetchSiglo21();
  }, []);

  const handleSelect = (result: SearchResult) => {
    onOpenChange(false);
    setQuery('');
    setResults([]);

    router.push(
      result.tipo === 'universidad' ? getUniversityRoute(result.id) : getCareerRoute(result.id)
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-auto w-full max-w-full rounded-[20px] p-0" showCloseButton={false}>
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="sr-only">Buscador de universidades</DialogTitle>
          <DialogDescription className="sr-only">
            Encuentra tu carrera y universidad para empezar a estudiar.
          </DialogDescription>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-slate-400" />
              <input
                autoFocus
                placeholder="Escribe el nombre de tu universidad o carrera..."
                className="w-full flex-1 border-0 bg-transparent p-3 text-lg font-medium outline-none placeholder:text-slate-400"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <DialogClose asChild>
              <button className="rounded-full p-1 text-gray-400 transition-all hover:bg-gray-100 hover:text-slate-900">
                <X className="h-5 w-5" />
              </button>
            </DialogClose>
          </div>
        </DialogHeader>

        <div className="border-b border-slate-100 px-6 pb-4">
          {!fetchingSiglo && siglo21Id ? (
            <button
              onClick={() => {
                router.push(getUniversityRoute(siglo21Id));
                onOpenChange(false);
              }}
              className="flex w-full items-center gap-3 rounded-[12px] border border-[#E5E7EB] bg-white p-3 text-left transition-all hover:border-slate-300 hover:shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold leading-tight">Universidad Siglo 21</div>
                <div className="text-xs text-slate-500">Acceso directo</div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </button>
          ) : null}
        </div>

        {loading || results.length > 0 ? (
          <div className="max-h-60 overflow-y-auto px-6 py-2">
            {loading ? (
              <Spinner size="sm" className="mx-auto mb-3 block" />
            ) : null}
            {results.map((result) => (
              <button
                key={`${result.tipo}-${result.id}`}
                onClick={() => handleSelect(result)}
                className="mb-3 flex w-full items-center justify-between rounded-xl bg-gradient-to-r from-[#2563EB] to-[#6366F1] p-4 text-white"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/40 text-[#0F1B3D]">
                    <GraduationCap className="h-4 w-4" />
                  </div>
                  <span className="truncate text-lg font-semibold">{result.nombre}</span>
                </div>
                <span className="rounded-full bg-white/20 px-2 py-1 text-xs text-white/90">
                  {result.tipo === 'universidad' ? 'Universidad' : 'Carrera'}
                </span>
              </button>
            ))}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export default BuscadorUniversidades;
