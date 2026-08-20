import type { MetadataRoute } from 'next';
import { createPublicClient } from '@/lib/supabase-public';
import { buildSeoEntitySlug } from '@/lib/seo-intents';
import { SITE_URL } from '@/lib/site';
import { fetchExplorarCatalogData } from '@/lib/data/catalog';

function isFulfilled<T>(result: PromiseSettledResult<T>): result is PromiseFulfilledResult<T> {
  return result.status === 'fulfilled';
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL;
  const now = new Date();

  const routes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/explorar`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/pregunteros`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/terminos`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/copyright`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacidad`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/landings/parciales`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/landings/resumenes`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  const client = createPublicClient();
  const fetchAllQuestionFreshness = async () => {
    const pageSize = 1000;
    const rows: Array<{
      materia_id: string | null;
      parcial: number | null;
      creado_at: string | null;
    }> = [];

    for (let from = 0; ; from += pageSize) {
      const { data, error } = await client
        .from('preguntas_banco_public')
        .select('materia_id, parcial, creado_at')
        .range(from, from + pageSize - 1);

      if (error) throw error;
      rows.push(...(data ?? []));
      if (!data || data.length < pageSize) break;
    }

    return { data: rows };
  };
  const [
    universidadesResult,
    materiasResult,
    explorarDataResult,
    frescuraResult,
    resumenesResult,
    recursosResult,
  ] = await Promise.allSettled([
    client.from('universidades').select('id'),
    client.from('materias').select('id, nombre'),
    fetchExplorarCatalogData(client),
    fetchAllQuestionFreshness(),
    client.from('resumenes').select('materia_id').limit(10000),
    client.from('recursos').select('materia_id').limit(10000),
  ]);

  const materiaLastModified = new Map<string, Date>();
  const materiasConPreguntas = new Set<string>();
  const parcialesConPreguntas = new Set<string>();
  if (isFulfilled(frescuraResult)) {
    for (const row of frescuraResult.value.data ?? []) {
      const materiaId = String(row.materia_id ?? '');
      const creadoAt = row.creado_at;
      if (!materiaId || !creadoAt) continue;
      materiasConPreguntas.add(materiaId);
      parcialesConPreguntas.add(`${materiaId}:${Number(row.parcial ?? 1)}`);
      const date = new Date(creadoAt);
      const current = materiaLastModified.get(materiaId);
      if (!current || date.getTime() > current.getTime()) {
        materiaLastModified.set(materiaId, date);
      }
    }
  }

  const materiasConResumenes = new Set<string>();
  if (isFulfilled(resumenesResult)) {
    for (const row of resumenesResult.value.data ?? []) {
      if (row.materia_id) materiasConResumenes.add(String(row.materia_id));
    }
  }
  if (isFulfilled(recursosResult)) {
    for (const row of recursosResult.value.data ?? []) {
      if (row.materia_id) materiasConResumenes.add(String(row.materia_id));
    }
  }

  if (isFulfilled(universidadesResult)) {
    for (const universidad of universidadesResult.value.data ?? []) {
      routes.push({
        url: `${baseUrl}/universidad/${universidad.id}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }
  }

  if (isFulfilled(materiasResult)) {
    for (const materia of materiasResult.value.data ?? []) {
      const lastModified = materiaLastModified.get(materia.id) ?? now;
      const hasQuestions = materiasConPreguntas.has(materia.id);
      const hasSummaries = materiasConResumenes.has(materia.id);
      const hasAcademicContent = hasQuestions || hasSummaries;

      if (!hasAcademicContent) continue;

      routes.push({
        url: `${baseUrl}/explorar/materia/${materia.id}`,
        lastModified,
        changeFrequency: 'weekly',
        priority: 0.7,
      });

      const materiaSlug = buildSeoEntitySlug(materia.nombre, materia.id);
      if (hasQuestions) {
        routes.push({
          url: `${baseUrl}/pregunteros/${materiaSlug}`,
          lastModified,
          changeFrequency: 'weekly',
          priority: 0.75,
        });

        if (parcialesConPreguntas.has(`${materia.id}:1`)) {
          routes.push({
            url: `${baseUrl}/pregunteros/${materiaSlug}/parcial/1`,
            lastModified,
            changeFrequency: 'weekly',
            priority: 0.78,
          });
        }
        if (parcialesConPreguntas.has(`${materia.id}:2`)) {
          routes.push({
            url: `${baseUrl}/pregunteros/${materiaSlug}/parcial/2`,
            lastModified,
            changeFrequency: 'weekly',
            priority: 0.78,
          });
        }
        if (
          parcialesConPreguntas.has(`${materia.id}:1`) &&
          parcialesConPreguntas.has(`${materia.id}:2`)
        ) {
          routes.push({
            url: `${baseUrl}/pregunteros/${materiaSlug}/parcial/integrador`,
            lastModified,
            changeFrequency: 'weekly',
            priority: 0.76,
          });
        }
      }

      if (hasSummaries) {
        routes.push({
          url: `${baseUrl}/resumenes/${materiaSlug}`,
          lastModified,
          changeFrequency: 'weekly',
          priority: 0.65,
        });
      }

      routes.push({
        url: `${baseUrl}/landings/estudiar/${buildSeoEntitySlug(materia.nombre, materia.id)}`,
        lastModified,
        changeFrequency: 'monthly',
        priority: 0.65,
      });
    }
  }

  if (isFulfilled(explorarDataResult)) {
    for (const carrera of explorarDataResult.value.carreras) {
      if (!carrera.universidadId) continue;

      routes.push({
        url: `${baseUrl}/estudiar/${buildSeoEntitySlug(carrera.universidadNombre, carrera.universidadId)}/${buildSeoEntitySlug(carrera.nombre, carrera.id)}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.75,
      });

      routes.push({
        url: `${baseUrl}/simulador-parcial/${buildSeoEntitySlug(carrera.nombre, carrera.id)}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.72,
      });
    }
  }

  return routes;
}
