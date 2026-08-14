'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, ChevronDown, ChevronUp, Search, Sparkles } from 'lucide-react';
import type { ExplanationHistoryItem } from '@/lib/explanations-history';
import { trackMarketingEvent } from '@/lib/marketing-analytics';
import { Input } from '@/components/ui/input';

function formatDate(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function normalize(value: string) {
  return value.trim().toLocaleLowerCase('es');
}

export function ExplanationsHistoryClient({
  initialHistory,
}: {
  initialHistory: ExplanationHistoryItem[];
}) {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    trackMarketingEvent('explanation_history_viewed', {
      explanation_count: initialHistory.length,
    });
  }, [initialHistory]);

  const groups = useMemo(() => {
    const query = normalize(search);
    const filtered = initialHistory.filter((item) => {
      if (!query) return true;
      return (
        normalize(item.enunciado).includes(query) ||
        normalize(item.explicacion).includes(query) ||
        normalize(item.materiaNombre ?? '').includes(query)
      );
    });

    const map = new Map<string, ExplanationHistoryItem[]>();
    for (const item of filtered) {
      const key = item.materiaNombre ?? 'Otras materias';
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    }
    return Array.from(map.entries());
  }, [initialHistory, search]);

  const toggle = (id: string) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="animate-page-enter min-h-screen bg-gradient-to-br from-background/95 via-white/80 to-indigo-50/20 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
            <Sparkles className="h-3.5 w-3.5" />
            Premium
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-[-0.04em] text-slate-950 sm:text-3xl">
            Historial de explicaciones
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Volvé a revisar las explicaciones de tus errores para fijar cada concepto.
          </p>
        </div>

        <div className="mb-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por materia o contenido..."
              className="h-11 rounded-xl border-slate-200 bg-white pl-10 text-sm"
            />
          </div>
        </div>

        {groups.length === 0 ? (
          <div className="surface-panel flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
            <Sparkles className="h-10 w-10 text-slate-300" />
            <h3 className="text-lg font-semibold text-slate-900">
              {initialHistory.length === 0
                ? 'Todavía no tenés explicaciones guardadas'
                : 'No encontramos explicaciones con ese criterio'}
            </h3>
            <p className="max-w-md text-sm text-slate-500">
              {initialHistory.length === 0
                ? 'Completá un simulador y corregí tus respuestas incorrectas: acá vas a poder repasarlas todas juntas.'
                : 'Probá con otra palabra o materia.'}
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {groups.map(([materiaNombre, items]) => (
              <section
                key={materiaNombre}
                className="surface-panel overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90"
              >
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-indigo-500" />
                    <h2 className="text-sm font-bold text-slate-900">{materiaNombre}</h2>
                  </div>
                  <span className="text-xs font-medium text-slate-400">
                    {items.length} {items.length === 1 ? 'explicación' : 'explicaciones'}
                  </span>
                </div>
                <div className="divide-y divide-slate-100">
                  {items.map((item) => {
                    const isExpanded = expanded.has(item.id);
                    return (
                      <div key={item.id} className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => toggle(item.id)}
                          className="flex w-full items-start justify-between gap-3 text-left"
                        >
                          <div className="min-w-0">
                            <p className="line-clamp-2 text-sm font-medium text-slate-800">
                              {item.enunciado}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              {formatDate(item.createdAt)}
                              {item.parcial ? ` · Parcial ${item.parcial}` : ''}
                            </p>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                          ) : (
                            <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                          )}
                        </button>
                        {isExpanded ? (
                          <div className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50/50 p-3">
                            <p className="text-sm leading-6 text-slate-700">{item.explicacion}</p>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}

        <div className="mt-6 text-center">
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-indigo-600 transition hover:text-indigo-700"
          >
            Volver al dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
