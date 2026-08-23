import { unstable_cache } from 'next/cache';
import { createPublicClient } from '@/lib/supabase-public';
import { GraduationCap, BookOpen, BookMarked } from 'lucide-react';

interface CatalogCounts {
  universidades: number;
  carreras: number;
  materias: number;
}

const FALLBACK: CatalogCounts = {
  universidades: 1,
  carreras: 43,
  materias: 770,
};

const loadCatalogCounts = unstable_cache(
  async (): Promise<CatalogCounts> => {
    try {
      const client = createPublicClient();

      const [uniRes, carreraRes, materiaRes] = await Promise.all([
        client.from('universidades').select('id', { count: 'exact', head: true }),
        client.from('carreras').select('id', { count: 'exact', head: true }),
        client.from('materias').select('id', { count: 'exact', head: true }),
      ]);

      return {
        universidades: uniRes.count ?? FALLBACK.universidades,
        carreras: carreraRes.count ?? FALLBACK.carreras,
        materias: materiaRes.count ?? FALLBACK.materias,
      };
    } catch {
      return FALLBACK;
    }
  },
  ['catalog-stats-counts'],
  { revalidate: 3600, tags: ['catalog-stats'] }
);

function formatMateriasCount(count: number): string {
  if (count >= 100) {
    const rounded = Math.floor(count / 10) * 10;
    return `${rounded}+`;
  }
  return String(count);
}

export async function CatalogStats() {
  const counts = await loadCatalogCounts();

  const items = [
    {
      icon: GraduationCap,
      value: String(counts.universidades),
      label: counts.universidades === 1 ? 'universidad' : 'universidades',
    },
    {
      icon: BookOpen,
      value: String(counts.carreras),
      label: counts.carreras === 1 ? 'carrera' : 'carreras',
    },
    {
      icon: BookMarked,
      value: formatMateriasCount(counts.materias),
      label: 'materias',
    },
  ];

  return (
    <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 backdrop-blur-sm sm:gap-x-6">
      {items.map((item, idx) => {
        const Icon = item.icon;
        return (
          <div key={item.label} className="flex items-center gap-2">
            {idx > 0 && (
              <span className="mr-2 hidden h-4 w-px bg-white/20 sm:block" aria-hidden="true" />
            )}
            <Icon className="h-4 w-4 text-indigo-300" />
            <span className="text-sm font-bold text-white">{item.value}</span>
            <span className="text-xs text-white/70">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}
