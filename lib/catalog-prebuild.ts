// Parámetros para prearmar en el build las páginas públicas del catálogo
// (materias y pregunteros). Sin esto cada deploy arranca con la caché ISR vacía
// y los buscadores regeneran cientos de páginas en funciones (Active CPU).
// Con esto el trabajo lo hace el build, que no cuenta para el límite de CPU.
//
// Solo en el build de producción de Vercel: el CI y los Previews no tienen (o
// no deben usar) las claves de Supabase y siguen generando a pedido. Si la
// consulta falla, se devuelve [] y las páginas se generan a pedido como antes:
// un error acá nunca debe frenar un deploy.
import { createPublicClient } from '@/lib/supabase-public';
import { getCanonicalMateriaId } from '@/lib/materia-aliases';
import { buildSeoEntitySlug } from '@/lib/seo-intents';

const PAGE_SIZE = 1000;

export function canPrebuildCatalogPages() {
  return (
    process.env.VERCEL_ENV === 'production' &&
    Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  );
}

type MateriaRow = { id: string; nombre: string };

async function fetchCanonicalMaterias(): Promise<MateriaRow[]> {
  const client = createPublicClient();
  const rows: MateriaRow[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await client
      .from('materias')
      .select('id, nombre')
      .order('id', { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    rows.push(...((data ?? []) as MateriaRow[]));
    if (!data || data.length < PAGE_SIZE) break;
  }
  // Los alias redirigen a la materia canónica: no vale la pena prearmarlos.
  return rows.filter((row) => row.nombre && getCanonicalMateriaId(row.id) === row.id);
}

async function withFallback<T>(label: string, task: () => Promise<T[]>): Promise<T[]> {
  if (!canPrebuildCatalogPages()) return [];
  try {
    const params = await task();
    console.log(`[catalog-prebuild] ${label}: ${params.length} páginas en el build`);
    return params;
  } catch (error) {
    console.warn(`[catalog-prebuild] ${label}: se generan a pedido`, error);
    return [];
  }
}

/** /explorar/materia-cache/[id] — el proxy reescribe /explorar/materia/<slug>. */
export function getMateriaCachePrebuildParams() {
  return withFallback('materias', async () =>
    (await fetchCanonicalMaterias()).map((row) => ({ id: buildSeoEntitySlug(row.nombre, row.id) }))
  );
}

type PregunteroMateria = { slug: string; materiaId: string; parciales: Set<number> };

async function fetchPregunteroMaterias(): Promise<PregunteroMateria[]> {
  const client = createPublicClient() as unknown as {
    rpc: (name: 'get_public_preguntero_catalog') => Promise<{
      data: Array<{
        materia_id: string | null;
        question_count: number | null;
        parciales: number[] | null;
      }> | null;
      error: { message: string } | null;
    }>;
  };
  const [{ data, error }, materias] = await Promise.all([
    client.rpc('get_public_preguntero_catalog'),
    fetchCanonicalMaterias(),
  ]);
  if (error) throw new Error(error.message);
  const nombres = new Map(materias.map((row) => [row.id, row.nombre]));
  const result: PregunteroMateria[] = [];
  for (const row of data ?? []) {
    const materiaId = String(row.materia_id ?? '');
    const nombre = nombres.get(materiaId);
    if (!nombre || Number(row.question_count ?? 0) <= 0) continue;
    result.push({
      slug: buildSeoEntitySlug(nombre, materiaId),
      materiaId,
      parciales: new Set((row.parciales ?? []).map(Number)),
    });
  }
  return result;
}

/** /pregunteros/[materia] — mismas materias que publica el sitemap. */
export function getPregunteroPrebuildParams() {
  return withFallback('pregunteros', async () =>
    (await fetchPregunteroMaterias()).map((row) => ({ materia: row.slug }))
  );
}

/**
 * /pregunteros/[materia]/parcial/[parcial] — 1, 2 e integrador (si hay ambos),
 * como el sitemap. `skip` excluye combinaciones que ya tienen una ruta fija.
 */
export function getPregunteroParcialPrebuildParams(
  skip: (materiaId: string, parcial: string) => boolean
) {
  return withFallback('pregunteros por parcial', async () => {
    const params: Array<{ materia: string; parcial: string }> = [];
    for (const row of await fetchPregunteroMaterias()) {
      const parciales: string[] = [];
      if (row.parciales.has(1)) parciales.push('1');
      if (row.parciales.has(2)) parciales.push('2');
      if (row.parciales.has(1) && row.parciales.has(2)) parciales.push('integrador');
      for (const parcial of parciales) {
        if (!skip(row.materiaId, parcial)) params.push({ materia: row.slug, parcial });
      }
    }
    return params;
  });
}
