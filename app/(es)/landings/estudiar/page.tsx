import type { Metadata } from 'next';
import Link from 'next/link';
import sitemap from '@/app/sitemap';
import { createPublicClient } from '@/lib/supabase-public';
import { fetchExplorarCatalogData } from '@/lib/data/catalog';
import { parseSeoEntitySlug } from '@/lib/seo-intents';
import { SITE_URL } from '@/lib/site';

// Se regenera cada 6 h. La lista sale del sitemap: cada guía por materia, universidad y carrera
// publicada ahí tiene al menos este enlace interno (evita páginas huérfanas).
export const revalidate = 21600;

const TITLE = 'Guías para estudiar por materia, carrera y universidad';
const DESCRIPTION =
  'Índice de guías de Evaluo para preparar parciales: cómo estudiar cada materia, carreras y universidades con pregunteros, resúmenes y material de práctica.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/landings/estudiar' },
  openGraph: { title: TITLE, description: DESCRIPTION, url: '/landings/estudiar' },
};

type Item = { href: string; label: string; detail?: string };

const collator = new Intl.Collator('es', { sensitivity: 'base' });
const byLabel = (a: Item, b: Item) => collator.compare(a.label, b.label);

function pathsFromSitemap(entries: Awaited<ReturnType<typeof sitemap>>) {
  const base = SITE_URL.replace(/\/$/, '');
  return entries
    .map((entry) => (entry.url.startsWith(base) ? entry.url.slice(base.length) : ''))
    .filter(Boolean);
}

async function loadIndex() {
  const client = createPublicClient();
  const [entries, catalog] = await Promise.all([sitemap(), fetchExplorarCatalogData(client)]);
  const paths = pathsFromSitemap(entries);

  const universidadNombre = new Map(catalog.universidades.map((u) => [u.id, u.nombre]));
  const carreraPorId = new Map(catalog.carreras.map((c) => [c.id, c]));

  const universidades: Item[] = [];
  const carreras: Item[] = [];
  const materiaPaths: Array<{ href: string; id: string; labelSlug: string }> = [];

  for (const path of paths) {
    const universidad = path.match(/^\/universidad\/([^/]+)$/);
    if (universidad) {
      const nombre = universidadNombre.get(universidad[1]);
      if (nombre) universidades.push({ href: path, label: nombre });
      continue;
    }
    const carrera = path.match(/^\/estudiar\/[^/]+\/([^/]+)$/);
    if (carrera) {
      const data = carreraPorId.get(parseSeoEntitySlug(carrera[1]).id);
      if (data) carreras.push({ href: path, label: data.nombre, detail: data.universidadNombre });
      continue;
    }
    const materia = path.match(/^\/landings\/estudiar\/([^/]+)$/);
    if (materia) {
      const { id, labelSlug } = parseSeoEntitySlug(materia[1]);
      materiaPaths.push({ href: path, id, labelSlug });
    }
  }

  const ids = materiaPaths.map((item) => item.id);
  const nombres = new Map<string, string>();
  if (ids.length > 0) {
    const { data } = await client.from('materias').select('id, nombre').in('id', ids);
    for (const row of data ?? []) nombres.set(String(row.id), String(row.nombre ?? '').trim());
  }
  const materias: Item[] = materiaPaths.map((item) => ({
    href: item.href,
    label: nombres.get(item.id) || item.labelSlug.replace(/-/g, ' '),
  }));

  return {
    universidades: universidades.sort(byLabel),
    carreras: carreras.sort(byLabel),
    materias: materias.sort(byLabel),
  };
}

function LinkList({ items, columns = 'sm:columns-2 lg:columns-3' }: { items: Item[]; columns?: string }) {
  return (
    <ul className={`mt-4 gap-8 ${columns}`}>
      {items.map((item) => (
        <li key={item.href} className="break-inside-avoid py-1">
          <Link href={item.href} className="text-ui text-blue-700 underline-offset-2 hover:text-blue-900 hover:underline">
            {item.label}
          </Link>
          {item.detail ? <span className="text-chico text-slate-500"> · {item.detail}</span> : null}
        </li>
      ))}
    </ul>
  );
}

export default async function GuiasPorMateriaPage() {
  const { universidades, carreras, materias } = await loadIndex();

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-titulo font-semibold tracking-titulo text-slate-950 sm:text-destacado">{TITLE}</h1>
      <p className="mt-3 max-w-3xl text-cuerpo leading-relaxed text-slate-600">
        Elegí tu materia para ver cómo preparar el parcial: qué temas repasar, pregunteros para practicar y
        resúmenes disponibles. También podés empezar por tu universidad o tu carrera.
      </p>
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-ui font-semibold">
        <Link href="/landings/parciales" className="text-blue-700 underline underline-offset-2 hover:text-blue-900">
          Cómo preparar parciales
        </Link>
        <Link href="/landings/resumenes" className="text-blue-700 underline underline-offset-2 hover:text-blue-900">
          Resúmenes por materia
        </Link>
        <Link href="/pregunteros" className="text-blue-700 underline underline-offset-2 hover:text-blue-900">
          Pregunteros
        </Link>
      </div>

      {materias.length > 0 ? (
        <section className="mt-10" aria-labelledby="guias-materias">
          <h2 id="guias-materias" className="text-subtitulo font-semibold tracking-titulo text-slate-950">
            Cómo estudiar cada materia ({materias.length})
          </h2>
          <LinkList items={materias} />
        </section>
      ) : null}

      {carreras.length > 0 ? (
        <section className="mt-10" aria-labelledby="guias-carreras">
          <h2 id="guias-carreras" className="text-subtitulo font-semibold tracking-titulo text-slate-950">
            Por carrera
          </h2>
          <LinkList items={carreras} columns="sm:columns-2" />
        </section>
      ) : null}

      {universidades.length > 0 ? (
        <section className="mt-10" aria-labelledby="guias-universidades">
          <h2 id="guias-universidades" className="text-subtitulo font-semibold tracking-titulo text-slate-950">
            Por universidad
          </h2>
          <LinkList items={universidades} columns="sm:columns-2" />
        </section>
      ) : null}
    </main>
  );
}
